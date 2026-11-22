import { describe, expect, it } from 'vitest';
import { computeSky } from '@/lib/sky';

const at = (iso: string, zone = 'Europe/Helsinki') => computeSky(Date.parse(iso), zone);

const luminance = (hex: string) => {
  const channel = (index: number) => {
    const value = parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
};
const contrastWithWhite = (hex: string) => 1.05 / (luminance(hex) + 0.05);

describe('sun altitude', () => {
  it('puts the midsummer noon sun about 53 degrees up in Helsinki', () => {
    expect(at('2026-06-21T10:20:00Z').altitude).toBeCloseTo(53.3, 0);
  });

  it('has the sun on the horizon at Helsinki sunset on 19 November (about 15.35)', () => {
    expect(Math.abs(at('2026-11-19T13:35:00Z').altitude)).toBeLessThan(1);
  });

  it('falls back to Helsinki for a zone outside the table', () => {
    const iso = '2026-06-21T10:20:00Z';
    expect(at(iso, 'America/New_York').altitude).toBe(at(iso).altitude);
  });
});

describe('looks', () => {
  it('is dark in Helsinki by four in November', () => {
    expect(at('2026-11-19T14:10:00Z').look).toBe('twilight');
    expect(at('2026-11-19T15:30:00Z').look).toBe('night');
  });

  it('is still light in Helsinki at 23 in June, and never fully night', () => {
    expect(at('2026-06-21T20:00:00Z').look).not.toBe('night');
    expect(at('2026-06-21T22:20:00Z').look).toBe('twilight');
  });

  it('shows golden hour with the sun just above the horizon and day when it is high', () => {
    expect(at('2026-11-19T13:10:00Z').look).toBe('golden');
    expect(at('2026-06-21T10:20:00Z').look).toBe('day');
    expect(at('2026-06-21T11:00:00Z', 'Europe/Madrid').look).toBe('day');
  });

  it('keeps white text at 4.5:1 or better on the top three sky stops at every sun altitude', () => {
    // A full day in ten-minute steps at midsummer and at midwinter covers every blend.
    for (const day of ['2026-06-21', '2026-12-21', '2026-03-20']) {
      for (let minute = 0; minute < 1440; minute += 10) {
        const sky = computeSky(Date.parse(`${day}T00:00:00Z`) + minute * 60000, 'Europe/Helsinki');
        for (const stop of ['--sky-1', '--sky-2', '--sky-3']) {
          expect(contrastWithWhite(sky.vars[stop])).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });
});

describe('windows follow the clock', () => {
  it('lights many in the evening, few after midnight and some in the morning', () => {
    expect(at('2026-11-19T18:41:00Z').windows).toBe(3); // 20.41
    expect(at('2026-11-20T00:30:00Z').windows).toBe(1); // 02.30
    expect(at('2026-11-19T06:10:00Z').windows).toBe(2); // 08.10
  });

  it('uses the local time of the zone, not UTC', () => {
    expect(at('2026-11-19T22:45:00Z', 'Europe/Lisbon').windows).toBe(3); // 22.45 in Lisbon
    expect(at('2026-11-19T22:45:00Z', 'Europe/Helsinki').windows).toBe(1); // 00.45 the next day in Helsinki
  });
});

describe('inline script', () => {
  it('is self-contained, so it can be serialised with toString()', () => {
    const copy = new Function(`return (${computeSky.toString()})`)() as typeof computeSky;
    const now = Date.parse('2026-11-19T18:41:00Z');
    expect(copy(now, 'Europe/Helsinki')).toEqual(computeSky(now, 'Europe/Helsinki'));
  });
});
