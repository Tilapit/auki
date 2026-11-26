/**
 * The browser's location. On a first visit it is asked for only from a button press; on a later
 * one, on arrival (PLAN.md 7.1, section 9). Nothing here sends the position anywhere.
 */

/** Low accuracy is enough to rank pharmacies and answers faster; a five-minute-old fix will do. */
export const LOCATE_OPTIONS: PositionOptions = { enableHighAccuracy: false, maximumAge: 5 * 60_000, timeout: 10_000 };

/**
 * Following a walk (PLAN.md 7.1, step 11) needs what the first answer doesn't: fixes a few
 * seconds old at most, from the satellites where the device has them.
 */
export const WATCH_OPTIONS: PositionOptions = { enableHighAccuracy: true, maximumAge: 5_000, timeout: 30_000 };

/**
 * The timeout above doesn't count the time spent on the permission prompt, so an ignored
 * prompt never calls back. After this long without an answer the view says it is waiting.
 */
export const WAITING_AFTER_MS = 8_000;

export type LocateOutcome =
  | { ok: true; lat: number; lon: number; accuracy: number }
  | { ok: false; problem: 'denied' | 'unavailable' | 'timeout' };

interface Env {
  navigator?: { geolocation?: Geolocation };
  isSecureContext?: boolean;
}

/** False without the API or outside HTTPS: the app then opens straight to place search. */
export function canLocate(env: Env = globalThis as Env): boolean {
  return env.isSecureContext === true && !!env.navigator?.geolocation;
}

/** Whether the site already has permission. "unknown" where the Permissions API can't say. */
export async function locationPermission(permissions: Pick<Permissions, 'query'> | undefined = globalThis.navigator?.permissions): Promise<PermissionState | 'unknown'> {
  if (!permissions) return 'unknown';
  try {
    return (await permissions.query({ name: 'geolocation' })).state;
  } catch {
    return 'unknown';
  }
}

const PROBLEMS = { 1: 'denied', 2: 'unavailable', 3: 'timeout' } as const;

/** One position request. Resolves on either callback; never rejects, and never resolves if the prompt is ignored. */
export function locateOnce(geolocation: Geolocation = globalThis.navigator.geolocation): Promise<LocateOutcome> {
  return new Promise((resolve) => {
    geolocation.getCurrentPosition(
      ({ coords }) => resolve({ ok: true, lat: coords.latitude, lon: coords.longitude, accuracy: coords.accuracy }),
      (error) => resolve({ ok: false, problem: PROBLEMS[error.code as 1 | 2 | 3] ?? 'unavailable' }),
      LOCATE_OPTIONS,
    );
  });
}

/** Local wall-clock time as "HH:mm", for "Päivitetty klo …". */
export function wallClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * The mark a visit leaves: "show pharmacies near me" has worked here before. It is the whole of
 * what is kept: one character under one key, on the device, with no position and no time in it.
 * A later visit goes straight to locating (PLAN.md section 5, "First visit").
 */
export const LOCATED_KEY = 'located-before';

/** Private windows and blocked storage throw: then every visit is a first visit. */
const ownStorage = (): Storage | undefined => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

export function rememberLocated(storage: Pick<Storage, 'setItem'> | undefined = ownStorage()): void {
  try {
    storage?.setItem(LOCATED_KEY, '1');
  } catch {
    // Full or refused: the first window comes again next time, which costs one press.
  }
}

export function locatedBefore(storage: Pick<Storage, 'getItem'> | undefined = ownStorage()): boolean {
  try {
    return storage?.getItem(LOCATED_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Whether to ask for the position on arrival, without the button. With permission already
 * given, always. Otherwise only on a later visit, after a "show pharmacies near me" that worked:
 * Safari says "prompt" for a site it lets through, so the browser's word alone would send its
 * users through the first window every time. A browser that says the site is blocked is believed.
 */
export function locatesOnArrival(permission: PermissionState | 'unknown', before: boolean): boolean {
  return permission === 'granted' || (before && permission !== 'denied');
}
