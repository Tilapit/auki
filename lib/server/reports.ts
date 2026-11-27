import { MIN_REPORTS, TOPICS, isPharmacyId, isReportCountry, parseReport } from '../reports.ts';
import type { Summaries, Summary, Topic } from '../reports.ts';

/**
 * Anonymous pharmacy reports, kept in Supabase (PLAN.md 7.10). Server only: the secret key
 * never reaches the browser, and the browser never talks to the database. A report arrives in
 * the body of POST /api/report and goes on as the arguments of one database function; the
 * summaries come back from another. Nothing here logs, and nothing here reads who is calling:
 * no address of the device, no header about it.
 *
 * What is stored is the function's arguments and the day, which the database sets: the
 * pharmacy's id, its country, up to five answers, and with an answer about the prescription
 * whether it was from another country (supabase/migrations/).
 *
 * How often it can be called has three limits, none of which needs to know the caller:
 * this server instance passes on at most PER_MINUTE reports a minute, and the database takes
 * at most twenty a day for one pharmacy and two thousand a day in all.
 */

export type Unavailable = 'not-configured' | 'upstream';

export type AddResult = { status: 'stored' } | { status: 'invalid' } | { status: 'limit' } | { status: 'unavailable'; reason: Unavailable };

export type SummariesResult = { status: 'ok'; summaries: Summaries } | { status: 'invalid' } | { status: 'unavailable'; reason: Unavailable };

/** Reports this server instance passes on in a minute. A person sends one; this is for a script. */
export const PER_MINUTE = 30;
/** A country's summaries are read from the database at most this often by one instance. */
export const SUMMARIES_MAX_AGE_MS = 5 * 60_000;
const TIMEOUT_MS = 4000;

/** The table's columns, by the names the page uses. */
const COLUMNS: Record<Topic, string> = { prescription: 'prescription', english: 'english', stock: 'stock', shortWait: 'short_wait', stepFree: 'step_free' };

interface Config {
  url: string;
  key: string;
}

type Env = Partial<Record<'SUPABASE_URL' | 'SUPABASE_SECRET_KEY', string>>;

function configOf(env: Env): Config | undefined {
  const url = env.SUPABASE_URL?.trim().replace(/\/+$/, '');
  const key = env.SUPABASE_SECRET_KEY?.trim();
  return url && key ? { url, key } : undefined;
}

export interface Deps {
  env?: Env;
  fetch?: typeof fetch;
  now?: () => number;
}

/** At most `perMinute` passes in any sixty seconds. It counts calls, not callers. */
export function limiter(perMinute: number): (now: number) => boolean {
  const passed: number[] = [];
  return (now) => {
    while (passed.length > 0 && passed[0] <= now - 60_000) passed.shift();
    if (passed.length >= perMinute) return false;
    passed.push(now);
    return true;
  };
}

/** The database has no function of that name that takes those arguments: it has not had the migration that adds one of them. */
const NO_SUCH_FUNCTION = Symbol('no such function');

/** One call of a database function through Supabase's own API. undefined: it did not answer, or not with a result. */
async function call(config: Config, name: string, args: Record<string, unknown>, fetcher: typeof fetch): Promise<unknown> {
  try {
    const response = await fetcher(`${config.url}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.status === 404) {
      // PostgREST's own code for "no function matches the name and the arguments given".
      const problem = (await response.json().catch(() => null)) as { code?: unknown } | null;
      return problem?.code === 'PGRST202' ? NO_SUCH_FUNCTION : undefined;
    }
    if (!response.ok) return undefined;
    return (await response.json()) as unknown;
  } catch {
    return undefined;
  }
}

const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0;
const isDay = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

/** The database's rows as the page gets them. A row of another shape, or of fewer than three reports, is left out. */
export function toSummaries(rows: unknown): Summaries | undefined {
  if (!Array.isArray(rows)) return undefined;
  const summaries: Summaries = {};
  for (const row of rows as Record<string, unknown>[]) {
    if (typeof row !== 'object' || row === null) continue;
    const { pharmacy, reports, first_day: from, last_day: to } = row;
    if (!isPharmacyId(pharmacy) || !isCount(reports) || reports < MIN_REPORTS || !isDay(from) || !isDay(to)) continue;
    const answers: Summary['answers'] = {};
    for (const topic of TOPICS) {
      const yes = row[`${COLUMNS[topic]}_yes`];
      const no = row[`${COLUMNS[topic]}_no`];
      if (isCount(yes) && isCount(no) && yes + no > 0) answers[topic] = { yes, no };
    }
    // Prescriptions from another country: a line of its own, and only from three of them on. A database
    // that has not had the second migration sends no such columns, and then there is no such line.
    const { foreign_yes: abroadYes, foreign_no: abroadNo } = row;
    const foreign = isCount(abroadYes) && isCount(abroadNo) && abroadYes + abroadNo >= MIN_REPORTS ? { yes: abroadYes, no: abroadNo } : undefined;
    summaries[pharmacy] = { count: reports, from, to, answers, ...(foreign ? { foreign } : {}) };
  }
  return summaries;
}

/** A server of its own state: its limiter and what it remembers of the summaries. The app has one; each test makes its own. */
export function reportsServer(deps: Deps = {}) {
  const env = deps.env ?? (process.env as Env);
  const fetcher = deps.fetch ?? fetch;
  const now = deps.now ?? Date.now;
  const pass = limiter(PER_MINUTE);
  const remembered = new Map<string, { at: number; summaries: Summaries }>();

  return {
    /** POST /api/report: one report in. */
    async add(body: unknown): Promise<AddResult> {
      const report = parseReport(body);
      if (!report) return { status: 'invalid' };
      const config = configOf(env);
      if (!config) return { status: 'unavailable', reason: 'not-configured' };
      if (!pass(now())) return { status: 'limit' };
      const args: Record<string, unknown> = { p_pharmacy: report.pharmacy, p_country: report.country };
      for (const topic of TOPICS) if (report.answers[topic] !== undefined) args[`p_${COLUMNS[topic]}`] = report.answers[topic];
      const { foreign } = report.answers;
      let answer = await call(config, 'add_report', foreign === undefined ? args : { ...args, p_foreign: foreign }, fetcher);
      // A database without the second migration has no place for that one answer. The report is
      // stored without it rather than lost: the five answers are what the visitor came to tell.
      if (answer === NO_SUCH_FUNCTION && foreign !== undefined) answer = await call(config, 'add_report', args, fetcher);
      if (answer === 'ok') return { status: 'stored' };
      if (answer === 'limit') return { status: 'limit' };
      return { status: 'unavailable', reason: 'upstream' };
    },

    /** GET /api/report?country=FI: what is shown of that country's pharmacies. */
    async summaries(country: unknown): Promise<SummariesResult> {
      if (!isReportCountry(country)) return { status: 'invalid' };
      const config = configOf(env);
      if (!config) return { status: 'unavailable', reason: 'not-configured' };
      const known = remembered.get(country);
      if (known && now() - known.at < SUMMARIES_MAX_AGE_MS) return { status: 'ok', summaries: known.summaries };
      const summaries = toSummaries(await call(config, 'report_summaries', { p_country: country }, fetcher));
      if (!summaries) return { status: 'unavailable', reason: 'upstream' };
      remembered.set(country, { at: now(), summaries });
      return { status: 'ok', summaries };
    },
  };
}

/** The app's own. */
export const reports = reportsServer();
