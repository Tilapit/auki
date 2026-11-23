import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { STALE_SECONDS, hoursStatus, isOpenStatus, localMoment } from '@/lib/hoursStatus';
import type { Hours, Interval } from '@/lib/tiles';
import { dateAt, dayNumber, instantOf, wallAt } from '@/lib/zone';
import { COUNTRIES, countryByCode, zoneFor } from '@/pipeline/countries';
import type { Country } from '@/pipeline/countries';
import { computeHours, windowFor } from '@/pipeline/hours';

/**
 * Is the time logic right (PLAN.md section 12)? The opening_hours library needs TZ=UTC,
 * which the npm scripts set.
 */

const utc = (iso: string): number => Date.parse(iso) / 1000;
const two = (value: number): string => String(value).padStart(2, '0');
const clock = (minutes: number): string => `${two(Math.floor(minutes / 60))}:${two(minutes % 60)}`;

/** Every zone a covered pharmacy can be in. */
const ZONES: { country: Country; zone: string }[] = COUNTRIES.flatMap((country) => [
  { country, zone: country.zone },
  ...(country.west ? [{ country, zone: country.west.zone }] : []),
]);

function parsed(value: string, country: Country, zone: string, now: number, state?: string): { hours: Extract<Hours, { kind: 'parsed' }>; from: number; until: number } {
  const window = windowFor(zone, now);
  const result = computeHours(value, { country, state, window });
  if (result.hours.kind !== 'parsed') throw new Error(`"${value}" did not parse: ${result.hours.kind}`);
  return { hours: result.hours, from: window.from, until: window.until };
}

const statusAt = (data: { hours: Hours; from: number; until: number }, now: number) =>
  hoursStatus({ hours: data.hours, generated: data.from, windowFrom: data.from, windowUntil: data.until }, now);

/** Minutes since local midnight on the zone's wall clock. */
const minuteOfDay = (instant: number, zone: string): number => {
  const wall = wallAt(instant, zone);
  return wall.hour * 60 + wall.minute;
};

describe('the hours window', () => {
  it('starts at local midnight and lasts eight local days, in every zone', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ZONES), fc.integer({ min: utc('2026-01-01T00:00:00Z'), max: utc('2028-12-31T00:00:00Z') }), ({ zone }, now) => {
        const window = windowFor(zone, now);
        expect(window.from).toBeLessThanOrEqual(now);
        expect(dateAt(window.from, zone)).toBe(dateAt(now, zone));
        expect(dayNumber(window.until, zone) - dayNumber(window.from, zone)).toBe(8);
        // Eight days, give or take the hour of a daylight-saving change.
        expect(Math.abs(window.until - window.from - 8 * 86400)).toBeLessThanOrEqual(3600);
      }),
      { numRuns: 500 },
    );
  });
});

describe('midnight', () => {
  const finland = countryByCode('FI')!;

  it('a pharmacy open past midnight is open on both sides of it', () => {
    const now = utc('2026-11-23T10:00:00Z');
    const data = parsed('Mo-Su 22:00-02:00', finland, 'Europe/Helsinki', now);
    fc.assert(
      // Any moment of the seven days the data may be read for.
      fc.property(fc.integer({ min: data.from, max: data.from + STALE_SECONDS }), (instant) => {
        const minute = minuteOfDay(instant, 'Europe/Helsinki');
        expect(isOpenStatus(statusAt(data, instant))).toBe(minute >= 22 * 60 || minute < 2 * 60);
      }),
      { numRuns: 500 },
    );
    // One interval a night, not two that meet at midnight.
    const night = data.hours.open.find((interval) => interval.from > data.from)!;
    expect(night.to - night.from).toBe(4 * 3600);
  });

  it('"today" turns into "tomorrow" at local midnight in the pharmacy zone', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ZONES), fc.integer({ min: utc('2026-06-01T00:00:00Z'), max: utc('2027-06-01T00:00:00Z') }), fc.integer({ min: 60, max: 36 * 3600 }), ({ zone }, now, ahead) => {
        const then = now + ahead;
        const days = dayNumber(then, zone) - dayNumber(now, zone);
        const expected = days === 0 ? 'today' : days === 1 ? 'tomorrow' : undefined;
        if (expected) expect(localMoment(now, then, zone).day).toBe(expected);
        else expect(['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su']).toContain(localMoment(now, then, zone).day);
      }),
      { numRuns: 500 },
    );
    // Five minutes either side of midnight in Helsinki.
    const before = utc('2026-11-23T21:55:00Z');
    const opens = utc('2026-11-24T06:00:00Z');
    expect(localMoment(before, opens, 'Europe/Helsinki').day).toBe('tomorrow');
    expect(localMoment(before + 600, opens, 'Europe/Helsinki').day).toBe('today');
  });
});

