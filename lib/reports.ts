import { COUNTRY_CODES } from './countries.ts';

/**
 * Anonymous pharmacy reports (PLAN.md 7.10): what a visitor may tell about a visit, and what
 * the app shows of what others told.
 *
 * A report is the pharmacy, its country and up to five answers, and with an answer about the
 * prescription one more yes or no: whether the prescription was from another country. That is
 * all the browser sends (POST /api/report), and with the day, which the server sets, all that
 * is stored: no account, no position, no medicine, no text, and not which country. Reports are
 * shown for a pharmacy only once it has three, as counts with the first and the last day.
 *
 * This file is the contract between the page and the server, and the device's own memory of
 * what it has already been offered. The browser never talks to the database.
 */

export const REPORT_PATH = '/api/report';

/** The five things a report can say. Each is answered yes, no, or not at all. */
export const TOPICS = ['prescription', 'english', 'stock', 'shortWait', 'stepFree'] as const;
export type Topic = (typeof TOPICS)[number];

/**
 * true: the first chip of the pair ("Resepti kävi"). false: the second ("Resepti ei käynyt").
 * `foreign` belongs to the answer about the prescription and is given only with it: whether
 * that prescription was from another country than the pharmacy's. Not which country.
 */
export type Answers = Partial<Record<Topic, boolean>> & { foreign?: boolean };

export interface Report {
  /** The pharmacy's id as the tiles have it: OpenStreetMap's type and number, "n123". */
  pharmacy: string;
  /** The country the pharmacy is in. */
  country: string;
  answers: Answers;
}

/** Below this many reports nothing is shown of a pharmacy, and nothing about it leaves the database. */
export const MIN_REPORTS = 3;

export interface Summary {
  count: number;
  /** The first and the last day a report came, ISO dates. */
  from: string;
  to: string;
  /** How many said yes and how many no, per topic. A topic nobody answered is left out. */
  answers: Partial<Record<Topic, { yes: number; no: number }>>;
  /**
   * Of the reports that said the prescription was from another country: how many said it was
   * accepted and how many that it was not. Only once there are three of them; left out below that.
   */
  foreign?: { yes: number; no: number };
}

/** The summaries of one country, by pharmacy id. Only pharmacies with at least MIN_REPORTS. */
export type Summaries = Record<string, Summary>;

/** A request body is one id, one country and five answers: under two hundred bytes. */
export const MAX_REPORT_BYTES = 512;

const PHARMACY_ID = /^[nwr][0-9]{1,12}$/;
const isCountry = (value: unknown): value is string => typeof value === 'string' && (COUNTRY_CODES as readonly string[]).includes(value);

export const isPharmacyId = (value: unknown): value is string => typeof value === 'string' && PHARMACY_ID.test(value);
export { isCountry as isReportCountry };

/**
 * A report as the server accepts it, or undefined. Strict on purpose: a body with anything
 * the report has no place for (a position, a note, a name) is refused whole, so that nothing
 * extra can ever be sent "just in case" and quietly dropped.
 */
export function parseReport(body: unknown): Report | undefined {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return undefined;
  const { pharmacy, country, answers, ...rest } = body as Record<string, unknown>;
  if (Object.keys(rest).length > 0) return undefined;
  if (!isPharmacyId(pharmacy) || !isCountry(country)) return undefined;
  if (typeof answers !== 'object' || answers === null || Array.isArray(answers)) return undefined;
  const given = Object.entries(answers as Record<string, unknown>);
  if (given.length === 0) return undefined;
  const parsed: Answers = {};
  for (const [topic, value] of given) {
    if (typeof value !== 'boolean') return undefined;
    if (topic === 'foreign') parsed.foreign = value;
    else if ((TOPICS as readonly string[]).includes(topic)) parsed[topic as Topic] = value;
    else return undefined;
  }
  // Where the prescription was from says nothing by itself: it is taken only with what happened to it.
  if (parsed.foreign !== undefined && parsed.prescription === undefined) return undefined;
  return { pharmacy, country, answers: parsed };
}

/** What the page works with. The live app's is `liveReports`; /dev/states and the tests give their own. */
export interface Reports {
  /** What others told of this country's pharmacies. undefined: the service is not there, and then nothing is offered either. */
  summariesFor: (country: string) => Promise<Summaries | undefined>;
  send: (report: Report) => Promise<SendResult>;
  /** Whether this visit has been answered or passed over already, on this device. */
  isDone: (pharmacy: string) => boolean;
  markDone: (pharmacy: string) => void;
}

/** limit: the server takes no more for this pharmacy today. failed: it could not be sent, and may be tried again. */
export type SendResult = 'sent' | 'limit' | 'failed';

