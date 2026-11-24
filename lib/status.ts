import type { I18n } from './i18n';
import type { GlyphState, OpenStatus, Pharmacy } from './types';
import { dayRuns } from './week.ts';
import type { DayHours } from './week.ts';

type Opening = NonNullable<Extract<OpenStatus, { kind: 'closed' }>['opens']>;

/** Which of the four glyph shapes a status gets. Shape, not colour, carries the state. */
export function glyphFor(status: OpenStatus): GlyphState {
  switch (status.kind) {
    case 'open':
    case 'open24':
      return 'open';
    case 'soon':
      return 'soon';
    case 'closed':
      return 'closed';
    default:
      return 'unknown';
  }
}

export type StatusTone = 'open' | 'soon' | 'muted';

export function toneFor(status: OpenStatus): StatusTone {
  if (status.kind === 'open' || status.kind === 'open24') return 'open';
  if (status.kind === 'soon' || status.kind === 'uncertain') return 'soon';
  return 'muted';
}

export const isOpenNow = (status: OpenStatus): boolean => glyphFor(status) === 'open' || glyphFor(status) === 'soon';

/** When a closed pharmacy opens: "klo 9", "huomenna klo 9", "ma klo 9". */
export function opensWhen({ t, f }: I18n, opens: Opening): string {
  const time = f.clockShort(opens.time);
  if (opens.day === 'today') return time;
  if (opens.day === 'tomorrow') return t.status.tomorrow(time);
  return t.status.onDay(t.status.weekdays[opens.day], time);
}

export function statusText(i18n: I18n, status: OpenStatus): string {
  const { t, f } = i18n;
  // Across a border, or for a searched place far away, the times are the pharmacy's own.
  const onItsClock = (line: string, local?: boolean) => (local ? t.status.localTime(line) : line);
  switch (status.kind) {
    case 'open':
      return onItsClock(t.status.openUntil(f.clockShort(status.closes)), status.local);
    case 'soon':
      return onItsClock(t.status.closesSoon(f.clockShort(status.closes)), status.local);
    case 'open24':
      return t.status.open24;
    case 'closed':
      return status.opens ? onItsClock(t.status.closedOpens(opensWhen(i18n, status.opens)), status.local) : t.status.closed;
    case 'missing':
      return t.status.missing;
    case 'unparseable':
      return t.status.unparseable(status.raw);
    case 'uncertain':
      return t.status.uncertain(status.raw);
    case 'stale':
      return t.status.stale;
  }
}

const WEEK = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'] as const;

/** Weekdays as a door sign names them: "Joka päivä", "Ma–pe", "La", "Ma–ke, pe". 0 is Monday. */
export function daysLabel({ t }: I18n, days: number[]): string {
  if (days.length === WEEK.length) return t.sheet.everyDay;
  const name = (day: number) => t.status.weekdays[WEEK[day]];
  const text = dayRuns(days)
    .map(([first, last]) => (first === last ? name(first) : `${name(first)}–${name(last)}`))
    .join(', ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The hours of a day or a group of days: "8.00–21.00", "8.00–12.00, 13.00–17.00", "suljettu". */
export function dayHoursText({ t, f }: I18n, hours: DayHours): string {
  switch (hours.kind) {
    case 'open':
      return hours.ranges.map((range) => `${f.clock(range.from)}–${f.clock(range.to)}`).join(', ');
    case 'closed':
      return t.sheet.closedDay;
    case 'allDay':
      return t.sheet.allDay;
    case 'unknown':
      return t.sheet.unknownDay;
  }
}

export const displayName = ({ t }: I18n, pharmacy: Pharmacy): string => pharmacy.name ?? t.app.fallbackName;

/** Name plus street, for labels where the street tells same-named pharmacies apart. */
export function fullName(i18n: I18n, pharmacy: Pharmacy, withStreet: boolean): string {
  const name = displayName(i18n, pharmacy);
  return withStreet && pharmacy.street ? `${name}, ${pharmacy.street}` : name;
}