describe('daylight-saving changes', () => {
  // The EU changes its clocks at 01:00 UTC on the last Sunday of March and of October.
  const CHANGES = [utc('2026-10-25T01:00:00Z'), utc('2027-03-28T01:00:00Z'), utc('2027-10-31T01:00:00Z')];
  // Opening and closing times outside 00:00 to 05:00, where the clocks jump: a rule that opens
  // at 03:30 has no single meaning on a night when 03:30 comes twice or not at all.
  const boundary = fc.integer({ min: 5 * 60, max: 23 * 60 + 59 });

  it('the status from the intervals equals the wall-clock rule, around both changes in every zone', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ZONES),
        fc.constantFrom(...CHANGES),
        boundary,
        boundary,
        fc.integer({ min: -3 * 86400, max: 3 * 86400 }),
        fc.integer({ min: -36 * 3600, max: 36 * 3600 }),
        ({ country, zone }, change, opens, closes, runOffset, nowOffset) => {
          fc.pre(opens !== closes);
          // A run some days before or after the change, and a moment within a day and a half of it.
          const data = parsed(`Mo-Su ${clock(opens)}-${clock(closes)}`, country, zone, change + runOffset);
          const now = change + nowOffset;
          fc.pre(now >= data.from && now < data.until);

          const minute = minuteOfDay(now, zone);
          const byRule = opens < closes ? minute >= opens && minute < closes : minute >= opens || minute < closes;
          expect(isOpenStatus(statusAt(data, now))).toBe(byRule);
        },
      ),
      { numRuns: 3000 },
    );
  });

  it('a closing time is the wall-clock closing time on the day of the change too', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ZONES), fc.constantFrom(...CHANGES), ({ country, zone }, change) => {
        // Noon on the day of the change: 08:00 to 21:00 is open, and closes at 21:00 on the wall.
        const data = parsed('Mo-Su 08:00-21:00', country, zone, change - 2 * 86400);
        const day = wallAt(change + 6 * 3600, zone);
        const noon = instantOf({ ...day, hour: 12, minute: 0 }, zone);
        const status = statusAt(data, noon);
        expect(status.kind).toBe('open');
        if (status.kind === 'open') expect(localMoment(noon, status.closes, zone, true)).toEqual({ day: 'today', time: '21:00' });
      }),
    );
  });

  it('around the clock stays one interval through a change', () => {
    for (const change of CHANGES) {
      const data = parsed('24/7', countryByCode('FI')!, 'Europe/Helsinki', change - 2 * 86400);
      expect(data.hours.open).toEqual([{ from: data.from, to: data.until }]);
      expect(statusAt(data, change).kind).toBe('open24');
    }
  });
});

