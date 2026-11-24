import { describe, expect, it } from 'vitest';
import { makeI18n } from '@/lib/i18n';
import { toPharmacy } from '@/lib/live';
import { dayHoursText, daysLabel } from '@/lib/status';
import type { Hours, Interval, TilePharmacy } from '@/lib/tiles';
import { dayRuns, weekHours, type WeekLine } from '@/lib/week';
import { countryByCode } from '@/pipeline/countries';
import { computeHours, windowFor } from '@/pipeline/hours';

/**
 * The week's hours in the pharmacy sheet (PLAN.md section 5): the coming seven days from the
 * intervals a tile carries, equal days grouped.
 */

const utc = (iso: string): number => Date.parse(iso) / 1000;
const ZONE = 'Europe/Helsinki';
/** Monday 23 November 2026, 00:00 in Helsinki. */
const FROM = utc('2026-11-22T22:00:00Z');
const UNTIL = FROM + 8 * 86400;
const at = (day: number, clock: string): number => FROM + day * 86400 + Number(clock.slice(0, 2)) * 3600 + Number(clock.slice(3)) * 60;
const span = (day: number, open: string, close: string): Interval => ({ from: at(day, open), to: at(day, close) });
const parsed = (open: Interval[], unknown: Interval[] = []): Hours => ({ kind: 'parsed', open, unknown });
const data = (hours: Hours, more: Partial<{ windowFrom: number; windowUntil: number }> = {}) => ({ hours, windowFrom: FROM, windowUntil: UNTIL, zone: ZONE, ...more });
const days = [0, 1, 2, 3, 4, 5, 6, 7];
const open = (ranges: [string, string][]) => ({ kind: 'open' as const, ranges: ranges.map(([from, to]) => ({ from, to })) });

const fi = makeI18n('fi');
const en = makeI18n('en');
const text = (lines: WeekLine[], i18n = fi) => lines.map((line) => `${daysLabel(i18n, line.days)} ${dayHoursText(i18n, line.hours)}`);

describe('the week in the pharmacy sheet', () => {
  it('the same hours every day are one line', () => {
    const lines = weekHours(data(parsed(days.map((day) => span(day, '08:00', '24:00')))), at(0, '20:41'));
    expect(lines).toEqual([{ days: [0, 1, 2, 3, 4, 5, 6], hours: open([['08:00', '24:00']]) }]);
    expect(text(lines)).toEqual(['Joka päivä 8.00–24.00']);
    expect(text(lines, en)).toEqual(['Every day 08:00–24:00']);
  });

  it('weekdays and the weekend read like a door sign, whatever day it is today', () => {
    // The window starts on a Monday: days 5 and 6 are the weekend.
    const week = parsed(days.map((day) => (day % 7 >= 5 ? span(day, '10:00', '18:00') : span(day, '08:00', '21:00'))));
    for (const today of [0, 1]) {
      const lines = weekHours(data(week), at(today, '12:00'));
      expect(text(lines)).toEqual(['Ma–pe 8.00–21.00', 'La–su 10.00–18.00']);
      expect(text(lines, en)).toEqual(['Mon–Fri 08:00–21:00', 'Sat–Sun 10:00–18:00']);
    }
  });

  it('a day that differs stands out as the exception it is', () => {
    // Closed on Thursday, as on a public holiday; shorter on Saturday; closed on Sunday.
    const week = parsed(days.flatMap((day) => (day % 7 === 3 || day % 7 === 6 ? [] : [day % 7 === 5 ? span(day, '09:00', '15:00') : span(day, '08:00', '21:00')])));
    expect(text(weekHours(data(week), at(0, '12:00')))).toEqual(['Ma–ke, pe 8.00–21.00', 'To, su suljettu', 'La 9.00–15.00']);
    expect(text(weekHours(data(week), at(0, '12:00')), en)).toEqual(['Mon–Wed, Fri 08:00–21:00', 'Thu, Sun closed', 'Sat 09:00–15:00']);
  });

  it('a lunch break is two times on one line', () => {
    const lines = weekHours(data(parsed(days.flatMap((day) => [span(day, '08:00', '12:00'), span(day, '13:00', '17:00')]))), at(0, '09:00'));
    expect(text(lines)).toEqual(['Joka päivä 8.00–12.00, 13.00–17.00']);
  });

  it('an opening past midnight belongs to the day it begins on, and is not said again the next morning', () => {
    // 18.00 to 2.00 every night.
    const lines = weekHours(data(parsed(days.map((day) => ({ from: at(day, '18:00'), to: at(day + 1, '02:00') })))), at(0, '19:00'));
    expect(lines).toEqual([{ days: [0, 1, 2, 3, 4, 5, 6], hours: open([['18:00', '02:00']]) }]);
    expect(text(lines)).toEqual(['Joka päivä 18.00–2.00']);
  });

  it('around the clock is said as that', () => {
    // Tuesday, in the small hours: the data covers the seven days to next Monday.
    const lines = weekHours(data(parsed([{ from: FROM, to: UNTIL }])), at(1, '03:00'));
    expect(lines).toEqual([{ days: [0, 1, 2, 3, 4, 5, 6], hours: { kind: 'allDay' } }]);
    expect(text(lines)).toEqual(['Joka päivä ympäri vuorokauden']);
    expect(text(lines, en)).toEqual(['Every day open 24 hours']);
  });

  it('an opening of several days is cut at midnight: the first day to 24, the days between around the clock, the last from 0', () => {
    // From Friday 8.00 until Monday 8.00, and ordinary hours on the other days.
    const long = { from: at(4, '08:00'), to: at(7, '08:00') };
    const week = parsed([span(0, '08:00', '16:00'), span(1, '08:00', '16:00'), span(2, '08:00', '16:00'), span(3, '08:00', '16:00'), long]);
    // Seen on Tuesday: the coming seven days end with next Monday.
    expect(text(weekHours(data(week), at(1, '12:00')))).toEqual(['Ma 0.00–8.00', 'Ti–to 8.00–16.00', 'Pe 8.00–24.00', 'La–su ympäri vuorokauden']);
  });

  it('openings that touch are one opening', () => {
    const lines = weekHours(data(parsed(days.flatMap((day) => [span(day, '08:00', '12:00'), span(day, '12:00', '18:00')]))), at(0, '09:00'));
    expect(text(lines)).toEqual(['Joka päivä 8.00–18.00']);
  });

  it('a day with a stretch the data calls unknown is said to be unknown, not closed', () => {
    const week = parsed(
      days.filter((day) => day !== 3).map((day) => span(day, '08:00', '21:00')),
      [span(3, '00:00', '24:00')],
    );
    expect(text(weekHours(data(week), at(0, '12:00')))).toEqual(['Ma–ke, pe–su 8.00–21.00', 'To ei tiedossa']);
  });

  it('lists only the days the data covers: three days old, it knows five more', () => {
    const week = parsed(days.map((day) => span(day, '08:00', '21:00')));
    // Thursday: the window ends with next Monday.
    const lines = weekHours(data(week), at(3, '12:00'));
    expect(lines).toEqual([{ days: [0, 3, 4, 5, 6], hours: open([['08:00', '21:00']]) }]);
    expect(text(lines)).toEqual(['Ma, to–su 8.00–21.00']);
  });

  it('is empty for hours that are not times: missing, unreadable, uncertain', () => {
    for (const hours of [{ kind: 'missing' }, { kind: 'unparseable', raw: 'soita ensin' }, { kind: 'uncertain', raw: 'PH off' }] as Hours[]) {
      expect(weekHours(data(hours), at(0, '12:00'))).toEqual([]);
    }
  });

  it('names runs of days', () => {
    expect(dayRuns([0, 1, 2, 4])).toEqual([[0, 2], [4, 4]]);
    expect(dayRuns([5, 6])).toEqual([[5, 6]]);
    expect(dayRuns([0, 6])).toEqual([[0, 0], [6, 6]]);
    expect(daysLabel(fi, [0, 6])).toBe('Ma, su');
    expect(daysLabel(en, [2])).toBe('Wed');
  });
});

