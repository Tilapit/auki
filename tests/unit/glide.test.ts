import { describe, expect, it } from 'vitest';
import { easingOf, FASTEST_PX_S, GLIDE_FROM_PX_S, glideOf, LEAD_UP_TO_MS, speedAt, STOP_AT_PX_S, type Sample } from '@/lib/map/glide';

/**
 * The map after a flick (lib/map/glide.ts): the deceleration of a list on an iPhone, so that
 * a pan feels as it does in Apple Maps.
 */

/** A finger that moves `pxPerSecond` to the right, sampled every 16 ms, up to `until`. */
const moving = (pxPerSecond: number, until: number, from = until - 160): Sample[] => {
  const samples: Sample[] = [];
  for (let t = from; t <= until; t += 16) samples.push({ t, x: (pxPerSecond * (t - from)) / 1000, y: 0 });
  return samples;
};

describe('the speed at letting go', () => {
  it('is what the finger was doing just before: 1,500 px a second is 1,500', () => {
    const speed = speedAt(moving(1500, 1000), 1000)!;
    expect(speed.x).toBeCloseTo(1500, -1);
    expect(speed.y).toBe(0);
  });

  it('does not count the gap between the last movement and the lifting: touches come a frame or three apart', () => {
    const samples = moving(1500, 1000);
    expect(speedAt(samples, 1016)!.x).toBeCloseTo(1500, -1);
    expect(speedAt(samples, 1050)!.x).toBeCloseTo(1500, -1);
  });

  it('is none for a finger that had stopped before it lifted', () => {
    const samples = moving(1500, 1000);
    expect(speedAt(samples, 1070)).toBeDefined();
    expect(speedAt(samples, 1071)).toBeUndefined();
    expect(speedAt(samples, 1500)).toBeUndefined();
  });

  it('is the speed of the last tenth of a second: a finger that slowed down before lifting has the slower speed', () => {
    // Fast until 900 ms, then slowly for a tenth of a second.
    const fast = moving(2000, 900, 700);
    const slow = moving(300, 1000, 900).map((sample) => ({ ...sample, x: sample.x + fast[fast.length - 1].x }));
    expect(speedAt([...fast, ...slow.slice(1)], 1010)!.x).toBeLessThan(600);
  });

  it('goes by touches that come slowly too: two of them fifty milliseconds apart are a speed', () => {
    expect(speedAt([{ t: 900, x: 0, y: 0 }, { t: 950, x: 30, y: 0 }, { t: 1000, x: 60, y: 0 }], 1020)!.x).toBeCloseTo(600);
  });

  it('needs two places to go by', () => {
    expect(speedAt([], 1000)).toBeUndefined();
    expect(speedAt([{ t: 990, x: 0, y: 0 }], 1000)).toBeUndefined();
  });
});

describe('the glide', () => {
  it('carries the map about half as many pixels as its speed was in pixels a second, in the way it was going', () => {
    const glide = glideOf({ x: 1500, y: 0 })!;
    expect(glide.x).toBeGreaterThan(700);
    expect(glide.x).toBeLessThan(760);
    expect(glide.y).toBe(0);
    const up = glideOf({ x: 0, y: -800 })!;
    expect(up.y).toBeLessThan(-380);
    expect(up.y).toBeGreaterThan(-400);
    const aslant = glideOf({ x: 600, y: 800 })!;
    expect(aslant.y / aslant.x).toBeCloseTo(800 / 600);
  });

  it('lasts a second or two, longer the faster the flick', () => {
    expect(glideOf({ x: 400, y: 0 })!.duration).toBeGreaterThan(1500);
    expect(glideOf({ x: 1500, y: 0 })!.duration).toBeGreaterThan(2200);
    expect(glideOf({ x: 1500, y: 0 })!.duration).toBeLessThan(2600);
  });

  it('is none below the speed of a finger that only moved the map', () => {
    expect(glideOf({ x: GLIDE_FROM_PX_S - 1, y: 0 })).toBeUndefined();
    expect(glideOf({ x: GLIDE_FROM_PX_S, y: 0 })).toBeDefined();
    expect(glideOf(undefined)).toBeUndefined();
  });

  it('is no longer for a wild flick than for the fastest one it counts', () => {
    expect(glideOf({ x: 20000, y: 0 })).toEqual(glideOf({ x: FASTEST_PX_S, y: 0 }));
  });
});

describe('the way a glide slows', () => {
  it('leaves at the finger\'s own speed: no hitch at the moment of letting go', () => {
    for (const pace of [300, 1500, 3000]) {
      const glide = glideOf({ x: pace, y: 0 })!;
      const easing = easingOf(glide.duration);
      // The first sixteen milliseconds, as a speed.
      const share = 16 / glide.duration;
      const speed = (easing(share) * glide.x) / 0.016;
      expect(speed / pace).toBeGreaterThan(0.95);
      expect(speed / pace).toBeLessThanOrEqual(1.0001);
    }
  });

  it('only ever slows, and ends where the map can no longer be seen to move', () => {
    const glide = glideOf({ x: 1500, y: 0 })!;
    const easing = easingOf(glide.duration);
    let last = Infinity;
    for (let step = 1; step <= 100; step++) {
      const moved = (easing(step / 100) - easing((step - 1) / 100)) * glide.x;
      expect(moved).toBeGreaterThan(0);
      expect(moved).toBeLessThan(last);
      last = moved;
    }
    expect(easing(0)).toBe(0);
    expect(easing(1)).toBe(1);
    // The last hundredth of its time, as a speed: about where it is taken to have stopped.
    expect(last / (glide.duration / 100 / 1000)).toBeLessThan(STOP_AT_PX_S * 1.2);
  });

  it('makes up for the frames the map stood still between the finger and the glide: it begins that far into itself', () => {
    const glide = glideOf({ x: 1200, y: 0 })!;
    // Thirty milliseconds at 1,200 px a second are 36 px: there on the glide's first frame.
    const late = easingOf(glide.duration, 30);
    expect(late(0) * glide.x).toBeGreaterThan(33);
    expect(late(0) * glide.x).toBeLessThan(37);
    // It ends where it would have ended, and does not go past it.
    expect(late(1)).toBe(1);
    expect(late(0.999)).toBeLessThanOrEqual(1);
    expect(LEAD_UP_TO_MS).toBeLessThan(100);
  });
});