describe('public holidays', () => {
  // Christmas Day and New Year's Day are public holidays in all 21 countries.
  const run = utc('2026-12-25T03:00:00Z');
  const cases = COUNTRIES.flatMap((country) => (country.states ? Object.keys(country.states).map((state) => ({ country, state: state as string | undefined })) : [{ country, state: undefined as string | undefined }]));

  const openOn = (intervals: Interval[], date: string, zone: string): Interval[] => intervals.filter((interval) => dateAt(interval.from, zone) === date);

  it('with "PH off", closed on each of them, in every country and state', () => {
    for (const { country, state } of cases) {
      const data = parsed('Mo-Su 08:00-20:00; PH off', country, country.zone, run, state);
      const label = state ?? country.code;
      expect(openOn(data.hours.open, '2026-12-25', country.zone), label).toEqual([]);
      expect(openOn(data.hours.open, '2027-01-01', country.zone), label).toEqual([]);
      // The 28th is an ordinary Monday everywhere.
      expect(openOn(data.hours.open, '2026-12-28', country.zone), label).toHaveLength(1);
    }
  });

  it('with "PH 10:00-14:00", open for those hours on them', () => {
    for (const { country, state } of cases) {
      const data = parsed('Mo-Su 08:00-20:00; PH 10:00-14:00', country, country.zone, run, state);
      const christmas = openOn(data.hours.open, '2026-12-25', country.zone);
      expect(christmas, state ?? country.code).toHaveLength(1);
      expect(minuteOfDay(christmas[0].from, country.zone)).toBe(10 * 60);
      expect(minuteOfDay(christmas[0].to, country.zone)).toBe(14 * 60);
    }
  });

  it('knows the holidays that only some states keep', () => {
    const closedOn = (code: string, state: string, date: string): boolean => {
      const country = countryByCode(code)!;
      const [year, month, day] = date.split('-').map(Number);
      const data = parsed('Mo-Su 08:00-20:00; PH off', country, country.zone, instantOf({ year, month, day, hour: 3, minute: 0 }, country.zone), state);
      return openOn(data.hours.open, date, country.zone).length === 0;
    };
    // Epiphany: Bavaria yes, Berlin no.
    expect(closedOn('DE', 'DE-BY', '2027-01-06')).toBe(true);
    expect(closedOn('DE', 'DE-BE', '2027-01-06')).toBe(false);
    // Andalusia Day, 28 February (a Sunday in 2027: the holiday moves to Monday 1 March).
    expect(closedOn('ES', 'ES-AN', '2027-03-01')).toBe(true);
    expect(closedOn('ES', 'ES-MD', '2027-03-01')).toBe(false);
    // Berchtold's Day, 2 January: Bern yes, Geneva no.
    expect(closedOn('CH', 'CH-BE', '2027-01-02')).toBe(true);
    expect(closedOn('CH', 'CH-GE', '2027-01-02')).toBe(false);
  });

  it('is uncertain about holidays where the state is not known', () => {
    const germany = countryByCode('DE')!;
    const window = windowFor(germany.zone, run);
    expect(computeHours('Mo-Fr 08:00-18:00; PH off', { country: germany, window }).hours).toEqual({ kind: 'uncertain', raw: 'Mo-Fr 08:00-18:00; PH off' });
    // Without a holiday rule the state doesn't matter.
    expect(computeHours('Mo-Fr 08:00-18:00', { country: germany, window }).hours.kind).toBe('parsed');
  });
});

describe('the pipeline gives one of four results per value', () => {
  const finland = countryByCode('FI')!;
  const window = windowFor('Europe/Helsinki', utc('2026-11-23T10:00:00Z'));
  const of = (value: string | undefined) => computeHours(value, { country: finland, window });

  it('missing, unparseable, uncertain or parsed', () => {
    expect(of(undefined).hours).toEqual({ kind: 'missing' });
    expect(of('call for hours').hours).toEqual({ kind: 'unparseable', raw: 'call for hours' });
    expect(of('sunrise-sunset').hours).toEqual({ kind: 'uncertain', raw: 'sunrise-sunset' });
    // The library has no school holidays for Finland and refuses the value: not parsed, and no failed run.
    expect(['unparseable', 'uncertain']).toContain(of('Mo-Fr 08:00-18:00; SH off').hours.kind);
    expect(of('Mo-Fr 08:00-18:00').hours.kind).toBe('parsed');
  });

  it('counts a sloppy value the library corrects', () => {
    expect(of('Mo-Fr 08:00-18:00').corrected).toBe(false);
    expect(of('Mo-Fr 9-17').corrected).toBe(true);
    expect(of('Ma-Pe 9-17').hours.kind).toBe('parsed');
    expect(of('Ma-Pe 9-17').corrected).toBe(true);
  });

  it('keeps stretches the data calls unknown apart from the open ones', () => {
    const result = of('Mo-Fr 08:00-18:00; Sa unknown').hours;
    expect(result.kind).toBe('parsed');
    if (result.kind !== 'parsed') return;
    expect(result.unknown).toHaveLength(1);
    expect(result.unknown[0].to - result.unknown[0].from).toBe(86400);
    expect(result.raw).toBe('Mo-Fr 08:00-18:00; Sa unknown');
    expect(result.open).toHaveLength(6);
  });

  it('intervals are sorted, apart from each other and inside the window, for any daily rule in any zone', () => {
    const minute = fc.integer({ min: 0, max: 24 * 60 - 1 });
    fc.assert(
      fc.property(fc.constantFrom(...ZONES), fc.integer({ min: utc('2026-01-01T00:00:00Z'), max: utc('2028-12-31T00:00:00Z') }), minute, minute, minute, minute, ({ country, zone }, now, a, b, c, d) => {
        fc.pre(a !== b && c !== d);
        const data = parsed(`Mo-Fr ${clock(a)}-${clock(b)}; Sa,Su ${clock(c)}-${clock(d)}`, country, zone, now);
        let last = data.from;
        for (const interval of data.hours.open) {
          expect(interval.from).toBeGreaterThanOrEqual(last);
          expect(interval.to).toBeGreaterThan(interval.from);
          expect(interval.to).toBeLessThanOrEqual(data.until);
          expect(interval.from % 60).toBe(0);
          expect(interval.to % 60).toBe(0);
          // Touching intervals are joined, so the next one starts strictly later.
          last = interval.to + 1;
        }
      }),
      { numRuns: 1000 },
    );
  });
});

