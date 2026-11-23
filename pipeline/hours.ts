/**
 * Opening hours into open intervals for the next eight days (PLAN.md 7.2 step 3 and 7.4).
 *
 * The opening_hours library reads JavaScript local time, so this runs with TZ=UTC and
 * treats what the library returns as wall clock. Each wall-clock moment is then turned into
 * an instant with the pharmacy's own zone, daylight-saving changes included. The browser
 * never does zone arithmetic to decide open or closed.
 */

import opening_hours from 'opening_hours';
import type { Hours, Interval } from '../lib/tiles.ts';
import { instantOf, wallAt } from '../lib/zone.ts';
import type { Country } from './countries.ts';
import { TEXT_MAX } from './normalize.ts';

export const WINDOW_DAYS = 8;

export interface Window {
  zone: string;
  /** Start of the local day, as an instant. */
  from: number;
  /** Eight local days later, as an instant. */
  until: number;
  /** The same two moments on the wall clock, as UTC dates: what the library is asked for. */
  wallFrom: Date;
  wallUntil: Date;
}

/** The hours window of a zone for a run that starts at `now`. */
export function windowFor(zone: string, now: number): Window {
  const today = wallAt(now, zone);
  const wallFrom = new Date(Date.UTC(today.year, today.month - 1, today.day));
  const wallUntil = new Date(Date.UTC(today.year, today.month - 1, today.day + WINDOW_DAYS));
  return { zone, from: instantOfWall(wallFrom, zone), until: instantOfWall(wallUntil, zone), wallFrom, wallUntil };
}

function instantOfWall(wall: Date, zone: string): number {
  return instantOf(
    { year: wall.getUTCFullYear(), month: wall.getUTCMonth() + 1, day: wall.getUTCDate(), hour: wall.getUTCHours(), minute: wall.getUTCMinutes() },
    zone,
  );
}

export interface HoursResult {
  hours: Hours;
  /** The value parsed only after the library corrected it. */
  corrected: boolean;
}

export interface HoursContext {
  country: Country;
  /** ISO 3166-2 code of the pharmacy's state, where the country has them. */
  state?: string;
  window: Window;
}

/** Sunrise and sunset depend on the place and the real clock, which the UTC trick can't give. */
const VARIABLE_TIMES = /\b(sunrise|sunset|dawn|dusk)\b/i;
const HOLIDAYS = /\b(PH|SH)\b/;

/** Sorts intervals and joins the ones that touch or overlap. */
export function join(intervals: Interval[]): Interval[] {
  const sorted = [...intervals].sort((a, b) => a.from - b.from);
  const joined: Interval[] = [];
  for (const interval of sorted) {
    const last = joined[joined.length - 1];
    if (last && interval.from <= last.to) last.to = Math.max(last.to, interval.to);
    else joined.push({ ...interval });
  }
  return joined;
}

/** Takes `cut` out of `intervals`: what is known to be unknown is not also listed as open. */
function without(intervals: Interval[], cut: Interval[]): Interval[] {
  let rest = intervals;
  for (const hole of cut) {
    rest = rest.flatMap((interval) => {
      if (hole.to <= interval.from || hole.from >= interval.to) return [interval];
      const parts: Interval[] = [];
      if (hole.from > interval.from) parts.push({ from: interval.from, to: hole.from });
      if (hole.to < interval.to) parts.push({ from: hole.to, to: interval.to });
      return parts;
    });
  }
  return rest;
}

export function computeHours(value: string | undefined, context: HoursContext): HoursResult {
  if (!value) return { hours: { kind: 'missing' }, corrected: false };
  const raw = value.slice(0, TEXT_MAX);
  const { country, window } = context;
  const stateName = context.state ? country.states?.[context.state] : undefined;

  let parsed: opening_hours;
  try {
    parsed = new opening_hours(value, { address: { country_code: country.code.toLowerCase(), ...(stateName ? { state: stateName } : {}) } });
  } catch {
    return { hours: { kind: 'unparseable', raw }, corrected: false };
  }

  let corrected = false;
  try {
    corrected = parsed.getWarnings().length > 0;
  } catch {
    corrected = false;
  }

  if (VARIABLE_TIMES.test(value)) return { hours: { kind: 'uncertain', raw }, corrected };
  // Holidays differ by state here, and we could not place this pharmacy in one.
  if (country.states && !stateName && HOLIDAYS.test(value)) return { hours: { kind: 'uncertain', raw }, corrected };

  let found: [Date, Date, boolean, string | undefined][];
  try {
    found = parsed.getOpenIntervals(window.wallFrom, window.wallUntil);
  } catch {
    // An evaluation error gives "uncertain", never a failed run.
    return { hours: { kind: 'uncertain', raw }, corrected };
  }

  const open: Interval[] = [];
  const unknown: Interval[] = [];
  for (const [start, end, isUnknown] of found) {
    const from = Math.max(window.from, instantOfWall(start, window.zone));
    const to = Math.min(window.until, instantOfWall(end, window.zone));
    if (to <= from) continue;
    (isUnknown ? unknown : open).push({ from, to });
  }

  const unknownJoined = join(unknown);
  const openJoined = without(join(open), unknownJoined);
  return {
    hours: { kind: 'parsed', open: openJoined, unknown: unknownJoined, ...(unknownJoined.length > 0 ? { raw } : {}) },
    corrected,
  };
}

/**
 * The same value in the same state and zone always gives the same result, and a country
 * has far fewer distinct values than pharmacies.
 */
export function memoized(): (value: string | undefined, context: HoursContext) => HoursResult {
  const cache = new Map<string, HoursResult>();
  return (value, context) => {
    if (!value) return computeHours(value, context);
    const key = `${context.window.zone}|${context.state ?? ''}|${value}`;
    let result = cache.get(key);
    if (!result) {
      result = computeHours(value, context);
      cache.set(key, result);
    }
    return result;
  };
}
