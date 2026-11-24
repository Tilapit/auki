/**
 * Walking times as the browser handles them (PLAN.md 7.1, steps 4, 5 and 7): what is sent to
 * POST /api/walking, how its answer is read, and the order it gives the list. Pure: the
 * request itself is made by the hook, and the tests call these with answers of their own.
 *
 * The wire format, shared with the server (lib/server/routing.ts):
 *   request   { from: { lat, lon }, to: [{ lat, lon }, …], route?: true }
 *   answer    { walks: [{ meters, seconds } | null, …], line?: GeoJSON LineString }
 * One entry of `walks` per destination, in order; null where there is no walking route.
 */

import type { Found, LatLon } from './tiles.ts';

export const WALKING_PATH = '/api/walking';

/** The list waits this long for walking times, then goes on with straight lines and never reorders (PLAN.md 7.1, step 5). */
export const WALKING_WAIT_MS = 1500;

/** As many candidates as a search has: the nearest twenty. */
export const MAX_DESTINATIONS = 20;

/** openrouteservice's walking speed, 5 km/h, in metres a second. */
export const WALK_METERS_PER_SECOND = 5000 / 3600;

export interface Walk {
  meters: number;
  seconds: number;
}

/** A GeoJSON line: longitude first, as GeoJSON and the map have it. */
export interface Line {
  type: 'LineString';
  coordinates: [number, number][];
}

/** Walking times by pharmacy id. A pharmacy with no walking route to it is not in it. */
export type Walks = ReadonlyMap<string, Walk>;

/** About a metre: as exact as the tiles' own coordinates, and no more of the position than the route needs. */
const round = (value: number): number => Math.round(value * 1e5) / 1e5;
const place = ({ lat, lon }: LatLon): LatLon => ({ lat: round(lat), lon: round(lon) });

/** The body of the request: the position, and where to. With `route`, the walking route to the one place. */
export function walkingBody(from: LatLon, to: LatLon[], route = false): string {
  return JSON.stringify({ from: place(from), to: to.slice(0, MAX_DESTINATIONS).map(place), ...(route ? { route: true } : {}) });
}

const isMeasure = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;

/**
 * A walk is never shorter than the straight line. The route is measured between the nearest
 * points of the street network, so for a position in a park or a pharmacy inside a block it
 * can come out shorter: then the straight line, at walking speed, is the least it can be.
 */
export function atLeastStraight(walk: Walk, straightMeters: number): Walk {
  return {
    meters: Math.max(walk.meters, Math.round(straightMeters)),
    seconds: Math.max(walk.seconds, Math.round(straightMeters / WALK_METERS_PER_SECOND)),
  };
}

/**
 * Reads the answer for these candidates, in the order they were asked about. Undefined when
 * it isn't what was asked for, or when no candidate has a walking route: then there is no
 * walking order to show.
 */
export function readWalks(answer: unknown, candidates: readonly Found[]): Walks | undefined {
  const walks = (answer as { walks?: unknown } | null)?.walks;
  const asked = Math.min(candidates.length, MAX_DESTINATIONS);
  if (!Array.isArray(walks) || walks.length !== asked) return undefined;
  const byId = new Map<string, Walk>();
  for (let index = 0; index < asked; index++) {
    const walk = walks[index] as Partial<Walk> | null;
    if (walk === null) continue;
    if (typeof walk !== 'object' || !isMeasure(walk.meters) || !isMeasure(walk.seconds)) return undefined;
    byId.set(candidates[index].pharmacy.id, atLeastStraight({ meters: walk.meters, seconds: walk.seconds }, candidates[index].meters));
  }
  return byId.size > 0 ? byId : undefined;
}

/**
 * The order of the list: by walking time, which is what the rows lead with; among equals by
 * walking distance, then by straight line. A candidate without a walking route comes after
 * all that have one, so a pharmacy across a river or a railway drops to where it belongs
 * (PLAN.md 7.1, step 5). Without walking times the straight-line order stands.
 */
export function byWalking(candidates: readonly Found[], walks: Walks | undefined): Found[] {
  if (!walks) return [...candidates];
  return candidates
    .map((found, index) => ({ found, index, walk: walks.get(found.pharmacy.id) }))
    .sort((a, b) => {
      if (!a.walk || !b.walk) return a.walk ? -1 : b.walk ? 1 : a.index - b.index;
      return a.walk.seconds - b.walk.seconds || a.walk.meters - b.walk.meters || a.index - b.index;
    })
    .map(({ found }) => found);
}

/**
 * Walking time in whole minutes, rounded up: the number is used to say whether one gets
 * there before closing, and "3 min" must not mean three and a half. Never less than one.
 */
export const walkMinutes = (seconds: number): number => Math.max(1, Math.ceil(seconds / 60));

/** The line of a route answer, or undefined when the answer has none. */
export function readLine(answer: unknown): Line | undefined {
  const line = (answer as { line?: { type?: unknown; coordinates?: unknown } } | null)?.line;
  if (!line || line.type !== 'LineString' || !Array.isArray(line.coordinates) || line.coordinates.length < 2) return undefined;
  const coordinates: [number, number][] = [];
  for (const pair of line.coordinates) {
    if (!Array.isArray(pair) || !isMeasure(Math.abs(pair[0])) || !isMeasure(Math.abs(pair[1])) || Math.abs(pair[0]) > 180 || Math.abs(pair[1]) > 90) return undefined;
    coordinates.push([pair[0], pair[1]]);
  }
  return { type: 'LineString', coordinates };
}

/**
 * The route as the map draws it: from the dot to the marker. The service's line begins and
 * ends on the street network, a little way from both, so the two ends are joined to it.
 */
export function routeLine(from: LatLon, line: Line, to: LatLon): Line {
  return { type: 'LineString', coordinates: [[from.lon, from.lat], ...line.coordinates, [to.lon, to.lat]] };
}
