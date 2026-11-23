/**
 * Time-zone arithmetic with Intl alone, no library. Pure, and shared: the pipeline uses it to
 * turn wall-clock opening hours into instants, the browser to show an instant on the
 * pharmacy's own clock (PLAN.md 7.4). Instants are epoch seconds.
 */

export interface Wall {
  year: number;
  /** 1 to 12. */
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(zone: string): Intl.DateTimeFormat {
  let found = formatters.get(zone);
  if (!found) {
    found = new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    formatters.set(zone, found);
  }
  return found;
}

/** The zone's wall clock at an instant, as if it were UTC: epoch seconds of that reading. */
function wallSeconds(instant: number, zone: string): number {
  const parts: Record<string, number> = {};
  for (const part of formatter(zone).formatToParts(new Date(instant * 1000))) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) / 1000;
}

/** Seconds the zone is ahead of UTC at an instant. */
export function offsetAt(instant: number, zone: string): number {
  return wallSeconds(instant, zone) - Math.floor(instant);
}

/** What the clock on the wall says in a zone at an instant. */
export function wallAt(instant: number, zone: string): Wall {
  const date = new Date(wallSeconds(instant, zone) * 1000);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
  };
}

const DAY = 86400;

/**
 * The instant at which a zone's wall clock shows the given time.
 * - A time the clocks skip in spring maps to the moment they jump.
 * - A time that comes twice in autumn maps to its first occurrence.
 */
export function instantOf(wall: Wall, zone: string): number {
  const local = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute) / 1000;
  // Daylight-saving changes are months apart, so a day either side brackets at most one.
  const before = offsetAt(local - DAY, zone);
  const after = offsetAt(local + DAY, zone);
  if (before === after) return local - before;

  const first = local - before;
  const second = local - after;
  const firstHolds = offsetAt(first, zone) === before;
  const secondHolds = offsetAt(second, zone) === after;
  if (firstHolds && secondHolds) return Math.min(first, second);
  if (firstHolds) return first;
  if (secondHolds) return second;

  // Skipped: find the jump, the first second that has the new offset.
  let low = Math.min(first, second);
  let high = Math.max(first, second);
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (offsetAt(middle, zone) === after) high = middle;
    else low = middle;
  }
  return high;
}

/** The instant a local calendar day starts in a zone. */
export function startOfDay(instant: number, zone: string): number {
  const wall = wallAt(instant, zone);
  return instantOf({ ...wall, hour: 0, minute: 0 }, zone);
}

/** Days since 1970 of the local calendar date: the difference of two tells today from tomorrow. */
export function dayNumber(instant: number, zone: string): number {
  const wall = wallAt(instant, zone);
  return Math.floor(Date.UTC(wall.year, wall.month - 1, wall.day) / 1000 / DAY);
}

/** Day of the week of the local date, 0 for Monday to 6 for Sunday. */
export function weekdayAt(instant: number, zone: string): number {
  return (dayNumber(instant, zone) + 3) % 7;
}

const two = (value: number): string => String(value).padStart(2, '0');

/** "HH:mm" on the zone's wall clock. */
export function clockAt(instant: number, zone: string): string {
  const wall = wallAt(instant, zone);
  return `${two(wall.hour)}:${two(wall.minute)}`;
}

/** "YYYY-MM-DD" of the local date. */
export function dateAt(instant: number, zone: string): string {
  const wall = wallAt(instant, zone);
  return `${wall.year}-${two(wall.month)}-${two(wall.day)}`;
}
