import type { Locale } from './i18n';

const INTL: Record<Locale, string> = { fi: 'fi-FI', en: 'en-GB' };

const NBSP = '\u00A0';

/** A number never parts from its unit at a line break: "3 min", "220 m", "1,1 km". */
const glue = (text: string) => text.replace(/(\d)\s+(?=\p{L})/gu, `$1${NBSP}`);

function wallToDate(wall: string): Date {
  const [h, m] = wall.split(':').map(Number);
  return new Date(Date.UTC(2026, 0, 1, h % 24, m));
}

const isMidnightEnd = (wall: string) => wall === '24:00';

/** Full clock time for places where two times are compared: "20.44" / "20:44". */
export function clock(locale: Locale, wall: string): string {
  // Closing at midnight reads as the end of the day: "8.00–24.00", not "8.00–0.00".
  if (isMidnightEnd(wall)) return locale === 'fi' ? '24.00' : '24:00';
  return new Intl.DateTimeFormat(INTL[locale], {
    hour: locale === 'fi' ? 'numeric' : '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'UTC',
  }).format(wallToDate(wall));
}

/** Time for status lines: "klo 21", "klo 20.45" / "21:00", "midnight". The space after "klo" doesn't break. */
export function clockShort(locale: Locale, wall: string): string {
  if (locale === 'en') return isMidnightEnd(wall) ? 'midnight' : clock(locale, wall);
  const [h, m] = wall.split(':').map(Number);
  return m === 0 ? `klo${NBSP}${h}` : `klo${NBSP}${clock(locale, wall)}`;
}

/** Hour range without minutes when both are whole hours: "8–10". */
export function hourRange(locale: Locale, from: string, to: string): string {
  const whole = (w: string) => w.endsWith(':00');
  if (whole(from) && whole(to)) return `${Number(from.split(':')[0])}–${Number(to.split(':')[0])}`;
  return `${clock(locale, from)}–${clock(locale, to)}`;
}

/** 0–994 m to the nearest 10 m, from there on kilometres with one decimal. */
export function distance(locale: Locale, meters: number, long = false): string {
  const rounded = Math.round(meters / 10) * 10;
  const km = rounded >= 1000;
  return glue(
    new Intl.NumberFormat(INTL[locale], {
      style: 'unit',
      unit: km ? 'kilometer' : 'meter',
      unitDisplay: long ? 'long' : 'short',
      minimumFractionDigits: km ? 1 : 0,
      maximumFractionDigits: km ? 1 : 0,
    }).format(km ? rounded / 1000 : rounded),
  );
}

export function minutes(locale: Locale, value: number, long = false): string {
  // en-GB abbreviates to "3 mins"; the copy uses "3 min" in both languages.
  if (locale === 'en' && !long) return `${new Intl.NumberFormat(INTL.en).format(value)}${NBSP}min`;
  return glue(
    new Intl.NumberFormat(INTL[locale], {
      style: 'unit',
      unit: 'minute',
      unitDisplay: long ? 'long' : 'short',
    }).format(value),
  );
}

/** ISO date to "13.9.2023" / "13 Sept 2023". */
export function date(locale: Locale, iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(INTL[locale], {
    day: 'numeric',
    month: locale === 'fi' ? 'numeric' : 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export interface Formatters {
  clock: (wall: string) => string;
  clockShort: (wall: string) => string;
  hourRange: (from: string, to: string) => string;
  distance: (meters: number, long?: boolean) => string;
  minutes: (value: number, long?: boolean) => string;
  date: (iso: string) => string;
}

export function formatters(locale: Locale): Formatters {
  return {
    clock: (wall) => clock(locale, wall),
    clockShort: (wall) => clockShort(locale, wall),
    hourRange: (from, to) => hourRange(locale, from, to),
    distance: (meters, long) => distance(locale, meters, long),
    minutes: (value, long) => minutes(locale, value, long),
    date: (iso) => date(locale, iso),
  };
}
