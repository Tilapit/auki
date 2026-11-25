import { describe, expect, it } from 'vitest';
import { declutter, DOT_PX, FIRST_FROM_ZOOM, FULL_FROM_ZOOM, signScale, type Sized } from '@/lib/map/declutter';
import { buildStyle } from '@/lib/map/style';

/**
 * Which markers are drawn in full and which as the small sign (lib/map/declutter.ts).
 * Janne's iPhone, 25 Nov 2026: at zooms 12 to 14 six or seven capsules lay on top of each
 * other around Kamppi and covered the you-are-here dot, and at country zoom the nearest one
 * still sat large over southern Finland.
 */

const capsule = (id: string, x: number, y: number, small = false): Sized => ({ id, x, y, width: 78, height: 30, small });
const disc = (id: string, x: number, y: number): Sized => ({ id, x, y, width: 25, height: 25 });
const far = { x: 1000, y: 1000 };

describe('markers that would overlap', () => {
  it('leaves markers that stand apart as they are', () => {
    const { small, shift } = declutter([capsule('a', 100, 100), capsule('b', 100, 140), capsule('c', 200, 100), disc('d', 300, 300)], far, 15);
    expect([...small]).toEqual([]);
    expect(shift).toBeUndefined();
  });

  it('keeps the one that matters most in full and makes signs of the ones it would cover', () => {
    const { small } = declutter([capsule('nearest', 100, 100), capsule('second', 130, 110), capsule('third', 90, 80), disc('closed', 110, 105), capsule('apart', 300, 100)], far, 13);
    expect([...small].sort()).toEqual(['closed', 'second', 'third']);
  });

  it('does not let a later capsule cover a sign either: in a pile only the first is in full', () => {
    // The third is clear of the first capsule, but would lie on the second, which is a sign by now.
    const { small } = declutter([capsule('nearest', 100, 100), capsule('second', 170, 100), capsule('third', 215, 100)], far, 13);
    expect([...small]).toEqual(['second', 'third']);
  });

  it('counts the ring a marker stands on: two that only touch are apart, two that share a pixel are not', () => {
    expect(declutter([capsule('a', 100, 100), capsule('b', 100, 137)], far, 15).small.size).toBe(0);
    expect(declutter([capsule('a', 100, 100), capsule('b', 100, 132)], far, 15).small.has('b')).toBe(true);
  });

  it('needs more room to come back in full than it took to become a sign, so a pinch does not make it flicker', () => {
    const apart = 140;
    expect(declutter([capsule('a', 100, 100), capsule('b', 100, apart)], far, 15).small.size).toBe(0);
    expect(declutter([capsule('a', 100, 100), capsule('b', 100, apart, true)], far, 15).small.has('b')).toBe(true);
    expect(declutter([capsule('a', 100, 100), capsule('b', 100, apart + 8, true)], far, 15).small.size).toBe(0);
  });
});

describe('the you-are-here dot', () => {
  const dot = { x: 200, y: 300 };

  it('is never covered: any marker but the first that would lie on it is a sign', () => {
    const { small } = declutter([capsule('nearest', 400, 300), capsule('second', 210, 310), disc('closed', 195, 290)], dot, 15);
    expect([...small].sort()).toEqual(['closed', 'second']);
  });

  it('moves the first marker just clear of it, the shorter way, and keeps it in full', () => {
    // A little above the dot: up, until its lower edge is at the dot's upper edge.
    const above = declutter([capsule('nearest', 205, 290)], dot, 13);
    expect(above.small.size).toBe(0);
    expect(above.shift).toEqual({ x: 0, y: -(DOT_PX / 2 + 15 - 10) });
    // Below it: down.
    expect(declutter([capsule('nearest', 205, 305)], dot, 13).shift).toEqual({ x: 0, y: DOT_PX / 2 + 15 - 5 });
    // Beside it, where a small step across is shorter than the step up.
    expect(declutter([capsule('nearest', 250, 300)], dot, 13).shift).toEqual({ x: 39 + DOT_PX / 2 - 50, y: 0 });
    // Clear of it already: nothing moves.
    expect(declutter([capsule('nearest', 205, 250)], dot, 13).shift).toBeUndefined();
  });

  it('judges the others against the first marker where it stands after the move', () => {
    // The first is lifted off the dot, to y 270. One at y 262 was clear of it before, and is not now.
    const { small, shift } = declutter([capsule('nearest', 200, 300), capsule('second', 200, 262)], dot, 13);
    expect(shift).toEqual({ x: 0, y: -30 });
    expect(small.has('second')).toBe(true);
  });
});

describe('from afar', () => {
  const markers = [capsule('nearest', 100, 100), capsule('second', 400, 400), disc('closed', 600, 100)];

  it('draws every marker but the first as a sign below the zoom where streets show, however far apart they stand', () => {
    expect([...declutter(markers, far, FULL_FROM_ZOOM - 0.1).small]).toEqual(['second', 'closed']);
    expect(declutter(markers, far, FULL_FROM_ZOOM).small.size).toBe(0);
  });

  it('keeps the first in full as far out as the app itself frames the map, and clear of the dot there too', () => {
    const framed = declutter([capsule('answer', 205, 290), capsule('second', 400, 400)], { x: 200, y: 300 }, FIRST_FROM_ZOOM);
    expect([...framed.small]).toEqual(['second']);
    expect(framed.shift).toEqual({ x: 0, y: -20 });
  });

  it('draws the first as a sign too where the map shows a country: no time sits over half of Finland', () => {
    expect([...declutter(markers, far, FIRST_FROM_ZOOM - 0.1).small]).toEqual(['nearest', 'second', 'closed']);
  });

  it('moves nothing there: a sign may lie under the dot, which is drawn over it', () => {
    expect(declutter([capsule('nearest', 200, 300)], { x: 200, y: 300 }, 6).shift).toBeUndefined();
  });
});

describe('the size of a sign', () => {
  it('is half from afar, full from where the blocks show, and even in between', () => {
    expect(signScale(5)).toBe(0.5);
    expect(signScale(9)).toBe(0.5);
    expect(signScale(10.5)).toBeCloseTo(0.625);
    expect(signScale(12)).toBe(0.75);
    expect(signScale(13.25)).toBeCloseTo(0.875);
    expect(signScale(14.5)).toBe(1);
    expect(signScale(18)).toBe(1);
  });

  it('is the same for the markers as for the layer the map draws itself', () => {
    const layer = buildStyle({ theme: 'light', locale: 'fi' }).layers.find((candidate) => candidate.id === 'area-pharmacies');
    const size = (layer as { layout: { 'icon-size': unknown[] } }).layout['icon-size'];
    expect(size).toEqual(['interpolate', ['linear'], ['zoom'], 9, 0.5, 12, 0.75, 14.5, 1]);
  });
});
