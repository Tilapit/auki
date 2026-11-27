import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { GET, POST } from '@/app/api/report/route';
import { dateRange } from '@/lib/format';
import en from '@/lib/i18n/en';
import fi from '@/lib/i18n/fi';
import { MAX_REPORT_BYTES, MIN_REPORTS, REPORTS_DONE_KEY, TOPICS, localDay, parseReport, readDone, readSummaries, writeDone } from '@/lib/reports';
import { PER_MINUTE, SUMMARIES_MAX_AGE_MS, limiter, reportsServer, toSummaries } from '@/lib/server/reports';

/** Invented: no pharmacy has these ids, and the key is no key. */
const ENV = { SUPABASE_URL: 'https://example.supabase.co/', SUPABASE_SECRET_KEY: 'test-secret-not-a-real-one' };
const REPORT = { pharmacy: 'n101', country: 'FI', answers: { prescription: true, shortWait: false } };

/** A fake clock and a fake database API: no test here touches the network or the time. */
function setup(answer: unknown = 'ok', status = 200) {
  let time = Date.UTC(2026, 10, 26, 18, 0, 0);
  const reply = { answer, status };
  const fetch = vi.fn<(...args: unknown[]) => Promise<Response>>(async () => new Response(JSON.stringify(reply.answer), { status: reply.status }));
  const server = reportsServer({ env: ENV, fetch: fetch as unknown as typeof globalThis.fetch, now: () => time });
  return { server, fetch, reply, advance: (ms: number) => (time += ms) };
}

const sent = (fetch: ReturnType<typeof setup>['fetch'], call = 0) => {
  const [url, init] = fetch.mock.calls[call] as unknown as [string, RequestInit];
  return { url, headers: init.headers as Record<string, string>, body: JSON.parse(init.body as string) as Record<string, unknown>, init };
};

const row = (pharmacy: string, reports: number, more: Record<string, unknown> = {}) => ({
  pharmacy,
  reports,
  first_day: '2026-11-12',
  last_day: '2026-11-26',
  prescription_yes: 3,
  prescription_no: 1,
  english_yes: 0,
  english_no: 0,
  stock_yes: 0,
  stock_no: 0,
  short_wait_yes: 2,
  short_wait_no: 2,
  step_free_yes: 1,
  step_free_no: 0,
  ...more,
});

describe('a report as the server accepts it', () => {
  it('is the pharmacy, its country and at least one answer', () => {
    expect(parseReport(REPORT)).toEqual(REPORT);
    expect(parseReport({ pharmacy: 'w4521', country: 'LV', answers: { stepFree: false } })).toEqual({ pharmacy: 'w4521', country: 'LV', answers: { stepFree: false } });
    for (const topic of TOPICS) expect(parseReport({ ...REPORT, answers: { [topic]: true } })?.answers).toEqual({ [topic]: true });
  });

  it('is refused whole when it carries anything else: a position, a text, a day, a name', () => {
    for (const extra of [{ lat: 60.17, lon: 24.94 }, { position: { lat: 60.17, lon: 24.94 } }, { note: 'kiitos' }, { day: '2026-11-26' }, { medicine: 'x' }, { name: 'x' }, { at: 1795716000 }]) {
      expect(parseReport({ ...REPORT, ...extra }), JSON.stringify(extra)).toBeUndefined();
    }
    // Nor inside the answers: only the five topics, each true or false.
    expect(parseReport({ ...REPORT, answers: { prescription: true, comment: 'x' } })).toBeUndefined();
    expect(parseReport({ ...REPORT, answers: { prescription: 'yes' } })).toBeUndefined();
    expect(parseReport({ ...REPORT, answers: { stock: 1 } })).toBeUndefined();
    expect(parseReport({ ...REPORT, answers: { english: null } })).toBeUndefined();
  });

  it('needs a pharmacy id as the tiles have them, a covered country and something said', () => {
    for (const pharmacy of ['', 'yliopiston', 'n', 'x123', 'n12345678901234', 'n12 ', '60.17,24.94', 101, null]) expect(parseReport({ ...REPORT, pharmacy }), String(pharmacy)).toBeUndefined();
    for (const country of ['', 'fi', 'FIN', 'XX', 'US', 'GB', 358, null]) expect(parseReport({ ...REPORT, country }), String(country)).toBeUndefined();
    for (const answers of [{}, [], null, 'yes', undefined]) expect(parseReport({ ...REPORT, answers }), JSON.stringify(answers)).toBeUndefined();
    for (const body of [null, undefined, 'n101', 7, [REPORT]]) expect(parseReport(body)).toBeUndefined();
  });
});

