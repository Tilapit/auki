import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { BRAND } from '@/lib/brand';
import { INDEX_PATH, borderCell, borderCellCenter, countryInCell, decodeTile, squareAt, tileOf, tilePath } from '@/lib/tiles';
import type { CountryStats, IndexJson, TileJson } from '@/lib/tiles';
import { check, statsOf } from '@/pipeline/check';
import { BORDER_CELLS, EXTENT, countryAt, coverageOf, gridExtent } from '@/pipeline/coverage';
import { COUNTRIES, COUNTRY_CODES, countryByCode } from '@/pipeline/countries';
import type { Country } from '@/pipeline/countries';
import { INSTANCES, buildQuery, fetchCountry, readAnswer, userAgent } from '@/pipeline/fetch';
import type { FetchDeps } from '@/pipeline/fetch';
import { email, insideGrid, normalize, phone, website } from '@/pipeline/normalize';
import { GIVE_UP_AFTER_FAILURES, needsRetry, previousRun, processCountry, readArguments, refreshCountries } from '@/pipeline/run';
import type { Previous } from '@/pipeline/run';
import { buildSite, countryPath, decodeCountry, encodeCountry } from '@/pipeline/write';
import type { CountryData, CountryFile } from '@/pipeline/write';

const fixture = (name: string) => JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/overpass', name), 'utf8'));
const MALTA = countryByCode('MT')!;
/** Switzerland with three cantons, to match the sample. */
const SWISS: Country = { code: 'CH', zone: 'Europe/Zurich', states: { 'CH-BE': 'Bern', 'CH-GE': 'Genf', 'CH-NE': 'Neuenburg' } };
const FETCHED = Date.parse('2026-11-23T13:55:02Z') / 1000;

describe('coverage list', () => {
  it('is every country of the EU and the EEA, and Switzerland (PLAN.md section 8)', () => {
    expect(COUNTRY_CODES).toHaveLength(31);
    expect(new Set(COUNTRY_CODES).size).toBe(31);
    // The 27 of the EU, then Iceland, Liechtenstein and Norway, then Switzerland.
    const eu = 'AT BE BG CY CZ DE DK EE ES FI FR GR HR HU IE IT LT LU LV MT NL PL PT RO SE SI SK'.split(' ');
    expect(eu).toHaveLength(27);
    expect([...COUNTRY_CODES].sort()).toEqual([...eu, 'IS', 'LI', 'NO', 'CH'].sort());
  });

  it('every zone is one the runtime knows', () => {
    for (const country of COUNTRIES) {
      for (const zone of [country.zone, ...(country.west ? [country.west.zone] : [])]) {
        expect(() => new Intl.DateTimeFormat('en', { timeZone: zone }), `${country.code} ${zone}`).not.toThrow();
      }
    }
  });

  it('every state has a name the hours library knows', () => {
    // The library keeps its holiday definitions inside its bundle: read the state names from there.
    const bundle = fs.readFileSync(path.join(__dirname, '../../node_modules/opening_hours/build/opening_hours.js'), 'utf8');
    for (const country of COUNTRIES.filter((c) => c.states)) {
      const block = bundle.match(new RegExp(`\\n\\s*const ${country.code.toLowerCase()} = \\{\\n\\s*PH: (\\[.*\\]),?\\n`));
      expect(block, `holiday definitions of ${country.code}`).not.toBeNull();
      const known = new Set((JSON.parse(block![1]) as { only_states?: string[] }[]).flatMap((holiday) => holiday.only_states ?? []));
      for (const [code, name] of Object.entries(country.states!)) expect(known.has(name), `${code} "${name}"`).toBe(true);
      expect(Object.keys(country.states!).every((code) => code.startsWith(`${country.code}-`))).toBe(true);
    }
  });
});

describe('the Overpass query', () => {
  it('asks for a country in one piece', () => {
    const query = buildQuery(MALTA);
    expect(query).toContain('area["ISO3166-1"="MT"]["admin_level"="2"]');
    expect(query).toContain('nwr["amenity"="pharmacy"]');
    expect(query).toContain('nwr["healthcare"="pharmacy"]');
    expect(query).toContain('out center tags;');
    expect(query).not.toContain('make state');
  });

  it('asks state by state where holidays differ, with a marker before each group', () => {
    const query = buildQuery(SWISS);
    expect(query.match(/make state code="CH-(BE|GE|NE)";out;/g)).toHaveLength(3);
    expect(query).toContain('area["ISO3166-2"="CH-GE"]');
    expect(query).not.toContain('ISO3166-1');
    expect(buildQuery(countryByCode('DE')!).match(/make state/g)).toHaveLength(16);
  });

  it('identifies itself by the product name and the contact address', () => {
    expect(userAgent('someone@example.org')).toBe(`${BRAND.toLowerCase()}-data-pipeline/0.1 (someone@example.org)`);
  });
});

