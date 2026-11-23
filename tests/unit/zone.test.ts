import { describe, expect, it } from 'vitest';
import { clockAt, dateAt, dayNumber, instantOf, offsetAt, startOfDay, wallAt, weekdayAt } from '@/lib/zone';

const utc = (iso: string): number => Date.parse(iso) / 1000;

describe('zone arithmetic', () => {
  it('knows winter and summer time', () => {
    expect(offsetAt(utc('2026-12-01T12:00:00Z'), 'Europe/Helsinki')).toBe(2 * 3600);
    expect(offsetAt(utc('2027-06-01T12:00:00Z'), 'Europe/Helsinki')).toBe(3 * 3600);
    expect(offsetAt(utc('2026-12-01T12:00:00Z'), 'Atlantic/Azores')).toBe(-3600);
    expect(offsetAt(utc('2026-12-01T12:00:00Z'), 'Atlantic/Canary')).toBe(0);
  });

  it('reads the wall clock of a zone', () => {
    const instant = utc('2026-11-23T21:45:00Z');
    expect(wallAt(instant, 'Europe/Helsinki')).toEqual({ year: 2026, month: 11, day: 23, hour: 23, minute: 45 });
    expect(clockAt(instant, 'Europe/Helsinki')).toBe('23:45');
    expect(clockAt(instant, 'Europe/Riga')).toBe('23:45');
    expect(clockAt(instant, 'Europe/Stockholm')).toBe('22:45');
    expect(dateAt(utc('2026-11-23T22:30:00Z'), 'Europe/Helsinki')).toBe('2026-11-24');
  });

  it('turns a wall-clock time into its instant', () => {
    expect(instantOf({ year: 2026, month: 11, day: 23, hour: 8, minute: 0 }, 'Europe/Helsinki')).toBe(utc('2026-11-23T06:00:00Z'));
    expect(instantOf({ year: 2027, month: 7, day: 1, hour: 8, minute: 0 }, 'Europe/Helsinki')).toBe(utc('2027-07-01T05:00:00Z'));
    expect(instantOf({ year: 2027, month: 7, day: 1, hour: 8, minute: 0 }, 'Europe/Madrid')).toBe(utc('2027-07-01T06:00:00Z'));
  });

  it('maps a time the clocks skip in spring to the moment they jump', () => {
    // Helsinki, 28 March 2027: 03:00 becomes 04:00. 03:30 never happens.
    const jump = utc('2027-03-28T01:00:00Z');
    expect(instantOf({ year: 2027, month: 3, day: 28, hour: 3, minute: 30 }, 'Europe/Helsinki')).toBe(jump);
    expect(instantOf({ year: 2027, month: 3, day: 28, hour: 2, minute: 59 }, 'Europe/Helsinki')).toBe(jump - 60);
    expect(instantOf({ year: 2027, month: 3, day: 28, hour: 4, minute: 0 }, 'Europe/Helsinki')).toBe(jump);
  });

  it('maps a time that comes twice in autumn to its first occurrence', () => {
    // Helsinki, 25 October 2026: 04:00 becomes 03:00. 03:30 happens twice.
    expect(instantOf({ year: 2026, month: 10, day: 25, hour: 3, minute: 30 }, 'Europe/Helsinki')).toBe(utc('2026-10-25T00:30:00Z'));
    expect(instantOf({ year: 2026, month: 10, day: 25, hour: 4, minute: 0 }, 'Europe/Helsinki')).toBe(utc('2026-10-25T02:00:00Z'));
  });

  it('finds the start of a day even where midnight is skipped', () => {
    expect(startOfDay(utc('2026-11-23T15:00:00Z'), 'Europe/Helsinki')).toBe(utc('2026-11-22T22:00:00Z'));
    // The Azores change at midnight: on 28 March 2027 the day starts at 01:00.
    expect(startOfDay(utc('2027-03-28T12:00:00Z'), 'Atlantic/Azores')).toBe(utc('2027-03-28T01:00:00Z'));
    expect(clockAt(utc('2027-03-28T01:00:00Z'), 'Atlantic/Azores')).toBe('01:00');
  });

  it('counts days and names weekdays on the local calendar', () => {
    const lateSunday = utc('2026-11-22T21:30:00Z'); // 23:30 on Sunday in Helsinki
    const earlyMonday = utc('2026-11-22T22:30:00Z'); // 00:30 on Monday in Helsinki
    expect(weekdayAt(lateSunday, 'Europe/Helsinki')).toBe(6);
    expect(weekdayAt(earlyMonday, 'Europe/Helsinki')).toBe(0);
    expect(dayNumber(earlyMonday, 'Europe/Helsinki') - dayNumber(lateSunday, 'Europe/Helsinki')).toBe(1);
    // The same two instants are one Sunday evening in Lisbon.
    expect(dayNumber(earlyMonday, 'Europe/Lisbon') - dayNumber(lateSunday, 'Europe/Lisbon')).toBe(0);
  });
});