describe('whether the prescription was from another country', () => {
  it('is one more yes or no, taken only with an answer about the prescription', () => {
    expect(parseReport({ pharmacy: 'n101', country: 'FI', answers: { prescription: true, foreign: true } })?.answers).toEqual({ prescription: true, foreign: true });
    expect(parseReport({ pharmacy: 'n101', country: 'FI', answers: { prescription: false, foreign: false } })?.answers).toEqual({ prescription: false, foreign: false });
    // By itself it says nothing of the visit, and with another answer it has nothing to belong to.
    expect(parseReport({ pharmacy: 'n101', country: 'FI', answers: { foreign: true } })).toBeUndefined();
    expect(parseReport({ pharmacy: 'n101', country: 'FI', answers: { english: true, foreign: true } })).toBeUndefined();
    // A yes or a no: never which country.
    expect(parseReport({ pharmacy: 'n101', country: 'FI', answers: { prescription: true, foreign: 'DE' } })).toBeUndefined();
  });

  it('goes to the database as one more argument, and only when it was given', async () => {
    const { server, fetch } = setup();
    await server.add({ pharmacy: 'n101', country: 'FI', answers: { prescription: true, foreign: true } });
    expect(sent(fetch).body).toEqual({ p_pharmacy: 'n101', p_country: 'FI', p_prescription: true, p_foreign: true });
    await server.add(REPORT);
    expect(sent(fetch, 1).body).not.toHaveProperty('p_foreign');
  });

  it('a database that has not had the second migration still takes the report, without that one answer', async () => {
    let time = Date.UTC(2026, 10, 27, 18, 0, 0);
    const calls: Record<string, unknown>[] = [];
    // The first migration's function knows no p_foreign: PostgREST answers 404 with its own code for that.
    const fetch = vi.fn(async (_url: unknown, init: RequestInit) => {
      const body = JSON.parse(init.body as string) as Record<string, unknown>;
      calls.push(body);
      return 'p_foreign' in body ? new Response(JSON.stringify({ code: 'PGRST202', message: 'Could not find the function' }), { status: 404 }) : new Response(JSON.stringify('ok'), { status: 200 });
    });
    const server = reportsServer({ env: ENV, fetch: fetch as unknown as typeof globalThis.fetch, now: () => (time += 1) });
    await expect(server.add({ pharmacy: 'n101', country: 'FI', answers: { prescription: true, foreign: true } })).resolves.toEqual({ status: 'stored' });
    expect(calls).toEqual([
      { p_pharmacy: 'n101', p_country: 'FI', p_prescription: true, p_foreign: true },
      { p_pharmacy: 'n101', p_country: 'FI', p_prescription: true },
    ]);
    // Any other 404, or a report without the new answer, is not sent twice.
    const plain = setup({ code: 'PGRST202' }, 404);
    await expect(plain.server.add(REPORT)).resolves.toEqual({ status: 'unavailable', reason: 'upstream' });
    expect(plain.fetch).toHaveBeenCalledTimes(1);
  });

  it('is shown as its own two counts, only from three such reports on', () => {
    expect(toSummaries([row('n101', 5, { foreign_yes: 2, foreign_no: 1 })])?.n101.foreign).toEqual({ yes: 2, no: 1 });
    expect(toSummaries([row('n101', 5, { foreign_yes: 2, foreign_no: 0 })])?.n101).not.toHaveProperty('foreign');
    expect(toSummaries([row('n101', 5, { foreign_yes: null, foreign_no: null })])?.n101).not.toHaveProperty('foreign');
    // A database without the second migration sends no such columns.
    expect(toSummaries([row('n101', 5)])?.n101).not.toHaveProperty('foreign');
    // And the page reads it as untrusted too.
    const body = { summaries: { n101: { count: 5, from: '2026-11-12', to: '2026-11-26', answers: {}, foreign: { yes: 2, no: 1 } }, n102: { count: 5, from: '2026-11-12', to: '2026-11-26', answers: {}, foreign: { yes: 1, no: 1 } } } };
    expect(readSummaries(body).n101.foreign).toEqual({ yes: 2, no: 1 });
    expect(readSummaries(body).n102).not.toHaveProperty('foreign');
  });
});