describe('reading an answer', () => {
  it('takes the pharmacies of a country asked for in one piece', () => {
    const extract = readAnswer(MALTA, fixture('malta.json'), FETCHED, INSTANCES[0]);
    expect(extract.elements).toHaveLength(9);
    expect(extract.states).toEqual({});
    expect(extract.osmBase).toBe('2026-11-23T13:55:02Z');
  });

  it('notes the state of each pharmacy, and keeps one on a border in the first group it came in', () => {
    const extract = readAnswer(SWISS, fixture('switzerland.json'), FETCHED, INSTANCES[0]);
    expect(extract.elements.map((element) => element.id)).toEqual([5001, 5002, 5003]);
    expect(extract.states).toEqual({ n5001: 'CH-BE', n5002: 'CH-BE', n5003: 'CH-GE' });
  });

  it('fails when a state comes back empty: its area was not found', () => {
    const answer = fixture('switzerland.json');
    expect(() => readAnswer({ ...SWISS, states: { ...SWISS.states, 'CH-ZH': 'Zürich' } }, answer, FETCHED, INSTANCES[0])).toThrow(/CH-ZH/);
    expect(() => readAnswer(SWISS, { elements: answer.elements.slice(0, 5) }, FETCHED, INSTANCES[0])).toThrow(/CH-NE/);
  });

  it('fails on an answer that Overpass cut short', () => {
    expect(() => readAnswer(MALTA, { elements: [], remark: 'runtime error: Query timed out in "query" at line 3 after 600 seconds.' }, FETCHED, INSTANCES[0])).toThrow(/timed out/);
    expect(() => readAnswer(MALTA, {}, FETCHED, INSTANCES[0])).toThrow();
  });
});

describe('fetching a country', () => {
  type Reply = { status: number; body?: unknown; headers?: Record<string, string> };

  function network(replies: Record<string, Reply[]>) {
    const calls: { url: string; init?: RequestInit }[] = [];
    const sleeps: number[] = [];
    const deps: FetchDeps = {
      fetch: (async (url: string | URL | Request, init?: RequestInit) => {
        calls.push({ url: String(url), init });
        const queue = replies[String(url)];
        const reply = queue?.shift();
        if (!reply) throw new Error(`unexpected request to ${String(url)}`);
        return new Response(typeof reply.body === 'string' ? reply.body : JSON.stringify(reply.body ?? {}), { status: reply.status, headers: reply.headers });
      }) as typeof fetch,
      sleep: async (ms) => {
        sleeps.push(ms);
      },
      now: () => FETCHED,
      contact: 'someone@example.org',
      log: () => {},
    };
    return { deps, calls, sleeps };
  }

  const [MAIN, FALLBACK] = INSTANCES;
  const STATUS = MAIN.replace(/interpreter$/, 'status');
  const ok: Reply = { status: 200, body: fixture('malta.json') };

  it('asks the main instance once when it answers', async () => {
    const { deps, calls, sleeps } = network({ [MAIN]: [ok] });
    const extract = await fetchCountry(MALTA, deps);
    expect(extract.elements).toHaveLength(9);
    expect(extract.instance).toBe(MAIN);
    expect(extract.fetched).toBe(FETCHED);
    expect(calls).toHaveLength(1);
    expect(sleeps).toEqual([]);
    const headers = new Headers(calls[0].init?.headers);
    expect(headers.get('user-agent')).toBe(userAgent('someone@example.org'));
    expect(calls[0].init?.method).toBe('POST');
    expect(decodeURIComponent(String(calls[0].init?.body))).toContain('area["ISO3166-1"="MT"]');
  });

  it('after a 429 waits as long as the server asks, and tries once more', async () => {
    const { deps, calls, sleeps } = network({ [MAIN]: [{ status: 429, headers: { 'retry-after': '7' } }, ok] });
    const extract = await fetchCountry(MALTA, deps);
    expect(extract.instance).toBe(MAIN);
    expect(sleeps).toEqual([7000]);
    expect(calls.map((call) => call.url)).toEqual([MAIN, MAIN]);
  });

  it('after a gateway error asks the status page when a slot is free', async () => {
    const status = 'Connected as: 1\nRate limit: 2\nSlot available after: 2026-11-23T14:00:12Z, in 12 seconds.\n';
    const { deps, calls, sleeps } = network({ [MAIN]: [{ status: 504 }, ok], [STATUS]: [{ status: 200, body: status }] });
    await fetchCountry(MALTA, deps);
    // Twelve seconds to the slot, but never under half a minute after a gateway error.
    expect(sleeps).toEqual([30000]);
    expect(calls.map((call) => call.url)).toEqual([MAIN, STATUS, MAIN]);
  });

  it('after a 429 without a Retry-After waits for the slot the status page names', async () => {
    const status = 'Connected as: 1\nRate limit: 2\nSlot available after: 2026-11-23T14:00:12Z, in 12 seconds.\nSlot available after: 2026-11-23T14:00:40Z, in 40 seconds.\n';
    const { deps, sleeps } = network({ [MAIN]: [{ status: 429 }, ok], [STATUS]: [{ status: 200, body: status }] });
    await fetchCountry(MALTA, deps);
    expect(sleeps).toEqual([14000]);
  });

  it('then tries the second instance, once', async () => {
    const { deps, calls } = network({ [MAIN]: [{ status: 429, headers: { 'retry-after': '1' } }, { status: 429, headers: { 'retry-after': '1' } }], [FALLBACK]: [ok] });
    const extract = await fetchCountry(MALTA, deps);
    expect(extract.instance).toBe(FALLBACK);
    expect(calls.map((call) => call.url)).toEqual([MAIN, MAIN, FALLBACK]);
  });

  it('does not ask the main instance again after an error that waiting will not cure', async () => {
    const { deps, calls, sleeps } = network({ [MAIN]: [{ status: 400 }], [FALLBACK]: [ok] });
    await fetchCountry(MALTA, deps);
    expect(calls.map((call) => call.url)).toEqual([MAIN, FALLBACK]);
    expect(sleeps).toEqual([]);
  });

  it('treats an answer that was cut short as a failure', async () => {
    const cut: Reply = { status: 200, body: { elements: [], remark: 'runtime error: Query run out of memory' } };
    const { deps, calls } = network({ [MAIN]: [cut], [FALLBACK]: [ok] });
    const extract = await fetchCountry(MALTA, deps);
    expect(extract.instance).toBe(FALLBACK);
    expect(calls).toHaveLength(2);
  });

  it('gives up after that: three requests at most, no loop', async () => {
    const { deps, calls } = network({ [MAIN]: [{ status: 504, headers: { 'retry-after': '2' } }, { status: 504, headers: { 'retry-after': '2' } }], [FALLBACK]: [{ status: 500 }] });
    await expect(fetchCountry(MALTA, deps)).rejects.toThrow(/overpass-api\.de: HTTP 504; overpass-api\.de again: HTTP 504; overpass\.private\.coffee: HTTP 500/);
    expect(calls).toHaveLength(3);
  });

  it('does not wait for a slot that is more than five minutes away', async () => {
    const { deps, calls, sleeps } = network({ [MAIN]: [{ status: 429, headers: { 'retry-after': '900' } }], [FALLBACK]: [ok] });
    await fetchCountry(MALTA, deps);
    expect(sleeps).toEqual([]);
    expect(calls.map((call) => call.url)).toEqual([MAIN, FALLBACK]);
  });
});

