/**
 * The last search, kept by the tab itself so that the results are there again when the tab is
 * loaded anew: a phone that threw the tab away while its user followed a route in a map app,
 * a change of language, a look at the data page and back (PLAN.md section 5, "First visit").
 *
 * What is kept, in the tab's session storage and nowhere else: the position the search was
 * made for, when, the walking times that came with it, and which pharmacy's details were open.
 * It is the one place where the app keeps a position (PLAN.md 7.6). Nothing here sends it
 * anywhere; it goes when the tab is closed, when the user leaves the results, and it is not
 * used once it is half an hour old: by then the person has moved, and a new search is the answer.
 *
 * The pharmacies themselves are not kept. They are read again from the tiles, so the statuses
 * are those of the moment the tab comes back, never of the moment it was left.
 */

import type { Position } from './state';
import type { Walk, Walks } from './walking';

export const LAST_SEARCH_KEY = 'last-search';
export const LAST_DETAIL_KEY = 'last-detail';

/** Older than this, a search is not brought back. */
export const LAST_SEARCH_MAX_AGE_MS = 30 * 60_000;

export interface LastSearch {
  position: Position;
  /** Local wall-clock time the position was fixed, "HH:mm", as the views show it. */
  at: string;
  /** When the position was fixed, in milliseconds: the age that counts is the position's. */
  fixedAt: number;
  /** The walking times that came, by pharmacy id. Absent when the list was by straight line. */
  walks?: Walks;
}

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Private windows and blocked storage throw: then nothing is kept and nothing comes back. */
const ownStorage = (): Store | undefined => {
  try {
    return globalThis.sessionStorage;
  } catch {
    return undefined;
  }
};

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isPlace = (lat: unknown, lon: unknown): boolean => isNumber(lat) && isNumber(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;

/** What was written is read as untrusted text: anything of another shape is no search at all. */
function readPosition(raw: unknown): Position | undefined {
  const value = raw as Partial<Record<string, unknown>> | null;
  if (typeof value !== 'object' || value === null || !isPlace(value.lat, value.lon)) return undefined;
  const { lat, lon } = value as { lat: number; lon: number };
  if (value.source === 'search' && typeof value.label === 'string') return { source: 'search', lat, lon, label: value.label };
  if (value.source === 'device' && isNumber(value.accuracy) && typeof value.approximate === 'boolean') {
    return { source: 'device', lat, lon, accuracy: value.accuracy, approximate: value.approximate };
  }
  return undefined;
}

function readWalks(raw: unknown): Walks | undefined {
  if (!Array.isArray(raw)) return undefined;
  const walks = new Map<string, Walk>();
  for (const entry of raw) {
    if (!Array.isArray(entry) || entry.length !== 3) return undefined;
    const [id, meters, seconds] = entry as unknown[];
    if (typeof id !== 'string' || !isNumber(meters) || !isNumber(seconds) || meters < 0 || seconds < 0) return undefined;
    walks.set(id, { meters, seconds });
  }
  return walks.size > 0 ? walks : undefined;
}

export function saveLastSearch(search: LastSearch, storage: Store | undefined = ownStorage()): void {
  const { position, at, fixedAt, walks } = search;
  try {
    storage?.setItem(LAST_SEARCH_KEY, JSON.stringify({ position, at, fixedAt, ...(walks ? { walks: [...walks].map(([id, walk]) => [id, walk.meters, walk.seconds]) } : {}) }));
  } catch {
    // Full or refused: the tab then starts over when it is loaded again, as it did before.
  }
}

/** The last search of this tab, if there is one and it is not too old at `now`. One that is too old is removed. */
export function readLastSearch(now: number, storage: Store | undefined = ownStorage()): LastSearch | undefined {
  try {
    const text = storage?.getItem(LAST_SEARCH_KEY);
    if (!text) return undefined;
    const raw = JSON.parse(text) as Partial<Record<string, unknown>> | null;
    const position = readPosition(raw?.position);
    const fresh = isNumber(raw?.fixedAt) && now - raw.fixedAt >= 0 && now - raw.fixedAt < LAST_SEARCH_MAX_AGE_MS;
    if (!position || !fresh || typeof raw?.at !== 'string' || !/^\d\d:\d\d$/.test(raw.at)) {
      forgetLastSearch(storage);
      return undefined;
    }
    const walks = readWalks(raw.walks);
    return { position, at: raw.at, fixedAt: raw.fixedAt as number, ...(walks ? { walks } : {}) };
  } catch {
    forgetLastSearch(storage);
    return undefined;
  }
}

/** The user has left the results: nothing of them stays. */
export function forgetLastSearch(storage: Store | undefined = ownStorage()): void {
  try {
    storage?.removeItem(LAST_SEARCH_KEY);
    storage?.removeItem(LAST_DETAIL_KEY);
  } catch {
    // Nothing was kept, then.
  }
}

/** The pharmacy whose details are open, or none: a tab that comes back opens on the same one. */
export function saveLastDetail(id: string | undefined, storage: Store | undefined = ownStorage()): void {
  try {
    if (id) storage?.setItem(LAST_DETAIL_KEY, id);
    else storage?.removeItem(LAST_DETAIL_KEY);
  } catch {
    // The results still come back, on the list.
  }
}

export function readLastDetail(storage: Store | undefined = ownStorage()): string | undefined {
  try {
    return storage?.getItem(LAST_DETAIL_KEY) || undefined;
  } catch {
    return undefined;
  }
}

/** The same place: a search brought back from storage is a new object with the old numbers. */
export const samePlace = (a: { lat: number; lon: number }, b: { lat: number; lon: number }): boolean => a.lat === b.lat && a.lon === b.lon;
