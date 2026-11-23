import { describe, expect, it } from 'vitest';
import { STALE_SECONDS, hoursStatus, isOpenStatus, localMoment, openFor } from '@/lib/hoursStatus';
import type { Timed } from '@/lib/hoursStatus';
import type { Hours } from '@/lib/tiles';

const utc = (iso: string): number => Date.parse(iso) / 1000;
const ZONE = 'Europe/Helsinki';
// A window that starts on Monday 23 November 2026 in Helsinki.
const from = utc('2026-11-22T22:00:00Z');
const until = from + 8 * 86400;
const generated = utc('2026-11-23T01:30:00Z');

const timed = (hours: Hours): Timed => ({ hours, generated, windowFrom: from, windowUntil: until });
/** Local Helsinki time on a day of the window: day 0 is Monday the 23rd. */
const at = (day: number, clock: string): number => {
  const [h, m] = clock.split(':').map(Number);
  return from + day * 86400 + h * 3600 + m * 60;
};
const daily = (open: string, close: string, days = [0, 1, 2, 3, 4, 5, 6, 7]): Hours => ({
  kind: 'parsed',
  open: days.map((day) => ({ from: at(day, open), to: at(day, close) })),
  unknown: [],
});

describe('hoursStatus', () => {
  it('is open until the interval ends', () => {
    expect(hoursStatus(timed(daily('08:00', '21:00')), at(0, '12:00'))).toEqual({ kind: 'open', closes: at(0, '21:00') });
  });

  it('closes soon under thirty minutes before closing, not at exactly thirty', () => {
    const hours = timed(daily('08:00', '21:00'));
    expect(hoursStatus(hours, at(0, '20:30')).kind).toBe('open');
    expect(hoursStatus(hours, at(0, '20:30') + 1)).toEqual({ kind: 'soon', closes: at(0, '21:00') });
    expect(hoursStatus(hours, at(0, '20:59')).kind).toBe('soon');
  });

  it('is closed at the closing minute itself, and says when it opens next', () => {
    const hours = timed(daily('08:00', '21:00'));
    expect(hoursStatus(hours, at(0, '21:00'))).toEqual({ kind: 'closed', opens: at(1, '08:00') });
    expect(hoursStatus(hours, at(0, '07:59'))).toEqual({ kind: 'closed', opens: at(0, '08:00') });
    expect(hoursStatus(hours, at(0, '08:00')).kind).toBe('open');
  });

  it('opens next week when the days between are closed', () => {
    // Open on Mondays only: Monday the 23rd and Monday the 30th.
    const hours = timed(daily('09:00', '17:00', [0, 7]));
    expect(hoursStatus(hours, at(1, '10:00'))).toEqual({ kind: 'closed', opens: at(7, '09:00') });
    expect(localMoment(at(1, '10:00'), at(7, '09:00'), ZONE)).toEqual({ day: 'mo', time: '09:00' });
  });

  it('is open around the clock when one interval covers the window', () => {
    const always = timed({ kind: 'parsed', open: [{ from, to: until }], unknown: [] });
    expect(hoursStatus(always, at(3, '03:00'))).toEqual({ kind: 'open24' });
    expect(openFor(hoursStatus(always, at(3, '03:00')), at(3, '03:00'))).toBe(Infinity);
  });

  it('promises no closing time for an interval that runs to the end of the window', () => {
    const hours = timed({ kind: 'parsed', open: [{ from: at(2, '08:00'), to: until }], unknown: [] });
    expect(hoursStatus(hours, at(2, '09:00'))).toEqual({ kind: 'open24' });
    expect(hoursStatus(hours, at(1, '09:00'))).toEqual({ kind: 'closed', opens: at(2, '08:00') });
  });

  it('follows intervals that touch as one', () => {
    const hours = timed({ kind: 'parsed', open: [{ from: at(0, '08:00'), to: at(1, '00:00') }, { from: at(1, '00:00'), to: at(1, '02:00') }], unknown: [] });
    expect(hoursStatus(hours, at(0, '23:50'))).toEqual({ kind: 'open', closes: at(1, '02:00') });
  });

  it('passes on missing, unparseable and uncertain hours', () => {
    expect(hoursStatus(timed({ kind: 'missing' }), at(0, '12:00'))).toEqual({ kind: 'missing' });
    expect(hoursStatus(timed({ kind: 'unparseable', raw: 'call for hours' }), at(0, '12:00'))).toEqual({ kind: 'unparseable', raw: 'call for hours' });
    expect(hoursStatus(timed({ kind: 'uncertain', raw: 'sunrise-sunset' }), at(0, '12:00'))).toEqual({ kind: 'uncertain', raw: 'sunrise-sunset' });
  });

  it('is uncertain inside a stretch the data calls unknown, and promises no opening across one', () => {
    const hours = timed({
      kind: 'parsed',
      open: [{ from: at(0, '08:00'), to: at(0, '18:00') }, { from: at(2, '08:00'), to: at(2, '18:00') }],
      unknown: [{ from: at(1, '00:00'), to: at(2, '00:00') }],
      raw: 'Mo,We 08:00-18:00; Tu unknown',
    });
    expect(hoursStatus(hours, at(1, '12:00'))).toEqual({ kind: 'uncertain', raw: 'Mo,We 08:00-18:00; Tu unknown' });
    expect(hoursStatus(hours, at(0, '19:00'))).toEqual({ kind: 'closed' });
    expect(hoursStatus(hours, at(2, '07:00'))).toEqual({ kind: 'closed', opens: at(2, '08:00') });
  });

  it('never reads data older than seven days, or outside its window', () => {
    const hours = timed(daily('00:00', '24:00'));
    expect(hoursStatus(hours, generated + STALE_SECONDS).kind).not.toBe('stale');
    expect(hoursStatus(hours, generated + STALE_SECONDS + 1)).toEqual({ kind: 'stale' });
    expect(hoursStatus({ ...hours, generated: until - 3600 }, until)).toEqual({ kind: 'stale' });
    expect(hoursStatus(hours, from - 1)).toEqual({ kind: 'stale' });
    expect(hoursStatus(timed({ kind: 'missing' }), generated + STALE_SECONDS + 1)).toEqual({ kind: 'stale' });
    expect(isOpenStatus({ kind: 'stale' })).toBe(false);
  });
});