describe('normalising', () => {
  const extract = readAnswer(MALTA, fixture('malta.json'), FETCHED, INSTANCES[0]);
  const { pharmacies, dropped } = normalize(extract, MALTA);
  const byId = (id: string) => pharmacies.find((pharmacy) => pharmacy.id === id)!;

  it('leaves out private pharmacies, duplicates and elements without a position', () => {
    expect(dropped).toEqual({ private: 1, duplicate: 1, noPosition: 1, outsideGrid: 0 });
    expect(pharmacies.map((pharmacy) => pharmacy.id)).toEqual(['n1001', 'n1002', 'n1003', 'n1004', 'n1006', 'r3001']);
  });

  it('leaves out and counts what lies outside the grid: a country here is its European part', () => {
    const france = { code: 'FR', zone: 'Europe/Paris' };
    const at = (id: number, lat: number, lon: number) => ({ type: 'node' as const, id, lat, lon, tags: { amenity: 'pharmacy', name: `Pharmacie ${id}` } });
    // Paris; Saint-Denis on Réunion; Cayenne; Nouméa. And the eastern tip of Cyprus, which the grid holds.
    const overseas = readAnswer(france, { elements: [at(1, 48.8566, 2.3522), at(2, -20.8789, 55.4481), at(3, 4.9372, -52.326), at(4, -22.2758, 166.458), at(5, 35.6, 34.58)] }, FETCHED, INSTANCES[0]);
    const result = normalize(overseas, france);
    expect(result.dropped).toEqual({ private: 0, duplicate: 0, noPosition: 0, outsideGrid: 3 });
    expect(result.pharmacies.map((pharmacy) => pharmacy.id)).toEqual(['n1', 'n5']);
    // What normalize lets through, the grid holds: the two ask the same question.
    const grid = gridExtent();
    for (const point of [{ lat: EXTENT.north, lon: EXTENT.west }, { lat: EXTENT.south, lon: EXTENT.east }, { lat: 35.6, lon: 34.58 }]) expect(insideGrid(point, grid)).toBe(true);
    for (const point of [{ lat: EXTENT.south - 1, lon: 0 }, { lat: 60, lon: EXTENT.east + 1 }, { lat: 60, lon: EXTENT.west - 1 }, { lat: 84, lon: 0 }]) expect(insideGrid(point, grid)).toBe(false);
  });

  it('of a pharmacy mapped twice keeps the record that says more', () => {
    expect(byId('n1001').openingHours).toBe('Mo-Fr 08:00-19:00');
    expect(pharmacies.find((pharmacy) => pharmacy.id === 'w2001')).toBeUndefined();
  });

  it('falls back from name to brand to operator, then to none', () => {
    expect(byId('n1001').name).toBe('Harbour Pharmacy');
    expect(byId('n1003').name).toBe('Gozo Chemists');
    expect(byId('n1006').name).toBe('Sliema Health Ltd');
    expect(byId('n1004').name).toBeNull();
  });

  it('keeps address, contact details, access and the date the hours were checked', () => {
    expect(byId('n1001')).toMatchObject({
      lat: 35.8956,
      lon: 14.4652,
      street: '32 Triq il-Port', // Malta writes the number first
      city: 'Birkirkara',
      country: 'MT',
      zone: 'Europe/Malta',
      phone: '+356 2100 0001',
      website: 'https://harbour-pharmacy.example/',
      wheelchair: 'yes',
      wheelchairNote: 'Step-free from the side door',
      checkDate: '2026-09-20',
    });
    expect(byId('n1001').dispensing).toBeUndefined();
  });

  it('reads the contact: tags, takes the first of several values, and gives a bare host https', () => {
    expect(byId('n1002')).toMatchObject({ phone: '+356 2100 0002', email: 'hello@three-cities.example', website: 'https://www.three-cities.example/', dispensing: false });
  });

  it('drops links and addresses that are not what they claim to be', () => {
    expect(byId('n1003').website).toBeUndefined();
    expect(byId('n1003').email).toBeUndefined();
    expect(byId('n1006').phone).toBeUndefined();
    expect(website('ftp://example.org/file')).toBeUndefined();
    expect(website('http://example.org')).toBe('http://example.org/');
    expect(website('see our facebook page')).toBeUndefined();
    expect(email('a@b.example')).toBe('a@b.example');
    expect(email('a@b')).toBeUndefined();
    expect(phone('+358 9 123 4567')).toBe('+358 9 123 4567');
    expect(phone('112')).toBeUndefined();
  });

  it('puts the street before the number outside Malta', () => {
    const finland = countryByCode('FI')!;
    const result = normalize({ ...extract, country: 'FI', elements: [{ type: 'node', id: 1, lat: 60.17, lon: 24.94, tags: { amenity: 'pharmacy', 'addr:street': 'Mannerheimintie', 'addr:housenumber': '5' } }] }, finland);
    expect(result.pharmacies[0].street).toBe('Mannerheimintie 5');
  });

  it('keeps two different pharmacies that are close, and two of one name that are far apart', () => {
    const at = (id: number, name: string, lat: number) => ({ type: 'node' as const, id, lat, lon: 14.5, tags: { amenity: 'pharmacy', name } });
    const result = normalize({ ...extract, elements: [at(1, 'A', 35.9), at(2, 'B', 35.9001), at(3, 'A', 35.901), at(4, 'a', 35.9002)] }, MALTA);
    // 4 is "A" again, 22 m from 1: the same pharmacy. 3 is 110 m away: another one of the same chain.
    expect(result.pharmacies.map((pharmacy) => pharmacy.id)).toEqual(['n1', 'n2', 'n3']);
  });

  it('gives the state where the country has them', () => {
    const swiss = normalize(readAnswer(SWISS, fixture('switzerland.json'), FETCHED, INSTANCES[0]), SWISS);
    expect(swiss.pharmacies.map((pharmacy) => pharmacy.state)).toEqual(['CH-BE', 'CH-BE', 'CH-GE']);
  });
});

