import { BRAND } from '../brand';

/**
 * Place search through Nominatim (PLAN.md 7.5). Server only: the browser never talks to
 * Nominatim, and Nominatim sees our server, not the user.
 *
 * Its usage policy sets the rules followed here: at most one request a second, a
 * User-Agent that identifies the application, and no autocomplete.
 * https://operations.osmfoundation.org/policies/nominatim/
 */

export interface Place {
  lat: number;
  lon: number;
  /** Short name for the results title: "Kamppi, Helsinki". */
  label: string;
  /** ISO 3166-1 alpha-2, upper case, when Nominatim gives one. */
  country?: string;
}

export type GeocodeResult =
  /** `places`: what Nominatim answered, best first, at most PLACES_MAX. `place` is the first of them. */
  | { status: 'found'; place: Place; places: Place[] }
  | { status: 'none' }
  | { status: 'invalid' }
  /** not-configured: CONTACT_EMAIL is missing, so we can't identify ourselves and don't call. */
  | { status: 'unavailable'; reason: 'not-configured' | 'upstream' };

export interface Deps {
  fetch: typeof fetch;
  now: () => number;
  sleep: (ms: number) => Promise<void>;
  contact: string | undefined;
}

const ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const MIN_GAP_MS = 1000;
const TIMEOUT_MS = 6000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 500;
/**
 * How many places are asked for and passed on. A name can be a place in several countries
 * ("Kirchplatz", "Rue de la Gare"): the device takes the first unless a hand-off link named a
 * country, and then the first one there (lib/handoff.ts). The country is never sent here: the
 * choice is made on the device, from an answer that is the same for everyone (PLAN.md 7.8).
 */
export const PLACES_MAX = 5;
export const QUERY_MIN = 2;
export const QUERY_MAX = 80;

const LANGUAGES = ['fi', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];
export const isLanguage = (value: string | null): value is Language => (LANGUAGES as readonly string[]).includes(value ?? '');

export function userAgent(contact: string): string {
  return `${BRAND.toLowerCase()}-pharmacy-finder/0.1 (${contact})`;
}

/** Collapses whitespace; undefined when the query is too short or too long to send on. */
export function cleanQuery(raw: string | null): string | undefined {
  const query = (raw ?? '').replace(/\s+/g, ' ').trim();
  return query.length >= QUERY_MIN && query.length <= QUERY_MAX ? query : undefined;
}

interface NominatimHit {
  lat: string;
  lon: string;
  name?: string;
  display_name?: string;
  address?: Record<string, string>;
}

/** "Kamppi, Helsinki": the place and its town, without the county, region and country that follow. */
export function labelFor(hit: NominatimHit): string {
  const first = hit.name || hit.display_name?.split(',')[0]?.trim() || '';
  const address = hit.address ?? {};
  const town = address.city ?? address.town ?? address.village ?? address.municipality;
  return [first, town].filter((part, index, parts): part is string => !!part && parts.indexOf(part) === index).join(', ');
}

// Per server instance: the last upstream call, and what it and its predecessors answered.
let queue: Promise<unknown> = Promise.resolve();
let lastCall = 0;
const cache = new Map<string, { at: number; result: GeocodeResult }>();

const defaults: Deps = {
  fetch: (...args) => fetch(...args),
  now: () => Date.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  contact: process.env.CONTACT_EMAIL,
};

/** For tests: forget earlier calls. */
export function resetGeocode(): void {
  queue = Promise.resolve();
  lastCall = 0;
  cache.clear();
}

export async function geocode(rawQuery: string | null, language: Language, overrides: Partial<Deps> = {}): Promise<GeocodeResult> {
  const deps = { ...defaults, ...overrides };
  const query = cleanQuery(rawQuery);
  if (!query) return { status: 'invalid' };
  if (!deps.contact) return { status: 'unavailable', reason: 'not-configured' };

  const key = `${language}:${query.toLowerCase()}`;
  const cached = cache.get(key);
  if (cached && deps.now() - cached.at < CACHE_TTL_MS) return cached.result;

  // One upstream call at a time, at least a second apart.
  const turn = queue.then(async () => {
    const wait = lastCall + MIN_GAP_MS - deps.now();
    if (wait > 0) await deps.sleep(wait);
    lastCall = deps.now();
    return lookUp(query, language, deps);
  });
  queue = turn.catch(() => undefined);
  const result = await turn;

  // Remember answers, not outages.
  if (result.status !== 'unavailable') {
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
    cache.set(key, { at: deps.now(), result });
  }
  return result;
}

async function lookUp(query: string, language: Language, deps: Deps): Promise<GeocodeResult> {
  const url = new URL(ENDPOINT);
  url.search = new URLSearchParams({ q: query, format: 'jsonv2', limit: String(PLACES_MAX), addressdetails: '1', 'accept-language': language }).toString();
  try {
    const response = await deps.fetch(url, {
      headers: { 'User-Agent': userAgent(deps.contact as string), Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    });
    if (!response.ok) return { status: 'unavailable', reason: 'upstream' };
    const hits = (await response.json()) as NominatimHit[];
    const places = (Array.isArray(hits) ? hits : []).slice(0, PLACES_MAX).flatMap((hit): Place[] => {
      const lat = Number(hit?.lat);
      const lon = Number(hit?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return [];
      return [{ lat, lon, label: labelFor(hit) || query, country: hit.address?.country_code?.toUpperCase() }];
    });
    if (places.length === 0) return { status: 'none' };
    return { status: 'found', place: places[0], places };
  } catch {
    return { status: 'unavailable', reason: 'upstream' };
  }
}
