/**
 * The coming seven days of a pharmacy's opening hours, as the sheet lists them (PLAN.md
 * section 5): equal days grouped, so a week reads like a door sign ("ma–pe 8.00–21.00",
 * "la–su 10.00–18.00") and a public holiday shows as the exception it is.
 *
 * Pure, from the intervals a tile carries. The times are on the pharmacy's own clock.
 * Nothing is guessed: a day the data doesn't cover is left out, and a day with a stretch the
 * data itself calls unknown is said to be unknown.
 */

import type { Hours, Interval } from './tiles.ts';
import { clockAt, startOfDay, weekdayAt } from './zone.ts';

export type DayHours =
  /** Wall-clock times, "HH:mm". A closing at midnight is "24:00"; a closing in the small hours is that hour of the next day. */
  | { kind: 'open'; ranges: { from: string; to: string }[] }
  | { kind: 'closed' }
  | { kind: 'allDay' }
  | { kind: 'unknown' };

export interface WeekLine {
  /** Weekdays these hours hold on, 0 for Monday to 6 for Sunday, in that order. All seven: every day. */
  days: number[];
  hours: DayHours;
}

interface Timed {
  hours: Hours;
  windowFrom: number;
  windowUntil: number;
  zone: string;
}

const DAYS = 7;
const HOUR = 3600;
/**
 * An opening that runs past midnight and ends by this hour belongs to the day it began on:
 * "18.00–2.00" on Friday, and nothing extra on Saturday. A longer one is cut at midnight.
 */
const OVERNIGHT_UNTIL_HOURS = 12;

const overlaps = (interval: Interval, from: number, to: number): boolean => interval.from < to && interval.to > from;

/** Openings that touch are one opening. The pipeline joins them; a tile that doesn't still reads right. */
function joined(open: Interval[]): Interval[] {
  const result: Interval[] = [];
  for (const interval of [...open].sort((a, b) => a.from - b.from)) {
    const last = result[result.length - 1];
    if (last && interval.from <= last.to) last.to = Math.max(last.to, interval.to);
    else result.push({ ...interval });
  }
  return result;
}

/**
 * What the pharmacy does on the local day that runs from `start` to `end`. `before`: when
 * the day before it began.
 */
function dayHours(open: Interval[], unknown: Interval[], before: number, start: number, end: number, zone: string): DayHours {
  if (unknown.some((interval) => overlaps(interval, start, end))) return { kind: 'unknown' };
  const ranges: { from: string; to: string }[] = [];
  for (const interval of open) {
    if (!overlaps(interval, start, end)) continue;
    const carried = interval.from < start;
    // The tail of an opening that began yesterday was said there, as "18.00–2.00".
    if (carried && interval.from > before && interval.to - start <= OVERNIGHT_UNTIL_HOURS * HOUR && interval.to < end) continue;
    if (interval.from <= start && interval.to >= end) return { kind: 'allDay' };
    const from = carried ? '00:00' : clockAt(interval.from, zone);
    const overnight = interval.to > end && interval.to - end <= OVERNIGHT_UNTIL_HOURS * HOUR;
    const to = interval.to === end ? '24:00' : interval.to < end || overnight ? clockAt(interval.to, zone) : '24:00';
    ranges.push({ from, to });
  }
  return ranges.length > 0 ? { kind: 'open', ranges } : { kind: 'closed' };
}

/**
 * The coming seven local days, today first, grouped by equal hours. Groups are in the order
 * of their first weekday, Monday first. Empty when the hours aren't parsed intervals; shorter
 * than a week when the data's window ends before the week does.
 */
export function weekHours(data: Timed, now: number): WeekLine[] {
  if (data.hours.kind !== 'parsed') return [];
  const { unknown } = data.hours;
  const open = joined(data.hours.open);
  const groups = new Map<string, WeekLine>();
  let start = startOfDay(now, data.zone);
  // Noon of yesterday is in yesterday whatever the clocks did last night.
  let before = startOfDay(start - 12 * HOUR, data.zone);
  for (let day = 0; day < DAYS; day++) {
    // Noon of the next day is in the next day whatever the clocks do tonight: its midnight is where this day ends.
    const end = startOfDay(start + 36 * HOUR, data.zone);
    // Only days the data covers whole.
    if (start < data.windowFrom || end > data.windowUntil) break;
    const hours = dayHours(open, unknown, before, start, end, data.zone);
    const key = JSON.stringify(hours);
    const group = groups.get(key) ?? { days: [], hours };
    group.days.push(weekdayAt(start, data.zone));
    groups.set(key, group);
    before = start;
    start = end;
  }
  return [...groups.values()].map((group) => ({ ...group, days: group.days.sort((a, b) => a - b) })).sort((a, b) => a.days[0] - b.days[0]);
}

/**
 * Weekdays as runs: [0, 1, 2, 4] is Monday to Wednesday, and Friday. A run of two is a run
 * too, as on a door sign: "la–su".
 */
export function dayRuns(days: number[]): [first: number, last: number][] {
  const runs: [number, number][] = [];
  for (const day of days) {
    const current = runs[runs.length - 1];
    if (current && current[1] === day - 1) current[1] = day;
    else runs.push([day, day]);
  }
  return runs;
}