describe('one country from answer to tile rows', () => {
  it('counts what the data page shows', () => {
    const { data } = processCountry(MALTA, readAnswer(MALTA, fixture('malta.json'), FETCHED, INSTANCES[0]));
    expect(data.code).toBe('MT');
    expect(data.stats).toEqual({
      generated: FETCHED,
      pharmacies: 6,
      withHours: 5,
      parsed: 4,
      unparseable: 1,
      uncertain: 0,
      corrected: 1, // "Mo-Su 9-13,16-19": the library adds the minutes
      shareWithHours: 0.8333,
      parseRate: 0.8,
    });
    const kinds = Object.fromEntries(data.pharmacies.map((pharmacy) => [pharmacy.id, pharmacy.hours.kind]));
    expect(kinds).toEqual({ n1001: 'parsed', n1002: 'parsed', n1003: 'unparseable', n1004: 'missing', n1006: 'parsed', r3001: 'parsed' });
  });

  it('gives every pharmacy the time of the fetch and a window of eight local days from that day', () => {
    const { data } = processCountry(MALTA, readAnswer(MALTA, fixture('malta.json'), FETCHED, INSTANCES[0]));
    for (const pharmacy of data.pharmacies) {
      expect(pharmacy.generated).toBe(FETCHED);
      expect(pharmacy.windowFrom).toBe(Date.parse('2026-11-22T23:00:00Z') / 1000); // midnight in Malta
      expect(pharmacy.windowUntil - pharmacy.windowFrom).toBe(8 * 86400);
      expect(pharmacy).not.toHaveProperty('openingHours');
      expect(pharmacy).not.toHaveProperty('state');
    }
  });

  it('uses the holidays of the pharmacy state', () => {
    // 2 January 2027 is a holiday in Bern, not in Geneva. Both say "PH off".
    const fetched = Date.parse('2026-12-30T10:00:00Z') / 1000;
    const { data } = processCountry(SWISS, readAnswer(SWISS, fixture('switzerland.json'), fetched, INSTANCES[0]));
    const openOn2January = (id: string) => {
      const hours = data.pharmacies.find((pharmacy) => pharmacy.id === id)!.hours;
      const day = Date.parse('2027-01-01T23:00:00Z') / 1000;
      return hours.kind === 'parsed' && hours.open.some((interval) => interval.from >= day && interval.from < day + 86400);
    };
    expect(openOn2January('n5001')).toBe(false);
    expect(openOn2January('n5003')).toBe(true);
  });
});

