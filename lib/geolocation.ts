/**
 * The browser's location, asked for once and only from a button press (PLAN.md 7.1, section 9).
 * Nothing here sends the position anywhere.
 */

/** Low accuracy is enough to rank pharmacies and answers faster; a five-minute-old fix will do. */
export const LOCATE_OPTIONS: PositionOptions = { enableHighAccuracy: false, maximumAge: 5 * 60_000, timeout: 10_000 };

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
