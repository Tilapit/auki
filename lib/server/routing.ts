import { distanceMeters } from '../geo.ts';
import { MAX_DESTINATIONS } from '../walking.ts';
import type { Line, Walk } from '../walking.ts';

/**
 * Walking times and one walking route, from openrouteservice (PLAN.md 7.1, steps 4 and 7).
 * Server only: the key never reaches the browser, and openrouteservice sees our server,
 * not the user. This is the one place the position is sent to (PLAN.md 7.6): it arrives in
 * the body of POST /api/walking, goes on in the body of one request, and is kept nowhere.
 * Nothing here logs. The request and the answer are described in lib/walking.ts.
 *
 * The free plan sets the budget (checked on the account page on 24 Nov 2026):
 * Matrix 500 requests a day and 40 a minute, Directions 2,000 a day and 40 a minute.
 * We keep our own count under those, stop asking for a while when openrouteservice says
 * we are over or keeps failing, and never ask the same thing twice. Whenever we don't ask,
 * the answer is "unavailable" at once, and the app shows straight-line distances.
 */

export interface LatLon {
  lat: number;
  lon: number;
}

export interface WalkingRequest {
  from: LatLon;
  to: LatLon[];
  /** The walking route to the one destination, as a line, instead of times to many. */
  route: boolean;
}

export type Unavailable = 'not-configured' | 'budget' | 'paused' | 'upstream';

export type WalkingResult =
  /** One entry per destination, in order. null: no walking route to it. */
  | { status: 'walks'; walks: (Walk | null)[] }
  | { status: 'route'; walks: [Walk]; line: Line }
  | { status: 'invalid' }
  | { status: 'unavailable'; reason: Unavailable };

/** Candidates come from within 50 km (PLAN.md 7.1, step 3). Anything farther is not ours to ask about. */
export const MAX_METERS = 50_000;
/** A route line is for a walk. The app asks for one within 3 km; this is the server's own, looser limit. */
export const MAX_ROUTE_METERS = 10_000;
/** A request body is a position and at most twenty more: a few hundred bytes. */
export const MAX_BODY_BYTES = 4096;
/** More points than this in a line are thinned out: a walk of a few kilometres has a few hundred. */
const MAX_LINE_POINTS = 1500;

/**
 * openrouteservice at HeiGIT's shared address. The old one, api.openrouteservice.org, answers
 * 410 Gone since 24 Nov 2026; the same key works here (HeiGIT's notice of 28 Apr 2026,
 * ask.openrouteservice.org/t/7912). Read on 25 Nov 2026, when every walking time in production
 * had silently become a straight line.
 */
export const ORS_URL = 'https://api.heigit.org/openrouteservice/v2';
export const MATRIX_URL = `${ORS_URL}/matrix/foot-walking`;
const ROUTE_URL = `${ORS_URL}/directions/foot-walking/geojson`;

/**
 * The list waits 1.5 s for walking times and then goes on without them (PLAN.md 7.1, step 5).
 * We give openrouteservice a little less, so that a slow answer is counted here as slow
 * instead of being cut off by a browser that has already stopped listening.
 */
export const MATRIX_TIMEOUT_MS = 1300;
/** The route line is drawn when it comes: nothing waits for it. */
export const ROUTE_TIMEOUT_MS = 4000;

export type Kind = 'matrix' | 'directions';

export interface Limit {
  perMinute: number;
  perDay: number;
}

/** openrouteservice's free plan, as the account page states it. */
export const PLAN_LIMITS: Record<Kind, Limit> = {
  matrix: { perMinute: 40, perDay: 500 },
  directions: { perMinute: 40, perDay: 2000 },
};

/**
 * What we allow ourselves: nine tenths of the plan. The count is kept in memory, per server
 * instance, so it is a floor of what was really used: a second instance or a restart counts
 * from zero, and our minute is not cut where theirs is. The tenth is the room for that, and
 * openrouteservice's own 429 is what holds when it isn't enough.
 */
export const OWN_LIMITS: Record<Kind, Limit> = {
  matrix: { perMinute: 36, perDay: 450 },
  directions: { perMinute: 36, perDay: 1800 },
};

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;
/** After a 429: a minute, then twice as long each time it happens again, up to an hour. */
const LIMITED_PAUSE_MS = MINUTE_MS;
const LIMITED_PAUSE_MAX_MS = 60 * MINUTE_MS;
/** This many failures in a row and openrouteservice is taken to be down or slow. */
const FAILURES_TO_PAUSE = 3;
/** Then half a minute without asking, and twice as long each time the next try fails too, up to ten minutes. */
const FAILED_PAUSE_MS = 30_000;
const FAILED_PAUSE_MAX_MS = 10 * MINUTE_MS;
/** A key that is refused will be refused again: ten minutes before the next try. */
const REFUSED_PAUSE_MS = 10 * MINUTE_MS;