describe('the checks before publishing', () => {
  const stats = (pharmacies: number, parseRate: number): CountryStats => ({ generated: FETCHED, pharmacies, withHours: pharmacies, parsed: Math.round(pharmacies * parseRate), unparseable: 0, uncertain: 0, corrected: 0, shareWithHours: 1, parseRate });

  it('passes a first run and a run like the last one', () => {
    expect(check(stats(800, 0.99), undefined)).toEqual({ ok: true });
    expect(check(stats(805, 0.985), stats(800, 0.99))).toEqual({ ok: true });
  });

  it('fails a count that moved more than 20 % either way: a truncated answer, or a wrong area', () => {
    expect(check(stats(640, 0.99), stats(800, 0.99)).ok).toBe(true);
    expect(check(stats(639, 0.99), stats(800, 0.99)).ok).toBe(false);
    expect(check(stats(960, 0.99), stats(800, 0.99)).ok).toBe(true);
    expect(check(stats(961, 0.99), stats(800, 0.99)).ok).toBe(false);
    expect(check(stats(0, 0), undefined).ok).toBe(false);
  });

  it('fails a parse rate more than two points below the last run: a parser regression', () => {
    expect(check(stats(800, 0.97), stats(800, 0.99)).ok).toBe(true);
    expect(check(stats(800, 0.9699), stats(800, 0.99)).ok).toBe(false);
    const verdict = check(stats(800, 0.9), stats(800, 0.99));
    expect(verdict.ok === false && verdict.reason).toMatch(/parse rate 90\.0 %, 99\.0 % in the last run/);
  });

  it('counts kinds of hours', () => {
    expect(statsOf(FETCHED, [{ kind: 'parsed' }, { kind: 'parsed' }, { kind: 'missing' }, { kind: 'unparseable' }, { kind: 'uncertain' }], 1)).toEqual({
      generated: FETCHED,
      pharmacies: 5,
      withHours: 4,
      parsed: 2,
      unparseable: 1,
      uncertain: 1,
      corrected: 1,
      shareWithHours: 0.8,
      parseRate: 0.5,
    });
  });
});