describe('the week from real opening hours, through the pipeline', () => {
  const finland = countryByCode('FI')!;
  const week = (value: string, now: number) => {
    const window = windowFor(ZONE, now);
    const computed = computeHours(value, { country: finland, window });
    return weekHours({ hours: computed.hours, windowFrom: window.from, windowUntil: window.until, zone: ZONE }, now);
  };

  it('"Mo-Fr 08:00-21:00; Sa,Su 10:00-18:00" is two lines', () => {
    expect(text(week('Mo-Fr 08:00-21:00; Sa,Su 10:00-18:00', utc('2026-11-23T18:41:00Z')))).toEqual(['Ma–pe 8.00–21.00', 'La–su 10.00–18.00']);
  });

  it('Christmas week with "PH off": the holidays stand apart from the ordinary days', () => {
    // Monday 21 December 2026. Christmas Day is the Friday and St Stephen's Day the Saturday.
    expect(text(week('Mo-Sa 08:00-21:00; PH off', utc('2026-12-21T10:00:00Z')))).toEqual(['Ma–to 8.00–21.00', 'Pe–su suljettu']);
  });

  it('the week of a clock change reads the same: the times are on the wall clock', () => {
    // Thursday 22 October 2026: the clocks go back on the Sunday.
    expect(text(week('Mo-Su 08:00-21:00', utc('2026-10-22T10:00:00Z')))).toEqual(['Joka päivä 8.00–21.00']);
    expect(text(week('24/7', utc('2027-03-25T10:00:00Z')))).toEqual(['Joka päivä ympäri vuorokauden']);
  });
});

describe('the sheet gets the week with the pharmacy', () => {
  const pharmacy = (hours: Hours, generated = FROM + 3600): TilePharmacy => ({ id: 'n1', lat: 60.17, lon: 24.94, name: 'Apteekki', country: 'FI', zone: ZONE, generated, windowFrom: FROM, windowUntil: UNTIL, hours });
  const week = parsed(days.map((day) => span(day, '08:00', '21:00')));

  it('as lines, when the hours are times', () => {
    expect(toPharmacy({ pharmacy: pharmacy(week), meters: 100 }, at(0, '12:00'), ZONE).hours).toEqual([{ days: [0, 1, 2, 3, 4, 5, 6], hours: open([['08:00', '21:00']]) }]);
  });

  it('not at all, when they are missing or the data is out of date', () => {
    expect(toPharmacy({ pharmacy: pharmacy({ kind: 'missing' }), meters: 100 }, at(0, '12:00'), ZONE).hours).toBeUndefined();
    // Eight days on, the window is over: nothing is read from it.
    expect(toPharmacy({ pharmacy: pharmacy(week), meters: 100 }, at(8, '12:00'), ZONE).hours).toBeUndefined();
  });
});