export type Outcome =
  /** Answered, whatever the answer: the service is there. */
  | { kind: 'answered' }
  /** 429. `retryAfterMs`: what the response asked for, when it said. */
  | { kind: 'limited'; retryAfterMs?: number }
  /** 401 or 403: the key is missing there, wrong, or not allowed this. */
  | { kind: 'refused' }
  /** No answer in time, a network error, or a 5xx. */
  | { kind: 'failed' };

/**
 * The budget of one openrouteservice endpoint: how many requests this minute and this day,
 * and whether we are pausing. `take` before a request, `report` after it.
 */
export class Gate {
  private readonly limit: Limit;
  private recent: number[] = [];
  private day = -1;
  private today = 0;
  private pausedUntil = 0;
  private limitedInARow = 0;
  private failedInARow = 0;
  private pauses = 0;

  constructor(limit: Limit) {
    this.limit = limit;
  }

  /** Takes one request out of the budget, or says why not. */
  take(now: number): 'ok' | 'budget' | 'paused' {
    if (now < this.pausedUntil) return 'paused';
    this.recent = this.recent.filter((at) => now - at < MINUTE_MS);
    if (this.recent.length >= this.limit.perMinute) return 'budget';
    // The day turns at midnight UTC. When theirs turns is not documented: their 429 covers the difference.
    const day = Math.floor(now / DAY_MS);
    if (day !== this.day) {
      this.day = day;
      this.today = 0;
    }
    if (this.today >= this.limit.perDay) return 'budget';
    this.recent.push(now);
    this.today += 1;
    return 'ok';
  }

  report(outcome: Outcome, now: number): void {
    switch (outcome.kind) {
      case 'answered':
        this.limitedInARow = 0;
        this.failedInARow = 0;
        this.pauses = 0;
        return;
      case 'limited': {
        const step = Math.min(LIMITED_PAUSE_MS * 2 ** this.limitedInARow, LIMITED_PAUSE_MAX_MS);
        this.limitedInARow += 1;
        this.pause(now, Math.min(Math.max(step, outcome.retryAfterMs ?? 0), LIMITED_PAUSE_MAX_MS));
        return;
      }
      case 'refused':
        this.pause(now, REFUSED_PAUSE_MS);
        return;
      case 'failed':
        this.failedInARow += 1;
        if (this.failedInARow < FAILURES_TO_PAUSE) return;
        this.pause(now, Math.min(FAILED_PAUSE_MS * 2 ** this.pauses, FAILED_PAUSE_MAX_MS));
        this.pauses += 1;
    }
  }

  private pause(now: number, ms: number): void {
    this.pausedUntil = Math.max(this.pausedUntil, now + ms);
  }
}

// Per server instance, like the place search's queue.
let gates: Record<Kind, Gate> = { matrix: new Gate(OWN_LIMITS.matrix), directions: new Gate(OWN_LIMITS.directions) };

/** For tests: forget earlier calls. */
export function resetWalking(limits: Record<Kind, Limit> = OWN_LIMITS): void {
  gates = { matrix: new Gate(limits.matrix), directions: new Gate(limits.directions) };
}

export interface Deps {
  fetch: typeof fetch;
  now: () => number;
  key: string | undefined;
}

const defaults = (): Deps => ({
  fetch: (...args) => fetch(...args),
  now: () => Date.now(),
  key: process.env.ORS_API_KEY,
});

const isCoordinate = (value: unknown, limit: number): value is number => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= limit;

function readPlace(value: unknown): LatLon | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const { lat, lon } = value as Record<string, unknown>;
  return isCoordinate(lat, 90) && isCoordinate(lon, 180) ? { lat, lon } : undefined;
}

/**
 * Reads the body of POST /api/walking: `{ from: { lat, lon }, to: [{ lat, lon }, …], route? }`.
 * Undefined for anything we would not pass on: too many destinations, one farther than a
 * search can reach, a route asked to more than one place.
 */
export function readRequest(body: unknown): WalkingRequest | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const { from, to, route } = body as Record<string, unknown>;
  const origin = readPlace(from);
  if (!origin || !Array.isArray(to) || to.length < 1 || to.length > MAX_DESTINATIONS) return undefined;
  if (route !== undefined && typeof route !== 'boolean') return undefined;
  const wantsRoute = route === true;
  if (wantsRoute && to.length !== 1) return undefined;
  const places: LatLon[] = [];
  for (const value of to) {
    const place = readPlace(value);
    if (!place || distanceMeters(origin, place) > (wantsRoute ? MAX_ROUTE_METERS : MAX_METERS)) return undefined;
    places.push(place);
  }
  return { from: origin, to: places, route: wantsRoute };
}

/** About a metre: as exact as the tiles' own coordinates. */
const round = (value: number): number => Math.round(value * 1e5) / 1e5;
const point = (place: LatLon): [number, number] => [round(place.lon), round(place.lat)];

/** The Retry-After of a 429, in milliseconds: seconds, or a date. */
function retryAfter(response: Response, now: number): number | undefined {
  const header = response.headers.get('retry-after');
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return seconds > 0 ? seconds * 1000 : undefined;
  const at = Date.parse(header);
  return Number.isFinite(at) && at > now ? at - now : undefined;
}