describe('a run: which countries it refreshes, and what the others keep', () => {
  const some = ['FI', 'EE', 'LV', 'LT', 'MT'].map((code) => countryByCode(code)!);
  const answer = (country: Country, fetched = FETCHED) => ({ ...readAnswer(MALTA, fixture('malta.json'), fetched, INSTANCES[0]), country: country.code });
  /** What the last run published: every country of `some`, fetched a day before. */
  const lastNight = FETCHED - 86400;
  const published = new Map<string, CountryData>(some.map((country) => [country.code, processCountry(country, answer(country, lastNight)).data]));
  const previous = (more: Partial<Record<string, Partial<CountryStats>>> = {}): Previous => ({
    index: { countries: Object.fromEntries([...published].map(([code, data]) => [code, { ...data.stats, ...more[code] }])) } as IndexJson,
    from: 'a test',
    country: async (code) => {
      const data = published.get(code);
      return data && { ...data, stats: { ...data.stats, ...more[code] } };
    },
  });
  const firstRun: Previous = { index: undefined, from: 'nowhere', country: async () => undefined };
  const all = some.map((country) => country.code);
  /** Overpass, as far as a run can tell: answers for every country but the ones named. */
  const overpass = (down: string[]) => {
    const asked: string[] = [];
    const getExtract = async (country: Country) => {
      asked.push(country.code);
      if (down.includes(country.code)) throw new Error('overpass-api.de: HTTP 502; overpass-api.de again: HTTP 502; overpass.private.coffee: HTTP 504');
      return answer(country);
    };
    return { asked, getExtract };
  };
  const states = (outcomes: { code: string; state: string }[]) => Object.fromEntries(outcomes.map((outcome) => [outcome.code, outcome.state]));

  it('reads --retry, and countries given in one argument as a workflow gives them', () => {
    expect(readArguments(['--retry'])).toMatchObject({ retry: true, cached: false, codes: COUNTRY_CODES });
    expect(readArguments(['fi SE', '--cached'])).toMatchObject({ retry: false, cached: true, codes: ['FI', 'SE'] });
    expect(readArguments([''])).toMatchObject({ retry: false, codes: COUNTRY_CODES });
    expect(() => readArguments(['--again'])).toThrow(/Unknown argument/);
  });

  it('refreshes what is asked for and leaves the rest as the last run had it', async () => {
    const { asked, getExtract } = overpass([]);
    const { countries, outcomes } = await refreshCountries({ all: some, asked: ['EE', 'MT'], previous: previous(), getExtract });
    expect(asked).toEqual(['EE', 'MT']);
    expect(states(outcomes)).toEqual({ FI: 'kept', EE: 'fresh', LV: 'kept', LT: 'kept', MT: 'fresh' });
    const generated = Object.fromEntries(countries.map((country) => [country.code, country.stats.generated]));
    expect(generated).toEqual({ FI: lastNight, EE: FETCHED, LV: lastNight, LT: lastNight, MT: FETCHED });
    // Not asked for is not a failure: nothing is marked.
    expect(countries.every((country) => country.stats.kept === undefined)).toBe(true);
  });

  it('keeps the last data of a country that cannot be fetched, and says so in its numbers', async () => {
    const { getExtract } = overpass(['LV']);
    const { countries, outcomes } = await refreshCountries({ all: some, asked: all, previous: previous(), getExtract });
    expect(states(outcomes)).toEqual({ FI: 'fresh', EE: 'fresh', LV: 'kept', LT: 'fresh', MT: 'fresh' });
    const latvia = countries.find((country) => country.code === 'LV')!;
    expect(latvia.stats).toMatchObject({ generated: lastNight, kept: 'fetch' });
    expect(latvia.pharmacies).toEqual(published.get('LV')!.pharmacies);
    expect(outcomes.find((outcome) => outcome.code === 'LV')!.reason).toMatch(/^not fetched: overpass-api\.de: HTTP 502/);
  });

  it('keeps the last data of a country whose new data fails the check', async () => {
    const { getExtract } = overpass([]);
    // The last run had ten times as many pharmacies: tonight's answer looks cut short.
    const before = previous({ EE: { pharmacies: 60 } });
    const { countries, outcomes } = await refreshCountries({ all: some, asked: all, previous: before, getExtract });
    expect(states(outcomes).EE).toBe('kept');
    expect(countries.find((country) => country.code === 'EE')!.stats).toMatchObject({ generated: lastNight, kept: 'check' });
  });

  it('on a first run has nothing to keep: a country that fails is simply not there', async () => {
    const { getExtract } = overpass(['LT']);
    const { countries, outcomes } = await refreshCountries({ all: some, asked: all, previous: firstRun, getExtract });
    expect(states(outcomes).LT).toBe('missing');
    expect(countries.map((country) => country.code)).toEqual(['FI', 'EE', 'LV', 'MT']);
  });

  it('stops asking when three countries in a row get no answer: Overpass is down, and the rest keep their data', async () => {
    expect(GIVE_UP_AFTER_FAILURES).toBe(3);
    const { asked, getExtract } = overpass(all);
    const { countries, outcomes } = await refreshCountries({ all: some, asked: all, previous: previous(), getExtract });
    expect(asked).toEqual(['FI', 'EE', 'LV']);
    expect(states(outcomes)).toEqual({ FI: 'kept', EE: 'kept', LV: 'kept', LT: 'kept', MT: 'kept' });
    expect(countries.map((country) => country.stats.kept)).toEqual(['fetch', 'fetch', 'fetch', 'fetch', 'fetch']);
    expect(outcomes.find((outcome) => outcome.code === 'MT')!.reason).toMatch(/^not asked: Overpass did not answer for the 3 countries before it/);
  });

  it('goes on while failures are scattered: an answer in between starts the count again', async () => {
    const { asked, getExtract } = overpass(['FI', 'EE', 'LT', 'MT']);
    const { outcomes } = await refreshCountries({ all: some, asked: all, previous: previous(), getExtract });
    expect(asked).toEqual(all);
    expect(states(outcomes)).toEqual({ FI: 'kept', EE: 'kept', LV: 'fresh', LT: 'kept', MT: 'kept' });
  });

  it('never gives up on saved answers: a missing file says nothing about Overpass', async () => {
    const { asked, getExtract } = overpass(all);
    await refreshCountries({ all: some, asked: all, previous: previous(), getExtract, giveUpAfter: Infinity });
    expect(asked).toEqual(all);
  });

  describe('the second attempt of the night', () => {
    const now = FETCHED + 2.5 * 3600;
    const index = (more: Partial<Record<string, Partial<CountryStats>>>) => ({ countries: Object.fromEntries(all.map((code) => [code, { ...published.get(code)!.stats, generated: FETCHED, ...more[code] }])) }) as IndexJson;

    it('has nothing to do after a first attempt that refreshed everything', () => {
      expect(needsRetry(all, index({}), now)).toEqual([]);
    });

    it('asks for the countries the first attempt kept from an earlier run, whatever the reason', () => {
      expect(needsRetry(all, index({ EE: { generated: lastNight, kept: 'fetch' }, MT: { generated: lastNight, kept: 'check' } }), now)).toEqual(['EE', 'MT']);
    });

    it('asks for a country the last run has no data for', () => {
      const withoutLatvia = index({});
      delete withoutLatvia.countries.LV;
      expect(needsRetry(all, withoutLatvia, now)).toEqual(['LV']);
    });

    it('asks for everything when the first attempt never ran: data older than twelve hours, or no index at all', () => {
      const old = Object.fromEntries(all.map((code) => [code, { generated: now - 12 * 3600 - 1 }]));
      expect(needsRetry(all, index(old), now)).toEqual(all);
      expect(needsRetry(all, index(Object.fromEntries(all.map((code) => [code, { generated: now - 12 * 3600 }]))), now)).toEqual([]);
      expect(needsRetry(all, undefined, now)).toEqual(all);
    });

    it('stays within the countries asked for', () => {
      expect(needsRetry(['FI', 'EE'], index({ EE: { kept: 'fetch' }, MT: { kept: 'fetch' } }), now)).toEqual(['EE']);
    });

    it('takes the mark off a country that comes through this time', async () => {
      const before = previous({ LV: { kept: 'fetch' }, MT: { kept: 'fetch' } });
      const retry = needsRetry(all, { countries: Object.fromEntries(all.map((code) => [code, { ...before.index!.countries[code], generated: code === 'LV' || code === 'MT' ? lastNight : FETCHED }])) }, now);
      expect(retry).toEqual(['LV', 'MT']);
      const { asked, getExtract } = overpass(['MT']);
      const { countries } = await refreshCountries({ all: some, asked: retry, previous: before, getExtract });
      expect(asked).toEqual(['LV', 'MT']);
      const kept = Object.fromEntries(countries.map((country) => [country.code, country.stats.kept]));
      expect(kept).toEqual({ FI: undefined, EE: undefined, LV: undefined, LT: undefined, MT: 'fetch' });
    });
  });

  describe('reading the last run from the data host', () => {
    const ORIGIN = 'https://data.example.org';
    const nowhere = path.join(os.tmpdir(), 'no-such-site');
    const malta = published.get('MT')!;
    const host = (replies: Record<string, { status: number; body?: unknown } | Error>) =>
      (async (url: string | URL | Request) => {
        const reply = replies[new URL(String(url)).pathname];
        if (!reply) return new Response('not found', { status: 404 });
        if (reply instanceof Error) throw reply;
        return new Response(JSON.stringify(reply.body ?? {}), { status: reply.status });
      }) as typeof fetch;
    const anIndex = { v: 1, generated: lastNight, countries: { MT: malta.stats } };

    it('takes a host that has never been published to as a first run', async () => {
      const last = await previousRun(nowhere, ORIGIN, host({}));
      expect(last.index).toBeUndefined();
      expect(last.from).toMatch(/first run/);
      expect(await last.country('MT')).toBeUndefined();
    });

    it('reads the index and a country file', async () => {
      const last = await previousRun(nowhere, ORIGIN, host({ [INDEX_PATH]: { status: 200, body: anIndex }, [countryPath('MT')]: { status: 200, body: encodeCountry(malta) } }));
      expect(last.index?.countries.MT.pharmacies).toBe(malta.stats.pharmacies);
      expect(last.from).toBe('data.example.org');
      expect(await last.country('MT')).toEqual(malta);
      expect(await last.country('FI')).toBeUndefined();
    });

    it('stops the run when the host cannot say what the last run was: nothing is written over it', async () => {
      await expect(previousRun(nowhere, ORIGIN, host({ [INDEX_PATH]: { status: 503 } }))).rejects.toThrow(/could not be read from data\.example\.org.*HTTP 503/);
      await expect(previousRun(nowhere, ORIGIN, host({ [INDEX_PATH]: new Error('fetch failed') }))).rejects.toThrow(/could not be read from data\.example\.org.*fetch failed/);
    });

    it('stops the run when a country of the last run cannot be read back', async () => {
      const broken = await previousRun(nowhere, ORIGIN, host({ [INDEX_PATH]: { status: 200, body: anIndex }, [countryPath('MT')]: { status: 500 } }));
      await expect(broken.country('MT')).rejects.toThrow(/HTTP 500/);
      const halfPublished = await previousRun(nowhere, ORIGIN, host({ [INDEX_PATH]: { status: 200, body: anIndex } }));
      await expect(halfPublished.country('MT')).rejects.toThrow(/lists MT, but .*countries\/MT\.json is missing/);
    });
  });
});

