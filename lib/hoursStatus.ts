/**
 * Open or closed, from the intervals a tile carries and the current instant (PLAN.md 7.4).
 * Pure. No time-zone arithmetic decides the status: the pipeline has already turned the
 * hours into instants. Zones are used only to say a time or a day on the pharmacy's clock.
 */

import type { Hours, Interval } from './tiles.ts';
import { clockAt, dayNumber, weekdayAt } from './zone.ts';

/** "Closes soon" starts under this long before closing, not at exactly this long. */
export const SOON_SECONDS = 30 * 60;
/** Data older than this is never shown as open. */
export const STALE_SECONDS = 7 * 24 * 60 * 60;

export type HoursStatus =
  | { kind: 'open'; closes: number }
  | { kind: 'soon'; closes: number }
  /** Open, and no closing is in sight: the interval runs to the end of the window. */
  | { kind: 'open24' }
  /** opens is left out when the next opening isn't known. */
  | { kind: 'closed'; opens?: number }
  | { kind: 'missing' }
  | { kind: 'unparseable'; raw: string }
  | { kind: 'uncertain'; raw: string }
  /** The data is too old, or the clock is outside the window the hours were worked out for. */
  | { kind: 'stale' };

export interface Timed {
  hours: Hours;
  generated: number;
  windowFrom: number;
  windowUntil: number;
}

/** True when nothing may be read from the data any more: older than seven days, or outside its window. */
export function isStale(data: Pick<Timed, 'generated' | 'windowFrom' | 'windowUntil'>, now: number): boolean {
  return now - data.generated > STALE_SECONDS || now >= data.windowUntil || now < data.windowFrom;
}

const holds = (interval: Interval, now: number): boolean => interval.from <= now && now < interval.to;

export function hoursStatus(data: Timed, now: number): HoursStatus {
  if (isStale(data, now)) return { kind: 'stale' };

  const hours = data.hours;
  if (hours.kind !== 'parsed') return hours;

  if (hours.unknown.some((interval) => holds(interval, now))) return { kind: 'uncertain', raw: hours.raw ?? '' };

  const current = hours.open.find((interval) => holds(interval, now));
  if (current) {
    // The pipeline joins intervals that touch; follow a chain anyway, so a tile that doesn't still reads right.
    let closes = current.to;
    for (let next = hours.open.find((interval) => interval.from === closes); next; next = hours.open.find((interval) => interval.from === closes)) {
      closes = next.to;
    }
    if (closes >= data.windowUntil) return { kind: 'open24' };
    return closes - now < SOON_SECONDS ? { kind: 'soon', closes } : { kind: 'open', closes };
  }

  const nextOpen = earliestAfter(hours.open, now);
  const nextUnknown = earliestAfter(hours.unknown, now);
  // An opening is only promised when nothing unknown comes before it.
  if (nextOpen !== undefined && (nextUnknown === undefined || nextOpen < nextUnknown)) return { kind: 'closed', opens: nextOpen };
  return { kind: 'closed' };
}

function earliestAfter(intervals: Interval[], now: number): number | undefined {
  let earliest: number | undefined;
  for (const interval of intervals) {
    if (interval.from > now && (earliest === undefined || interval.from < earliest)) earliest = interval.from;
  }
  return earliest;
}

export const isOpenStatus = (status: HoursStatus): boolean => status.kind === 'open' || status.kind === 'soon' || status.kind === 'open24';

/** How long a pharmacy stays open from now, in seconds: Infinity around the clock, 0 when it isn't open. */
export function openFor(status: HoursStatus, now: number): number {
  if (status.kind === 'open24') return Infinity;
  if (status.kind === 'open' || status.kind === 'soon') return status.closes - now;
  return 0;
}

export type DayLabel = 'today' | 'tomorrow' | 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su';

const WEEKDAYS = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'] as const;

/**
 * An instant as the status line says it: the day relative to now, and the time, both on
 * the pharmacy's own clock. "Today" turns into "tomorrow" at local midnight there.
 * A closing at midnight reads "24:00" of the day that ends.
 */
export function localMoment(now: number, instant: number, zone: string, closing = false): { day: DayLabel; time: string } {
  let days = dayNumber(instant, zone) - dayNumber(now, zone);
  let time = clockAt(instant, zone);
  let weekday = weekdayAt(instant, zone);
  if (closing && time === '00:00' && days > 0) {
    days -= 1;
    time = '24:00';
    weekday = (weekday + 6) % 7;
  }
  const day: DayLabel = days <= 0 ? 'today' : days === 1 ? 'tomorrow' : WEEKDAYS[weekday];
  return { day, time };
}