type Asked = { ok: true; json: unknown } | { ok: false; reason: Unavailable };

/** One request to openrouteservice, counted against its budget. Never repeated. */
async function ask(kind: Kind, url: string, body: unknown, timeoutMs: number, deps: Deps): Promise<Asked> {
  if (!deps.key) return { ok: false, reason: 'not-configured' };
  const gate = gates[kind];
  const turn = gate.take(deps.now());
  if (turn !== 'ok') return { ok: false, reason: turn };
  try {
    const response = await deps.fetch(url, {
      method: 'POST',
      headers: { Authorization: deps.key, 'Content-Type': 'application/json; charset=utf-8', Accept: 'application/json, application/geo+json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
    });
    if (response.status === 429) gate.report({ kind: 'limited', retryAfterMs: retryAfter(response, deps.now()) }, deps.now());
    else if (response.status === 401 || response.status === 403) gate.report({ kind: 'refused' }, deps.now());
    else if (response.status >= 500) gate.report({ kind: 'failed' }, deps.now());
    // Anything else was an answer: also a 404 that says there is no route.
    else gate.report({ kind: 'answered' }, deps.now());
    if (!response.ok) return { ok: false, reason: 'upstream' };
    return { ok: true, json: await response.json() };
  } catch {
    gate.report({ kind: 'failed' }, deps.now());
    return { ok: false, reason: 'upstream' };
  }
}

const isMeasure = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;

/** One row of the matrix: from the position to each destination. A pair without a route is null there. */
function readMatrix(json: unknown, count: number): (Walk | null)[] | undefined {
  const { durations, distances } = (json ?? {}) as { durations?: unknown; distances?: unknown };
  const seconds = Array.isArray(durations) ? durations[0] : undefined;
  const meters = Array.isArray(distances) ? distances[0] : undefined;
  if (!Array.isArray(seconds) || !Array.isArray(meters) || seconds.length !== count || meters.length !== count) return undefined;
  return seconds.map((duration, index) => (isMeasure(duration) && isMeasure(meters[index]) ? { meters: Math.round(meters[index]), seconds: Math.round(duration) } : null));
}

function readRoute(json: unknown): { walk: Walk; line: Line } | undefined {
  const feature = ((json ?? {}) as { features?: unknown[] }).features?.[0] as { geometry?: { type?: unknown; coordinates?: unknown }; properties?: { summary?: { distance?: unknown; duration?: unknown } } } | undefined;
  const coordinates = feature?.geometry?.coordinates;
  const summary = feature?.properties?.summary;
  if (feature?.geometry?.type !== 'LineString' || !Array.isArray(coordinates) || coordinates.length < 2) return undefined;
  if (!isMeasure(summary?.distance) || !isMeasure(summary?.duration)) return undefined;
  const points: [number, number][] = [];
  for (const pair of coordinates) {
    if (!Array.isArray(pair) || !isCoordinate(pair[0], 180) || !isCoordinate(pair[1], 90)) return undefined;
    points.push([round(pair[0]), round(pair[1])]);
  }
  // A very long line is thinned evenly, and keeps its two ends.
  const step = Math.ceil(points.length / MAX_LINE_POINTS);
  const thinned = step > 1 ? points.filter((_, index) => index % step === 0 || index === points.length - 1) : points;
  return { walk: { meters: Math.round(summary.distance), seconds: Math.round(summary.duration) }, line: { type: 'LineString', coordinates: thinned } };
}

/** Walking times from one position to up to twenty places, or the walking route to one. */
export async function walking(body: unknown, overrides: Partial<Deps> = {}): Promise<WalkingResult> {
  const deps = { ...defaults(), ...overrides };
  const request = readRequest(body);
  if (!request) return { status: 'invalid' };

  if (request.route) {
    const asked = await ask('directions', ROUTE_URL, { coordinates: [point(request.from), point(request.to[0])], instructions: false }, ROUTE_TIMEOUT_MS, deps);
    if (!asked.ok) return { status: 'unavailable', reason: asked.reason };
    const route = readRoute(asked.json);
    return route ? { status: 'route', walks: [route.walk], line: route.line } : { status: 'unavailable', reason: 'upstream' };
  }

  // One request: the position is source 0, and every destination is asked for from it.
  const locations = [point(request.from), ...request.to.map(point)];
  const matrix = { locations, sources: [0], destinations: request.to.map((_, index) => index + 1), metrics: ['distance', 'duration'], units: 'm' };
  const asked = await ask('matrix', MATRIX_URL, matrix, MATRIX_TIMEOUT_MS, deps);
  if (!asked.ok) return { status: 'unavailable', reason: asked.reason };
  const walks = readMatrix(asked.json, request.to.length);
  return walks ? { status: 'walks', walks } : { status: 'unavailable', reason: 'upstream' };
}