describe('where the coverage ends', () => {
  it('counts territories that come with a covered country as that country', () => {
    expect(countryAt(60.1, 19.94)).toBe('FI'); // Mariehamn, Åland
    expect(countryAt(35.89, -5.31)).toBe('ES'); // Ceuta
    expect(countryAt(28.12, -15.43)).toBe('ES'); // Las Palmas
    expect(countryAt(37.74, -25.67)).toBe('PT'); // Ponta Delgada
    expect(countryAt(62.01, -6.77)).toBe('FO'); // Tórshavn: not Denmark's pharmacies
    expect(countryAt(56, 3)).toBeNull(); // the North Sea
  });

  it('gives a square that touches a country outside the coverage a grid of country codes', () => {
    const covered = new Set(COUNTRY_CODES);
    // Helsinki: Finland and its waters only.
    expect(coverageOf(tileOf({ lat: 60.17, lon: 24.94 }), covered)).toEqual({ covered: true });
    // London: nothing covered.
    expect(coverageOf(tileOf({ lat: 51.5074, lon: -0.1278 }), covered)).toEqual({ covered: false });
    // Kyrenia, in the north of Cyprus: no country's cell there, so covered only where a pharmacy is (the square's letter).
    expect(countryAt(35.34, 33.32)).toBeNull();
    // Imatra, on the Russian border.
    const imatra = { lat: 61.19, lon: 28.77 };
    const coverage = coverageOf(tileOf(imatra), covered);
    expect(coverage.covered).toBe(true);
    expect(coverage.border?.n).toBe(BORDER_CELLS);
    expect(coverage.border?.cells).toHaveLength(BORDER_CELLS * BORDER_CELLS);
    expect([...coverage.border!.codes].sort()).toEqual(['FI', 'RU']);
    const cell = borderCell(tileOf(imatra), BORDER_CELLS, imatra);
    expect(countryInCell(coverage.border!, cell.column, cell.row)).toBe('FI');
    // Some cell of the same square is across the border, and its middle is in Russia.
    const russian = [...coverage.border!.cells].findIndex((character) => coverage.border!.codes[parseInt(character, 36)] === 'RU');
    const column = russian % BORDER_CELLS;
    const row = Math.floor(russian / BORDER_CELLS);
    expect(countryInCell(coverage.border!, column, row)).toBe('RU');
    const middle = borderCellCenter(tileOf(imatra), BORDER_CELLS, column, row);
    expect(countryAt(middle.lat, middle.lon)).toBe('RU');
    expect(countryInCell(coverage.border!, -1, 0)).toBeNull();
  });
});

