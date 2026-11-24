import { describe, expect, it } from 'vitest';
import { TIMELINE_WITHIN_SECONDS, arrival, arrivesInTime, ehditko, isTightSlack } from '@/lib/ehditko';
import type { HoursStatus } from '@/lib/hoursStatus';

/**
 * Ehditkö at its boundaries (PLAN.md section 12): the timeline starts at 60 minutes before
 * closing, arriving exactly at closing is too late, and the slack turns amber under five
 * minutes or a fifth of the walk.
 */

const utc = (iso: string): number => Date.parse(iso) / 1000;
/** Thursday 19 November 2026 at 21:00 in Helsinki. */
const CLOSES = utc('2026-11-19T19:00:00Z');
const minutesBefore = (minutes: number, seconds = 0): number => CLOSES - minutes * 60 + seconds;
const open: HoursStatus = { kind: 'open', closes: CLOSES };
const soon: HoursStatus = { kind: 'soon', closes: CLOSES };

describe('ehditkö', () => {
  it('the canvas: at 20.41, three minutes away, closing at 21: there at 20.44 with 16 minutes to spare', () => {
    expect(ehditko(soon, 3, minutesBefore(19))).toEqual({ kind: 'timeline', arrives: minutesBefore(16), closes: CLOSES, slackMin: 16 });
  });

  it('shows the timeline from 60 minutes before closing: at 61 nothing, at 60 and at 59 the timeline', () => {
    expect(ehditko(open, 5, minutesBefore(61))).toEqual({ kind: 'none' });
    expect(ehditko(open, 5, minutesBefore(60))).toEqual({ kind: 'timeline', arrives: minutesBefore(55), closes: CLOSES, slackMin: 55 });
    expect(ehditko(open, 5, minutesBefore(59))).toEqual({ kind: 'timeline', arrives: minutesBefore(54), closes: CLOSES, slackMin: 54 });
    expect(TIMELINE_WITHIN_SECONDS).toBe(3600);
  });

  it('counts from the minute on the clock, whatever the seconds', () => {
    // 19.59.59 reads 19.59: 61 minutes to go. One second later it reads 20.00.
    expect(ehditko(open, 5, minutesBefore(61, 59)).kind).toBe('none');
    expect(ehditko(open, 5, minutesBefore(60, 0)).kind).toBe('timeline');
    // 20.41.40 plus three minutes is shown as 20.44, and 16 minutes are left to 21.00: the three numbers add up.
    expect(ehditko(soon, 3, minutesBefore(19, 40))).toEqual({ kind: 'timeline', arrives: minutesBefore(16), closes: CLOSES, slackMin: 16 });
    expect(arrival(minutesBefore(19, 40), 3)).toBe(minutesBefore(16));
  });

  it('arriving exactly at closing is too late, a minute before it is not', () => {
    expect(ehditko(soon, 10, minutesBefore(10))).toEqual({ kind: 'tooLate', arrives: CLOSES, closes: CLOSES });
    expect(ehditko(soon, 10, minutesBefore(11))).toEqual({ kind: 'timeline', arrives: minutesBefore(1), closes: CLOSES, slackMin: 1 });
    expect(ehditko(soon, 10, minutesBefore(9))).toEqual({ kind: 'tooLate', arrives: CLOSES + 60, closes: CLOSES });
  });

  it('too late is said however far closing is: a walk of an hour and a half to a door that closes in 80 minutes', () => {
    expect(ehditko(open, 90, minutesBefore(80))).toEqual({ kind: 'tooLate', arrives: CLOSES + 600, closes: CLOSES });
    // With time enough and closing more than an hour away there is nothing to say.
    expect(ehditko(open, 30, minutesBefore(80))).toEqual({ kind: 'none' });
  });

  it('says nothing for a pharmacy that never closes, or is not open', () => {
    const others: HoursStatus[] = [{ kind: 'open24' }, { kind: 'closed', opens: CLOSES + 3600 }, { kind: 'closed' }, { kind: 'missing' }, { kind: 'unparseable', raw: 'x' }, { kind: 'uncertain', raw: 'x' }, { kind: 'stale' }];
    for (const status of others) expect(ehditko(status, 3, minutesBefore(19)), status.kind).toEqual({ kind: 'none' });
  });
});

describe('arriving in time', () => {
  it('is true while the walk ends before closing, and always around the clock', () => {
    expect(arrivesInTime(soon, 10, minutesBefore(11))).toBe(true);
    expect(arrivesInTime(soon, 10, minutesBefore(10))).toBe(false);
    expect(arrivesInTime(open, 5, minutesBefore(200))).toBe(true);
    expect(arrivesInTime({ kind: 'open24' }, 600, minutesBefore(0))).toBe(true);
  });

  it('is false for anything that is not open', () => {
    expect(arrivesInTime({ kind: 'closed', opens: CLOSES }, 1, minutesBefore(30))).toBe(false);
    expect(arrivesInTime({ kind: 'missing' }, 1, minutesBefore(30))).toBe(false);
    expect(arrivesInTime({ kind: 'stale' }, 1, minutesBefore(30))).toBe(false);
  });
});

describe('tight slack', () => {
  it('turns amber under five minutes, not at five', () => {
    expect(isTightSlack(4, 3)).toBe(true);
    expect(isTightSlack(5, 3)).toBe(false);
  });

  it('turns amber under a fifth of the walk when that is more than five minutes', () => {
    // A forty-minute walk: under eight minutes is tight.
    expect(isTightSlack(7, 40)).toBe(true);
    expect(isTightSlack(8, 40)).toBe(false);
    // A twenty-five-minute walk: a fifth is five, so the five-minute rule still holds.
    expect(isTightSlack(4, 25)).toBe(true);
    expect(isTightSlack(5, 25)).toBe(false);
  });
});