describe('staleness', () => {
  it('no input gives "open" from data older than seven days', () => {
    const interval = fc.tuple(fc.integer({ min: 0, max: 8 * 1440 }), fc.integer({ min: 1, max: 8 * 1440 }));
    fc.assert(
      fc.property(fc.array(interval, { maxLength: 12 }), fc.integer({ min: 0, max: 86400 }), fc.integer({ min: 1, max: 30 * 86400 }), (pairs, age, late) => {
        const from = utc('2026-11-22T22:00:00Z');
        const until = from + 8 * 86400;
        const generated = from + age;
        const open = pairs.map(([start, length]) => ({ from: from + start * 60, to: Math.min(until, from + (start + length) * 60) })).filter((i) => i.to > i.from);
        const now = generated + STALE_SECONDS + late;
        const status = hoursStatus({ hours: { kind: 'parsed', open, unknown: [] }, generated, windowFrom: from, windowUntil: until }, now);
        expect(status).toEqual({ kind: 'stale' });
      }),
      { numRuns: 500 },
    );
  });

  it('the window of eight local days outlasts the seven days the data may be read for', () => {
    // A nightly run leaves most of a day of look-ahead at the end. The window can only end
    // first when the data was fetched in the last hour of a day, in the week the clocks go
    // forward: an eight-day window is then an hour short. isStale stops at the window too.
    fc.assert(
      fc.property(fc.constantFrom(...ZONES), fc.integer({ min: utc('2026-01-01T00:00:00Z'), max: utc('2028-12-31T00:00:00Z') }), ({ zone }, generated) => {
        const window = windowFor(zone, generated);
        const spare = window.until - (generated + STALE_SECONDS);
        expect(spare).toBeGreaterThan(-3600);
        if (wallAt(generated, zone).hour < 23) expect(spare).toBeGreaterThan(0);
      }),
      { numRuns: 1000 },
    );
  });
});

describe('zones of a country', () => {
  it('the Canaries and the Azores keep their own clock, by longitude', () => {
    expect(zoneFor(countryByCode('ES')!, -3.7)).toBe('Europe/Madrid');
    expect(zoneFor(countryByCode('ES')!, -15.4)).toBe('Atlantic/Canary');
    expect(zoneFor(countryByCode('ES')!, -5.3)).toBe('Europe/Madrid'); // Ceuta
    expect(zoneFor(countryByCode('PT')!, -9.1)).toBe('Europe/Lisbon');
    expect(zoneFor(countryByCode('PT')!, -16.9)).toBe('Europe/Lisbon'); // Madeira
    expect(zoneFor(countryByCode('PT')!, -25.7)).toBe('Atlantic/Azores');
  });
});