describe('writing the site', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tiles-'));
  afterAll(() => fs.rmSync(outDir, { recursive: true, force: true }));

  // A small world: "FI" west of 25.3° east and "RU" east of it, between 59° and 61° north.
  const world = (lat: number, lon: number): string | null => (lat > 59 && lat < 61 && lon > 24 && lon < 26 ? (lon < 25.3 ? 'FI' : 'RU') : null);
  const finland = countryByCode('FI')!;
  const { data } = processCountry(finland, {
    country: 'FI',
    fetched: FETCHED,
    instance: INSTANCES[0],
    elements: [
      { type: 'node', id: 1, lat: 60.1699, lon: 24.9384, tags: { amenity: 'pharmacy', name: 'Keskustan apteekki', opening_hours: 'Mo-Su 08:00-22:00', 'addr:city': 'Helsinki' } },
      { type: 'node', id: 2, lat: 60.1705, lon: 24.941, tags: { amenity: 'pharmacy', name: 'Aseman apteekki', opening_hours: '24/7', 'addr:city': 'Helsinki' } },
    ],
    states: {},
  });
  const summary = buildSite([data], { outDir, now: FETCHED + 60, covered: ['FI'], countryAt: world });
  const index = JSON.parse(fs.readFileSync(path.join(outDir, INDEX_PATH), 'utf8')) as IndexJson;
  const helsinki = tileOf({ lat: 60.1699, lon: 24.9384 });

  it('writes an index with the numbers per country and the grid of squares', () => {
    expect(index.v).toBe(1);
    expect(index.generated).toBe(FETCHED + 60);
    expect(index.attribution).toContain('OpenStreetMap');
    expect(index.countries.FI).toMatchObject({ pharmacies: 2, withHours: 2, parseRate: 1, generated: FETCHED });
    expect(index.grid.rows.every((row) => row.length === index.grid.width)).toBe(true);
    expect(squareAt(index.grid, helsinki)).toBe('d');
    expect(squareAt(index.grid, tileOf({ lat: 59.5, lon: 24.5 }))).toBe('c'); // covered, no pharmacy
    expect(squareAt(index.grid, tileOf({ lat: 60.5, lon: 25.3 }))).toBe('b'); // the border runs through it
    expect(squareAt(index.grid, tileOf({ lat: 48.86, lon: 2.35 }))).toBe('.'); // outside
    expect(squareAt(index.grid, { x: 0, y: 0 })).toBe('.'); // off the grid
  });

  it('writes a tile where there are pharmacies, readable back', () => {
    const file = JSON.parse(fs.readFileSync(path.join(outDir, tilePath(helsinki.x, helsinki.y)), 'utf8')) as TileJson;
    const tile = decodeTile(file);
    expect(tile.pharmacies).toEqual(data.pharmacies);
    expect(file.cities).toEqual(['Helsinki']);
    expect(file.sources).toEqual([{ country: 'FI', zone: 'Europe/Helsinki', generated: FETCHED, from: data.pharmacies[0].windowFrom, until: data.pharmacies[0].windowUntil }]);
  });

  it('writes a tile with only a border grid where the coverage ends, and none where there is nothing to say', () => {
    const edge = tileOf({ lat: 60.5, lon: 25.3 });
    const file = JSON.parse(fs.readFileSync(path.join(outDir, tilePath(edge.x, edge.y)), 'utf8')) as TileJson;
    expect(file.rows).toEqual([]);
    expect(file.border?.codes.sort()).toEqual(['FI', 'RU']);
    const empty = tileOf({ lat: 59.5, lon: 24.5 });
    expect(fs.existsSync(path.join(outDir, tilePath(empty.x, empty.y)))).toBe(false);
    expect(summary.tiles).toBe(summary.squares.d + summary.squares.b);
    expect(summary.borderOnly).toBe(summary.squares.b);
  });

  it('writes a file per country that the next run can fall back on', () => {
    const file = JSON.parse(fs.readFileSync(path.join(outDir, countryPath('FI')), 'utf8')) as CountryFile;
    expect(decodeCountry(file)).toEqual(data);
  });

  it('measures the tiles', () => {
    expect(summary.sizes.largestTile).toBe(`${helsinki.x}/${helsinki.y}`);
    expect(summary.sizes.largestGzip).toBeGreaterThan(100);
    expect(summary.sizes.largestGzip).toBeLessThan(summary.sizes.largest);
    expect(summary.index.gzip).toBeLessThan(5000);
  });

  it('fails loudly when a pharmacy lies outside the grid', () => {
    const far = { ...data, pharmacies: [{ ...data.pharmacies[0], lat: 10, lon: 60 }] };
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tiles-far-'));
    expect(() => buildSite([far], { outDir: dir, now: FETCHED, covered: ['FI'], countryAt: world })).toThrow(/outside the grid/);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
