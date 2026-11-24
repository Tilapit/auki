import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { TIMELINE_WITHIN_SECONDS, arrival, arrivesInTime, ehditko, isTightSlack } from '@/lib/ehditko';
import { hoursStatus } from '@/lib/hoursStatus';
import type { Hours } from '@/lib/tiles';
import { wallAt } from '@/lib/zone';
import { COUNTRIES } from '@/pipeline/countries';
import type { Country } from '@/pipeline/countries';
import { computeHours, windowFor } from '@/pipeline/hours';

/**
 * Is ehditkö right (PLAN.md section 12)? It works in instants, so the questions are whether
 * its boundaries are where the plan puts them for any moment and any walk, and whether a
 * change of the clocks between now and closing leaves the slack alone.
 */

const utc = (iso: string): number => Date.parse(iso) / 1000;

const ZONES: { country: Country; zone: string }[] = COUNTRIES.flatMap((country) => [
  { country, zone: country.zone },
  ...(country.west ? [{ country, zone: country.west.zone }] : []),
]);

const closing = fc.integer({ min: utc('2026-01-01T00:00:00Z') / 60, max: utc('2028-12-31T00:00:00Z') / 60 }).map((minute) => minute * 60);
const walk = fc.integer({ min: 1, max: 240 });

describe('the boundaries, for any closing time and any walk', () => {
  it('the timeline starts at 60 minutes before closing and not a minute earlier', () => {
    fc.assert(
      fc.property(closing, walk, fc.integer({ min: 0, max: 59 }), (closes, walkMin, seconds) => {
        const at = (minutesBefore: number) => ehditko({ kind: 'open', closes }, walkMin, closes - minutesBefore * 60 + seconds);
        // 61 minutes before, by the clock's minute: nothing, unless the walk itself is longer than that.
        expect(at(61).kind).toBe(walkMin >= 61 ? 'tooLate' : 'none');
        expect(at(60).kind).toBe(walkMin >= 60 ? 'tooLate' : 'timeline');
      }),
      { numRuns: 500 },
    );
  });

  it('arriving exactly at closing is too late, and one minute earlier leaves no slack but is in time', () => {
    fc.assert(
      fc.property(closing, fc.integer({ min: 1, max: 59 }), fc.integer({ min: 0, max: 59 }), (closes, walkMin, seconds) => {
        const exactly = closes - walkMin * 60 + seconds;
        expect(ehditko({ kind: 'soon', closes }, walkMin, exactly)).toEqual({ kind: 'tooLate', arrives: closes, closes });
        expect(arrivesInTime({ kind: 'soon', closes }, walkMin, exactly)).toBe(false);
        const before = exactly - 60;
        expect(ehditko({ kind: 'soon', closes }, walkMin, before)).toEqual({ kind: 'timeline', arrives: closes - 60, closes, slackMin: 1 });
        expect(arrivesInTime({ kind: 'soon', closes }, walkMin, before)).toBe(true);
      }),
      { numRuns: 500 },
    );
  });

  it('the three numbers on screen add up: arrival is the clock minute plus the walk, slack is what is left', () => {
    fc.assert(
      fc.property(closing, walk, fc.integer({ min: 1, max: TIMELINE_WITHIN_SECONDS }), (closes, walkMin, before) => {
        const now = closes - before;
        const answer = ehditko({ kind: 'open', closes }, walkMin, now);
        const minute = Math.floor(now / 60) * 60;
        expect(arrival(now, walkMin)).toBe(minute + walkMin * 60);
        if (answer.kind === 'timeline') {
          expect(answer.arrives + answer.slackMin * 60).toBe(closes);
          expect(answer.slackMin).toBeGreaterThanOrEqual(1);
        } else {
          expect(answer.kind).toBe('tooLate');
          expect(minute + walkMin * 60).toBeGreaterThanOrEqual(closes);
        }
      }),
      { numRuns: 1000 },
    );
  });

  it('the slack is amber under five minutes or a fifth of the walk, whichever is larger', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 120 }), walk, (slackMin, walkMin) => {
        expect(isTightSlack(slackMin, walkMin)).toBe(slackMin < 5 || slackMin * 5 < walkMin);
      }),
      { numRuns: 1000 },
    );
  });
});

describe('daylight-saving changes', () => {
  // The EU changes its clocks at 01:00 UTC on the last Sunday of March and of October.
  const CHANGES = [utc('2026-10-25T01:00:00Z'), utc('2027-03-28T01:00:00Z'), utc('2027-10-31T01:00:00Z')];

  it('the slack equals the minutes that really pass, also when the clocks change before closing', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ZONES),
        fc.constantFrom(...CHANGES),
        // Now: up to an hour before the change. Closing: up to an hour after "now", so the change may lie between.
        fc.integer({ min: 0, max: 59 }),
        fc.integer({ min: 1, max: 60 }),
        fc.integer({ min: 1, max: 59 }),
        ({ zone }, change, minutesBeforeChange, minutesToClosing, walkMin) => {
          const now = change - minutesBeforeChange * 60;
          const closes = now + minutesToClosing * 60;
          const answer = ehditko({ kind: 'open', closes }, walkMin, now);
          if (walkMin >= minutesToClosing) {
            expect(answer.kind).toBe('tooLate');
            return;
          }
          // Elapsed minutes between arriving and closing, whatever the wall clocks say.
          expect(answer).toEqual({ kind: 'timeline', arrives: now + walkMin * 60, closes, slackMin: minutesToClosing - walkMin });

          // The wall clocks do disagree when the change lies between the two: by the hour that was added or taken.
          const minuteOfDay = (instant: number) => wallAt(instant, zone).hour * 60 + wallAt(instant, zone).minute;
          const slack = minutesToClosing - walkMin;
          const off = (((minuteOfDay(closes) - minuteOfDay(now + walkMin * 60) - slack) % 1440) + 1440) % 1440;
          const crossed = now + walkMin * 60 < change && closes >= change;
          // 60: an hour was added in between. 1380: an hour was taken, counted round the clock.
          if (!crossed) expect(off).toBe(0);
          else expect([60, 1380]).toContain(off);
        },
      ),
      { numRuns: 2000 },
    );
  });

  it('from real opening hours: a night pharmacy that closes after the change gives the elapsed minutes', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ZONES), fc.constantFrom(...CHANGES), fc.integer({ min: 1, max: 59 }), fc.integer({ min: 1, max: 40 }), ({ country, zone }, change, minutesBefore, walkMin) => {
        // Open from the evening until 06:00: the closing lies some hours after the change, in every covered zone.
        const window = windowFor(zone, change - 2 * 86400);
        const computed = computeHours('Mo-Su 18:00-06:00', { country, window });
        if (computed.hours.kind !== 'parsed') throw new Error(computed.hours.kind);
        const hours: Hours = computed.hours;
        const data = { hours, generated: window.from, windowFrom: window.from, windowUntil: window.until };

        const first = hoursStatus(data, change - 60);
        if (first.kind !== 'open' && first.kind !== 'soon') throw new Error(`not open before the change in ${zone}: ${first.kind}`);
        const { closes } = first;
        expect(closes).toBeGreaterThan(change);

        // A moment within the last hour before closing: the timeline's slack is closing minus arrival, in real minutes.
        const now = closes - minutesBefore * 60;
        const status = hoursStatus(data, now);
        const answer = ehditko(status, walkMin, now);
        if (walkMin >= minutesBefore) expect(answer.kind).toBe('tooLate');
        else expect(answer).toMatchObject({ kind: 'timeline', slackMin: minutesBefore - walkMin, closes });
      }),
      { numRuns: 300 },
    );
  });
});
