/**
 * One Overpass query per country (PLAN.md 7.2, step 1).
 *
 * The rules come from the public instance's usage policy and its operator's advice:
 * an identifying User-Agent, queries one at a time with a pause between them, and after
 * a 429 or a gateway error (502 to 504) one more try once the server says a slot is free.
 * Then one try on a second instance. No retry loops.
 * https://wiki.openstreetmap.org/wiki/Overpass_API
 */

import { BRAND } from '../lib/brand.ts';
import type { Country } from './countries.ts';

export interface OsmElement {
  /** 'state' is our own marker element: it opens the group of one state's pharmacies. */
  type: 'node' | 'way' | 'relation' | 'state';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface CountryExtract {
  country: string;
  /** Epoch seconds: when Overpass answered. */
  fetched: number;
  /** Which instance answered. */
  instance: string;
  /** The date of the OpenStreetMap data, as Overpass reports it. */
  osmBase?: string;
  elements: OsmElement[];
  /** Element ("n123") to ISO 3166-2 code, for countries whose holidays differ by state. */
  states: Record<string, string>;
}

export interface FetchDeps {
  fetch: typeof fetch;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  contact: string;
  log: (line: string) => void;
}

/** The main public instance, then the one fallback. Never the VK Maps instance (PLAN.md 7.2). */
export const INSTANCES = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter'] as const;

const TIMEOUT_S = 600;
/** How long we are willing to wait for a slot before the one retry. */
const MAX_WAIT_MS = 5 * 60 * 1000;
const DEFAULT_WAIT_MS = 30 * 1000;

export function userAgent(contact: string): string {
  return `${BRAND.toLowerCase()}-data-pipeline/0.1 (${contact})`;
}

export const elementKey = (element: Pick<OsmElement, 'type' | 'id'>): string => `${element.type[0]}${element.id}`;

const PHARMACIES = (area: string): string => `(nwr["amenity"="pharmacy"](area.${area});nwr["healthcare"="pharmacy"](area.${area});)`;

/**
 * The query. Pharmacies are nodes, ways and relations tagged amenity=pharmacy or
 * healthcare=pharmacy inside the country's area, each as one point with its tags.
 *
 * Where holidays differ by state, the same query asks state by state instead, and puts a
 * marker element with the state's ISO 3166-2 code in front of each group. (Asking for the
 * whole country and then sorting it into states inside Overpass timed out on both instances.)
 */
export function buildQuery(country: Country): string {
  const lines = [`[out:json][timeout:${TIMEOUT_S}];`];
  if (country.states) {
    for (const code of Object.keys(country.states)) {
      lines.push(`make state code="${code}";out;`, `area["ISO3166-2"="${code}"]->.a;`, `${PHARMACIES('a')};`, `out center tags;`);
    }
  } else {
    lines.push(`area["ISO3166-1"="${country.code}"]["admin_level"="2"]->.a;`, `${PHARMACIES('a')};`, `out center tags;`);
  }
  return lines.join('\n');
}

interface OverpassAnswer {
  osm3s?: { timestamp_osm_base?: string };
  elements?: OsmElement[];
  remark?: string;
}

/** Splits the answer into the pharmacies and, where asked for, the state of each. */
export function readAnswer(country: Country, answer: OverpassAnswer, fetched: number, instance: string): CountryExtract {
  // Overpass answers 200 with a remark when it ran out of time or memory: the list is then cut short.
  if (answer.remark) throw new Error(`Overpass: ${answer.remark.slice(0, 200)}`);
  if (!Array.isArray(answer.elements)) throw new Error('Overpass: no elements in the answer');

  const elements: OsmElement[] = [];
  const states: Record<string, string> = {};
  const seen = new Set<string>();
  const groups = new Map<string, number>();
  let state: string | undefined;
  for (const element of answer.elements) {
    if (element.type === 'state') {
      state = element.tags?.code;
      if (state) groups.set(state, 0);
      continue;
    }
    if (state) groups.set(state, (groups.get(state) ?? 0) + 1);
    // A pharmacy on a state border can be in two groups: the first one keeps it.
    const key = elementKey(element);
    if (seen.has(key)) continue;
    seen.add(key);
    elements.push(element);
    if (state) states[key] = state;
  }
  // A state without a single pharmacy means its area was not found, not that it has none.
  for (const code of Object.keys(country.states ?? {})) {
    if (!groups.get(code)) throw new Error(`Overpass: no pharmacies came back for ${code}`);
  }
  return { country: country.code, fetched, instance, osmBase: answer.osm3s?.timestamp_osm_base, elements, states };
}

class Busy extends Error {
  waitMs: number;
  constructor(status: number, waitMs: number) {
    super(`HTTP ${status}`);
    this.waitMs = waitMs;
  }
}

async function ask(deps: FetchDeps, instance: string, query: string): Promise<OverpassAnswer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), (TIMEOUT_S + 60) * 1000);
  try {
    const response = await deps.fetch(instance, {
      method: 'POST',
      headers: { 'User-Agent': userAgent(deps.contact), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    // 429: no slot for us. 502, 503 and 504: the instance's gateway got no answer in time.
    if (response.status === 429 || (response.status >= 502 && response.status <= 504)) {
      const after = Number(response.headers.get('retry-after'));
      const wait = Number.isFinite(after) && after > 0 ? after * 1000 : await slotWait(deps, instance);
      // A gateway error is not about our slots: give the instance a moment whatever the status page says.
      throw new Busy(response.status, response.status === 429 ? wait : Math.max(wait, DEFAULT_WAIT_MS));
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as OverpassAnswer;
  } finally {
    clearTimeout(timer);
  }
}

/** The instance's status page says when the next slot is free: "Slot available after: …, in 12 seconds." */
async function slotWait(deps: FetchDeps, instance: string): Promise<number> {
  try {
    const response = await deps.fetch(instance.replace(/interpreter$/, 'status'), { headers: { 'User-Agent': userAgent(deps.contact) } });
    const text = await response.text();
    if (/\d+ slots? available now/.test(text)) return 5000;
    const waits = [...text.matchAll(/in (\d+) seconds/g)].map((match) => Number(match[1]));
    return waits.length > 0 ? (Math.min(...waits) + 2) * 1000 : DEFAULT_WAIT_MS;
  } catch {
    return DEFAULT_WAIT_MS;
  }
}

/**
 * Fetches one country: the main instance, once more after a 429 or a gateway error when the server
 * says a slot is free, then one try on the second instance. Throws when all of that fails;
 * the caller keeps the country's previous data.
 */
export async function fetchCountry(country: Country, deps: FetchDeps): Promise<CountryExtract> {
  const query = buildQuery(country);
  const [main, fallback] = INSTANCES;
  const problems: string[] = [];

  try {
    return readAnswer(country, await ask(deps, main, query), deps.now(), main);
  } catch (error) {
    problems.push(`${host(main)}: ${message(error)}`);
    if (error instanceof Busy && error.waitMs <= MAX_WAIT_MS) {
      deps.log(`${country.code}: ${host(main)} is busy (${error.message}), waiting ${Math.round(error.waitMs / 1000)} s for one more try`);
      await deps.sleep(error.waitMs);
      try {
        return readAnswer(country, await ask(deps, main, query), deps.now(), main);
      } catch (again) {
        problems.push(`${host(main)} again: ${message(again)}`);
      }
    }
  }

  deps.log(`${country.code}: trying ${host(fallback)}`);
  try {
    return readAnswer(country, await ask(deps, fallback, query), deps.now(), fallback);
  } catch (error) {
    problems.push(`${host(fallback)}: ${message(error)}`);
  }
  throw new Error(problems.join('; '));
}

const host = (url: string): string => new URL(url).host;
const message = (error: unknown): string => (error instanceof Error ? (error.name === 'AbortError' ? 'timed out' : error.message) : String(error));