describe('POST /api/report, behind the route', () => {
  it('hands the database the pharmacy, the country and the answers given, and nothing else', async () => {
    const { server, fetch } = setup();
    await expect(server.add(REPORT)).resolves.toEqual({ status: 'stored' });
    expect(fetch).toHaveBeenCalledTimes(1);
    const { url, headers, body, init } = sent(fetch);
    expect(url).toBe('https://example.supabase.co/rest/v1/rpc/add_report');
    expect(init.method).toBe('POST');
    // No day, no time, nothing about the caller: the database sets the day itself.
    expect(body).toEqual({ p_pharmacy: 'n101', p_country: 'FI', p_prescription: true, p_short_wait: false });
    // The key goes in the headers our server writes, and no header says who asked.
    expect(Object.keys(headers).sort()).toEqual(['Authorization', 'Content-Type', 'apikey']);
    expect(headers.apikey).toBe(ENV.SUPABASE_SECRET_KEY);
  });

  it('every topic has its own column', async () => {
    const { server, fetch } = setup();
    await server.add({ pharmacy: 'n101', country: 'FI', answers: { prescription: false, english: true, stock: false, shortWait: true, stepFree: false } });
    expect(sent(fetch).body).toEqual({ p_pharmacy: 'n101', p_country: 'FI', p_prescription: false, p_english: true, p_stock: false, p_short_wait: true, p_step_free: false });
  });

  it('a body that is not a report never reaches the database', async () => {
    const { server, fetch } = setup();
    await expect(server.add({ ...REPORT, lat: 60.17, lon: 24.94 })).resolves.toEqual({ status: 'invalid' });
    await expect(server.add({ ...REPORT, answers: {} })).resolves.toEqual({ status: 'invalid' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('without the database’s address or key it says so at once', async () => {
    const fetch = vi.fn();
    for (const env of [{}, { SUPABASE_URL: ENV.SUPABASE_URL }, { SUPABASE_SECRET_KEY: ENV.SUPABASE_SECRET_KEY }, { SUPABASE_URL: ' ', SUPABASE_SECRET_KEY: ' ' }]) {
      const server = reportsServer({ env, fetch: fetch as unknown as typeof globalThis.fetch });
      await expect(server.add(REPORT)).resolves.toEqual({ status: 'unavailable', reason: 'not-configured' });
      await expect(server.summaries('FI')).resolves.toEqual({ status: 'unavailable', reason: 'not-configured' });
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it('the database’s own limit comes back as a limit, and its failure as unavailable', async () => {
    const full = setup('limit');
    await expect(full.server.add(REPORT)).resolves.toEqual({ status: 'limit' });
    const down = setup({ message: 'no' }, 500);
    await expect(down.server.add(REPORT)).resolves.toEqual({ status: 'unavailable', reason: 'upstream' });
    const odd = setup({ unexpected: true });
    await expect(odd.server.add(REPORT)).resolves.toEqual({ status: 'unavailable', reason: 'upstream' });
    const broken = reportsServer({ env: ENV, fetch: (async () => Promise.reject(new Error('offline'))) as unknown as typeof globalThis.fetch });
    await expect(broken.add(REPORT)).resolves.toEqual({ status: 'unavailable', reason: 'upstream' });
  });

  it(`passes on at most ${PER_MINUTE} reports a minute, whoever sends them`, async () => {
    const { server, fetch, advance } = setup();
    for (let index = 0; index < PER_MINUTE; index += 1) await expect(server.add(REPORT)).resolves.toEqual({ status: 'stored' });
    await expect(server.add(REPORT)).resolves.toEqual({ status: 'limit' });
    expect(fetch).toHaveBeenCalledTimes(PER_MINUTE);
    // A body that is not a report does not count against it, and neither does reading.
    await expect(server.add({})).resolves.toEqual({ status: 'invalid' });
    advance(60_001);
    await expect(server.add(REPORT)).resolves.toEqual({ status: 'stored' });
  });

  it('the limiter counts calls in any sixty seconds', () => {
    const pass = limiter(2);
    expect([pass(0), pass(1000), pass(2000)]).toEqual([true, true, false]);
    expect(pass(59_999)).toBe(false);
    // Sixty seconds after the first one, it no longer counts.
    expect(pass(60_000)).toBe(true);
    expect(pass(60_001)).toBe(false);
    expect(pass(61_000)).toBe(true);
  });
});

describe('GET /api/report, behind the route', () => {
  it('gives each pharmacy’s count, days and answers, and leaves out a topic nobody answered', async () => {
    const { server, fetch } = setup([row('n101', 5), row('w202', 3, { prescription_yes: 0, prescription_no: 0 })]);
    await expect(server.summaries('FI')).resolves.toEqual({
      status: 'ok',
      summaries: {
        n101: { count: 5, from: '2026-11-12', to: '2026-11-26', answers: { prescription: { yes: 3, no: 1 }, shortWait: { yes: 2, no: 2 }, stepFree: { yes: 1, no: 0 } } },
        w202: { count: 3, from: '2026-11-12', to: '2026-11-26', answers: { shortWait: { yes: 2, no: 2 }, stepFree: { yes: 1, no: 0 } } },
      },
    });
    expect(sent(fetch).url).toBe('https://example.supabase.co/rest/v1/rpc/report_summaries');
    expect(sent(fetch).body).toEqual({ p_country: 'FI' });
  });

  it(`never shows a pharmacy with fewer than ${MIN_REPORTS} reports, even if the database sent one`, () => {
    expect(MIN_REPORTS).toBe(3);
    expect(toSummaries([row('n101', 2), row('n102', 3), row('n103', 1), row('n104', 0)])).toEqual({ n102: expect.objectContaining({ count: 3 }) });
    // And a row of another shape is no summary.
    expect(toSummaries([row('n101', 4, { first_day: 'yesterday' }), row('not an id', 4), { reports: 9 }, null, 'n101'])).toEqual({});
    expect(toSummaries({ message: 'permission denied' })).toBeUndefined();
    expect(toSummaries(undefined)).toBeUndefined();
  });

  it('asks the database for a country at most once in five minutes', async () => {
    const { server, fetch, advance } = setup([row('n101', 5)]);
    await server.summaries('FI');
    await server.summaries('FI');
    expect(fetch).toHaveBeenCalledTimes(1);
    await server.summaries('EE');
    expect(fetch).toHaveBeenCalledTimes(2);
    advance(SUMMARIES_MAX_AGE_MS + 1);
    await server.summaries('FI');
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('a country the app does not cover is not asked about, and a failure is not remembered', async () => {
    const { server, fetch, reply } = setup({ message: 'no' }, 500);
    for (const country of ['XX', 'fi', '', null, undefined, 'FI; drop']) await expect(server.summaries(country)).resolves.toEqual({ status: 'invalid' });
    expect(fetch).not.toHaveBeenCalled();
    await expect(server.summaries('FI')).resolves.toEqual({ status: 'unavailable', reason: 'upstream' });
    reply.answer = [];
    reply.status = 200;
    await expect(server.summaries('FI')).resolves.toEqual({ status: 'ok', summaries: {} });
  });

  it('the page reads the answer as untrusted too', () => {
    const good = { count: 4, from: '2026-11-12', to: '2026-11-20', answers: { english: { yes: 2, no: 1 }, stock: { yes: 0, no: 0 }, other: { yes: 9, no: 9 } } };
    expect(readSummaries({ summaries: { n101: good, n102: { ...good, count: 2 }, 'bad id': good, n103: { ...good, from: 12 }, n104: null } })).toEqual({
      n101: { count: 4, from: '2026-11-12', to: '2026-11-20', answers: { english: { yes: 2, no: 1 } } },
    });
    for (const body of [null, undefined, {}, { summaries: null }, { summaries: 'x' }, []]) expect(readSummaries(body)).toEqual({});
  });
});

describe('the route itself', () => {
  const post = (body: string, headers: Record<string, string> = {}) => POST(new Request('http://localhost/api/report', { method: 'POST', body, headers }));

  it('takes a report only from our own pages', async () => {
    for (const site of ['cross-site', 'same-site', 'none']) {
      const response = await post(JSON.stringify(REPORT), { 'sec-fetch-site': site });
      expect(response.status, site).toBe(403);
    }
  });

  it('refuses what is not a report before anything else, and is never cached', async () => {
    for (const body of ['', 'not json', '[]', JSON.stringify({ ...REPORT, lat: 60.17 }), JSON.stringify({ ...REPORT, answers: {} }), 'x'.repeat(MAX_REPORT_BYTES + 1)]) {
      const response = await post(body, { 'sec-fetch-site': 'same-origin' });
      expect(response.status, body.slice(0, 20)).toBe(400);
      expect(response.headers.get('cache-control')).toBe('no-store');
    }
  });

  it('without a database it answers 503 at once, to a report and to a reader: the app then offers nothing', async () => {
    // The tests run without the database's address or key, as CI's build does.
    expect(process.env.SUPABASE_URL ?? '').toBe('');
    const stored = await post(JSON.stringify(REPORT), { 'sec-fetch-site': 'same-origin' });
    expect(stored.status).toBe(503);
    expect(await stored.json()).toEqual({ error: 'not-configured' });
    const read = await GET(new Request('http://localhost/api/report?country=FI'));
    expect(read.status).toBe(503);
    expect(read.headers.get('cache-control')).toBe('no-store');
    const bad = await GET(new Request('http://localhost/api/report?country=fi&pharmacy=n101'));
    expect(bad.status).toBe(400);
  });
});

describe('what the database keeps', () => {
  const sql = readdirSync('supabase/migrations')
    .sort()
    .map((file) => readFileSync(`supabase/migrations/${file}`, 'utf8'))
    .join('\n');
  const code = sql.replace(/--.*$/gm, '');

  it('the table has the pharmacy, the country, the day, the five answers and whether the prescription was from another country, and no other column', () => {
    const table = /create table public\.reports \(([\s\S]*?)\n\);/.exec(code)?.[1] ?? '';
    const columns = table
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('constraint'))
      .map((line) => line.split(/\s+/).slice(0, 2).join(' ').replace(/,$/, ''));
    expect(columns).toEqual(['pharmacy text', 'country text', 'day date', 'prescription boolean', 'english boolean', 'stock boolean', 'short_wait boolean', 'step_free boolean']);
    // One later migration adds one column, a boolean that is kept only with an answer about the prescription.
    // No migration adds another without this test being changed with it.
    const added = [...code.matchAll(/add column (\w+) (\w+)/gi)].map((match) => `${match[1]} ${match[2]}`);
    expect(added).toEqual(['foreign_prescription boolean']);
    expect(code).toMatch(/check \(foreign_prescription is null or prescription is not null\)/);
    expect(code).toMatch(/case when p_prescription is null then null else p_foreign end/);
    // Nothing that could hold a moment, an address or a text.
    expect(code).not.toMatch(/timestamp|timestamptz|\binet\b|\bcidr\b|\bjsonb?\b|\buuid\b|serial|identity/i);
  });

  it('row-level security is on, no policy opens it, and the public roles have no rights', () => {
    expect(code).toMatch(/alter table public\.reports enable row level security;/);
    expect(code).not.toMatch(/create policy/i);
    expect(code).toMatch(/revoke all on table public\.reports from public, anon, authenticated;/);
    expect(code).toMatch(/revoke all on function public\.add_report\([^)]*\) from public, anon, authenticated;/);
    expect(code).toMatch(/revoke all on function public\.report_summaries\(text\) from public, anon, authenticated;/);
    expect(code).not.toMatch(/security definer/i);
  });

  it('nothing is shown below three reports, and the day is the database’s own', () => {
    expect(code).toMatch(/having count\(\*\) >= 3/);
    // The two counts about prescriptions from another country are null until there are three such reports.
    expect(code.match(/case when count\(\*\) filter \(where r\.foreign_prescription\) >= 3 then/g)).toHaveLength(2);
    // One function of each name at the end: the first one is dropped before its successor is made.
    expect(code).toMatch(/drop function public\.add_report\(text, text, boolean, boolean, boolean, boolean, boolean\);/);
    expect(code).toMatch(/drop function public\.report_summaries\(text\);/);
    expect(code).toMatch(/today date := \(now\(\) at time zone 'utc'\)::date;/);
  });
});

describe('what the device remembers of its visits', () => {
  const store = (initial?: string) => {
    const kept = new Map<string, string>(initial === undefined ? [] : [[REPORTS_DONE_KEY, initial]]);
    return { kept, getItem: (key: string) => kept.get(key) ?? null, setItem: (key: string, value: string) => void kept.set(key, value) };
  };

  it('the pharmacies answered or passed over today, under one key, and no more than that', () => {
    const device = store();
    expect(readDone('2026-11-26', device)).toEqual([]);
    writeDone('2026-11-26', 'n101', device);
    writeDone('2026-11-26', 'n102', device);
    writeDone('2026-11-26', 'n101', device);
    expect(readDone('2026-11-26', device)).toEqual(['n101', 'n102']);
    expect([...device.kept]).toEqual([[REPORTS_DONE_KEY, '{"day":"2026-11-26","ids":["n101","n102"]}']]);
  });

  it('another day starts with an empty list, and the old one is written over', () => {
    const device = store('{"day":"2026-11-25","ids":["n101","n102"]}');
    expect(readDone('2026-11-26', device)).toEqual([]);
    writeDone('2026-11-26', 'n103', device);
    expect(device.kept.get(REPORTS_DONE_KEY)).toBe('{"day":"2026-11-26","ids":["n103"]}');
  });

  it('what is there is read as untrusted text, and a device without storage remembers nothing', () => {
    for (const raw of ['', 'null', '[]', '{"day":"2026-11-26"}', '{"day":"2026-11-26","ids":"n101"}', 'not json', '7']) expect(readDone('2026-11-26', store(raw)), raw).toEqual([]);
    expect(readDone('2026-11-26', store('{"day":"2026-11-26","ids":["n101",7,null,"n102"]}'))).toEqual(['n101', 'n102']);
    expect(readDone('2026-11-26', undefined)).toEqual([]);
    expect(() => writeDone('2026-11-26', 'n101', undefined)).not.toThrow();
    const full = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
    expect(() => writeDone('2026-11-26', 'n101', full)).not.toThrow();
  });

  it('the day is the device’s own date', () => {
    expect(localDay(new Date(2026, 10, 26, 23, 59))).toBe('2026-11-26');
    expect(localDay(new Date(2027, 0, 3, 0, 0))).toBe('2027-01-03');
  });
});

describe('the texts', () => {
  it('a range of days: an en dash, without spaces in Finnish and with them in English, and one date for one day', () => {
    expect(dateRange('fi', '2026-11-12', '2026-11-26')).toBe('12.11.2026–26.11.2026');
    expect(dateRange('en', '2026-11-12', '2026-11-26')).toBe('12 Nov 2026 – 26 Nov 2026');
    expect(dateRange('fi', '2026-11-26', '2026-11-26')).toBe('26.11.2026');
  });

  it('every topic has its two chips in both languages, a fact says what was said and by how many, and nothing asks for a medicine’s name', () => {
    for (const t of [fi, en]) {
      expect(Object.keys(t.report.topics).sort()).toEqual([...TOPICS].sort());
      for (const topic of TOPICS) {
        const { label, yes, no } = t.report.topics[topic];
        expect(new Set([label, yes, no]).size, topic).toBe(3);
      }
      expect(new Set(Object.values(t.report.foreign)).size).toBe(3);
      const all = JSON.stringify(t.report, (_, value: unknown) => (typeof value === 'function' ? (value as (...args: string[]) => string)('3', '1') : value));
      expect(all).not.toMatch(/[!—]/);
      expect(all).not.toMatch(/ilman reseptiä|without a prescription/i);
    }
    expect(fi.report.summaryMeta('5', '12.11.2026–26.11.2026')).toBe('5 ilmoitusta, 12.11.2026–26.11.2026. Nimettömiä, ei tarkistettuja.');
    expect(fi.report.fact(fi.report.topics.english.yes, '4', '5')).toBe('Englantia puhuttiin, 4/5 käyntiä');
    expect(fi.report.fact(fi.report.topics.stepFree.yes, '3', '3')).toBe('Esteetön sisäänkäynti, 3/3 käyntiä');
    expect(en.report.fact(en.report.topics.english.yes, '4', '5')).toBe('English was spoken, 4 of 5 visits');
    expect(fi.report.foreign.question).toBe('Oliko resepti toisesta maasta?');
  });
});