/**
 * The device's memory of the visits it has asked about, so that the same visit is never asked
 * about twice: the ids of the pharmacies answered or passed over today, under one key in the
 * browser's local storage. A visit is a pharmacy and a day. When the day changes the list
 * starts empty, so the device never holds more than one day of it. It is never sent anywhere.
 */
export const REPORTS_DONE_KEY = 'reports-done';

/** No one visits this many pharmacies in a day; a list this long is not ours. */
const MAX_DONE = 50;

type Store = Pick<Storage, 'getItem' | 'setItem'>;

/** Private windows and blocked storage throw: then nothing is remembered, and the row is offered again. */
const ownStorage = (): Store | undefined => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

/** What was written is read as untrusted text: anything of another shape, or of another day, is an empty list. */
export function readDone(day: string, store: Store | undefined = ownStorage()): string[] {
  try {
    const value: unknown = JSON.parse(store?.getItem(REPORTS_DONE_KEY) ?? 'null');
    if (typeof value !== 'object' || value === null) return [];
    const { day: kept, ids } = value as { day?: unknown; ids?: unknown };
    if (kept !== day || !Array.isArray(ids)) return [];
    return ids.filter((id): id is string => typeof id === 'string').slice(0, MAX_DONE);
  } catch {
    return [];
  }
}

export function writeDone(day: string, pharmacy: string, store: Store | undefined = ownStorage()): void {
  try {
    const ids = [...new Set([...readDone(day, store), pharmacy])].slice(-MAX_DONE);
    store?.setItem(REPORTS_DONE_KEY, JSON.stringify({ day, ids }));
  } catch {
    // Full or blocked storage: the row may be offered once more. Nothing else depends on it.
  }
}

/** The device's own day, "2026-11-26": only ever compared with itself. */
export function localDay(now: Date): string {
  const two = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
}

const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0;
const isDay = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

/** The server's answer, read as untrusted: a summary of another shape, or of fewer than three reports, is no summary. */
export function readSummaries(body: unknown): Summaries {
  const found: Summaries = {};
  const summaries = (body as { summaries?: unknown } | null)?.summaries;
  if (typeof summaries !== 'object' || summaries === null) return found;
  for (const [pharmacy, raw] of Object.entries(summaries as Record<string, unknown>)) {
    const { count, from, to, answers, foreign } = (raw ?? {}) as Record<string, unknown>;
    if (!isPharmacyId(pharmacy) || !isCount(count) || count < MIN_REPORTS || !isDay(from) || !isDay(to)) continue;
    const kept: Summary['answers'] = {};
    for (const topic of TOPICS) {
      const pair = (answers as Record<string, unknown> | null | undefined)?.[topic] as { yes?: unknown; no?: unknown } | undefined;
      if (pair && isCount(pair.yes) && isCount(pair.no) && pair.yes + pair.no > 0) kept[topic] = { yes: pair.yes, no: pair.no };
    }
    const abroad = foreign as { yes?: unknown; no?: unknown } | null | undefined;
    const enough = abroad && isCount(abroad.yes) && isCount(abroad.no) && abroad.yes + abroad.no >= MIN_REPORTS;
    found[pharmacy] = { count, from, to, answers: kept, ...(enough ? { foreign: { yes: abroad.yes as number, no: abroad.no as number } } : {}) };
  }
  return found;
}

/**
 * The live app's reports: our own server for the summaries and the sending, the browser's
 * local storage for what has been asked already. Each country's summaries are asked for once,
 * the first time a pharmacy's details are opened there: the request names the country and
 * nothing else, so it says less about where the user is than the pharmacy tiles already do.
 */
export function liveReports(today: () => string = () => localDay(new Date())): Reports {
  const asked = new Map<string, Promise<Summaries | undefined>>();
  // The same marks in this page's memory, for a browser that keeps nothing: there the row is not offered twice while the page lives.
  const marked = new Set<string>();
  return {
    summariesFor(country) {
      const known = asked.get(country);
      if (known) return known;
      const answer = fetch(`${REPORT_PATH}?country=${encodeURIComponent(country)}`)
        .then(async (response) => (response.ok ? readSummaries(await response.json()) : undefined))
        .catch(() => undefined);
      asked.set(country, answer);
      // A failure is not remembered: the next pharmacy opened asks again.
      void answer.then((summaries) => {
        if (!summaries) asked.delete(country);
      });
      return answer;
    },
    async send(report) {
      try {
        const response = await fetch(REPORT_PATH, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report) });
        if (response.ok) return 'sent';
        return response.status === 429 ? 'limit' : 'failed';
      } catch {
        return 'failed';
      }
    },
    isDone: (pharmacy) => marked.has(`${today()} ${pharmacy}`) || readDone(today()).includes(pharmacy),
    markDone: (pharmacy) => {
      marked.add(`${today()} ${pharmacy}`);
      writeDone(today(), pharmacy);
    },
  };
}