describe('localMoment', () => {
  it('says today, tomorrow or the weekday on the pharmacy clock', () => {
    const now = at(0, '20:41');
    expect(localMoment(now, at(0, '21:00'), ZONE)).toEqual({ day: 'today', time: '21:00' });
    expect(localMoment(now, at(1, '09:00'), ZONE)).toEqual({ day: 'tomorrow', time: '09:00' });
    expect(localMoment(now, at(2, '09:00'), ZONE)).toEqual({ day: 'we', time: '09:00' });
  });

  it('reads a closing at midnight as 24:00 of the day that ends', () => {
    expect(localMoment(at(0, '20:41'), at(1, '00:00'), ZONE, true)).toEqual({ day: 'today', time: '24:00' });
    expect(localMoment(at(0, '20:41'), at(2, '00:00'), ZONE, true)).toEqual({ day: 'tomorrow', time: '24:00' });
    // An opening at midnight belongs to the day that starts.
    expect(localMoment(at(0, '20:41'), at(1, '00:00'), ZONE)).toEqual({ day: 'tomorrow', time: '00:00' });
  });

  it('uses the pharmacy zone, not the device zone', () => {
    // 23:30 in Helsinki is 22:30 in Stockholm: an opening at 00:30 Helsinki time is "tomorrow" there and "today" in Stockholm.
    const now = utc('2026-11-23T21:30:00Z');
    const opens = utc('2026-11-23T22:30:00Z');
    expect(localMoment(now, opens, 'Europe/Helsinki')).toEqual({ day: 'tomorrow', time: '00:30' });
    expect(localMoment(now, opens, 'Europe/Stockholm')).toEqual({ day: 'today', time: '23:30' });
  });
});
