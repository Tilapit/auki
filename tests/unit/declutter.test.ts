import { describe, expect, it } from 'vitest';
import { crowded, declutter, DOT_PX, FIRST_FROM_ZOOM, FULL_FROM_ZOOM, hasRoom, signScale, TARGET_PX, targetOf, type Sized, type Target } from '@/lib/map/declutter';
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

/**
 * Which markers can be pressed at all (PLAN.md section 9). axe's `target-size` found markers
 * with a strip of 44 by 1 px left under the phone's sheet, 14 by 44 px at the screen's edge,
 * and signs four pixels apart: 25 and 26 Nov 2026.
 */
describe('room to press', () => {
  const box = (left: number, top: number, right: number, bottom: number) => ({ left, top, right, bottom });
  const target = box(100, 100, 144, 144);

  it('is 24 by 24 px of the control, free of everything that lies on it, and a pixel more for rounding', () => {
    expect(TARGET_PX).toBe(24);
    expect(hasRoom(target, [])).toBe(true);
    // A cover over its lower 19 px leaves 44 by 25.
    expect(hasRoom(target, [box(0, 125, 400, 400)])).toBe(true);
    // One pixel more, and 44 by 24 is left: on the page that may be 23.6.
    expect(hasRoom(target, [box(0, 124, 400, 400)])).toBe(false);
  });

  it('is one free square, not the sum of slivers', () => {
    // Twenty pixels free on the left and twenty on the right: forty in all, and no room for a finger.
    expect(hasRoom(target, [box(120, 0, 124, 400)])).toBe(false);
    // Two covers that leave a corner of 25 by 25.
    expect(hasRoom(target, [box(125, 0, 400, 400), box(0, 125, 400, 400)])).toBe(true);
    expect(hasRoom(target, [box(124, 0, 400, 400), box(0, 125, 400, 400)])).toBe(false);
  });

  it('counts only what is inside the part of the map that shows', () => {
    const clear = box(0, 64, 390, 384);
    expect(hasRoom(box(-19, 100, 25, 144), [], clear)).toBe(true);
    expect(hasRoom(box(-20, 100, 24, 144), [], clear)).toBe(false);
    expect(hasRoom(box(100, 20, 144, 64), [], clear)).toBe(false);
  });

  it('measures a marker by its button: 44 px at least in full, 36 as a sign', () => {
    expect(targetOf({ x: 100, y: 100 }, { width: 25, height: 25 }, false)).toEqual(box(78, 78, 122, 122));
    expect(targetOf({ x: 100, y: 100 }, { width: 92, height: 30 }, false)).toEqual(box(54, 78, 146, 122));
    expect(targetOf({ x: 100, y: 100 }, { width: 92, height: 30 }, true)).toEqual(box(82, 82, 118, 118));
  });
});

describe('markers the map does not show', () => {
  // A phone: the bar ends at 64 px, the sheet begins at 384.
  const clear = { left: 0, top: 64, right: 390, bottom: 384 };

  it('are none when nothing covers the map', () => {
    expect(declutter([capsule('a', -500, 100), disc('b', 100, 5000)], far, 15).away.size).toBe(0);
  });

  it('are the ones beyond the edge, under the bar and under the sheet', () => {
    const { away, small } = declutter([capsule('in', 200, 200), capsule('left', -1, 200), capsule('bar', 200, 63), disc('sheet', 300, 385), disc('far', 2000, 200)], far, 15, { clear });
    expect([...away].sort()).toEqual(['bar', 'far', 'left', 'sheet']);
    expect(small.size).toBe(0);
  });

  it('are also the ones the sheet hides more than the outer quarter of: what is left is not read', () => {
    // A capsule is 30 px tall: seven of them may be under the sheet, and eight may not.
    expect(declutter([capsule('in', 200, 200), capsule('edge', 300, 376)], far, 15, { clear }).away.size).toBe(0);
    expect([...declutter([capsule('in', 200, 200), capsule('edge', 300, 377)], far, 15, { clear }).away]).toEqual(['edge']);
    // A disc is 25: six, and not seven.
    expect(declutter([capsule('in', 200, 200), disc('edge', 300, 377)], far, 15, { clear }).away.size).toBe(0);
    expect([...declutter([capsule('in', 200, 200), disc('edge', 300, 378)], far, 15, { clear }).away]).toEqual(['edge']);
  });

  it('keeps a capsule that the screen\'s edge cuts inside its padding, and not one cut into its time', () => {
    // 78 px wide: its left end is seven pixels beyond the edge, then eight.
    expect(declutter([capsule('in', 200, 200), capsule('cut', 32, 300)], far, 15, { clear }).away.size).toBe(0);
    expect([...declutter([capsule('in', 200, 200), capsule('cut', 31, 300)], far, 15, { clear }).away]).toEqual(['cut']);
  });

  it('are the ones the credit leaves no room: it lies on the map just above the sheet', () => {
    const credit = { left: 8, top: 352, right: 156, bottom: 376 };
    // The disc's button is 302 to 346 without the credit, and has its room.
    expect(declutter([disc('above', 60, 324)], far, 15, { clear, fixed: [credit] }).away.size).toBe(0);
    // Lower, the credit hides its outer quarter, and then more.
    expect(declutter([disc('over', 60, 345)], far, 15, { clear, fixed: [credit] }).away.size).toBe(0);
    expect(declutter([disc('under', 60, 346)], far, 15, { clear, fixed: [credit] }).away.has('under')).toBe(true);
    // Beside the credit the same height is free.
    expect(declutter([disc('beside', 200, 346)], far, 15, { clear, fixed: [credit] }).away.size).toBe(0);
  });

  it('take no room from the others: a capsule next to one that is away stays in full', () => {
    // Without the cover the second would lie on the first and be a sign.
    expect(declutter([capsule('first', 100, 60), capsule('second', 110, 90)], far, 15).small.has('second')).toBe(true);
    const { small, away } = declutter([capsule('first', 100, 60), capsule('second', 110, 90)], far, 15, { clear });
    expect([...away]).toEqual(['first']);
    expect(small.size).toBe(0);
  });

  it('are judged as signs where they are signs, also where the map shows a country', () => {
    // A sign's button reaches 18 px above its middle: six pixels above the sheet 24 px of it show, seven pixels above 25.
    const sign = (id: string, y: number) => capsule(id, 200, y);
    expect([...declutter([sign('a', 200), sign('b', 378)], far, 6, { clear }).away]).toEqual(['b']);
    expect(declutter([sign('a', 200), sign('b', 377)], far, 6, { clear }).away.size).toBe(0);
    expect([...declutter([sign('a', 200), sign('b', 377)], far, 6, { clear }).small]).toEqual(['a', 'b']);
    // From afar a sign is drawn 12 px across: its button's room decides, not what the sheet hides of it.
    expect(declutter([sign('a', 200), sign('b', 377)], far, 6, { clear }).away.size).toBe(0);
  });

  it('are judged where the first marker stands once it is moved off the dot', () => {
    // Where its pharmacy is, all of it is below the bar. Lifted off the dot, half of it is under the bar: it is away, and nothing is moved.
    const dot = { x: 200, y: 95 };
    expect(declutter([capsule('nearest', 200, 85)], undefined, 15, { clear }).away.size).toBe(0);
    const { away, shift } = declutter([capsule('nearest', 200, 85)], dot, 15, { clear });
    expect([...away]).toEqual(['nearest']);
    expect(shift).toBeUndefined();
  });
});

describe('markers that are drawn and are no buttons', () => {
  const full = (id: string, x: number, y: number, width = 44): Target => ({ id, ...targetOf({ x, y }, { width, height: 30 }, false) });
  const sign = (id: string, x: number, y: number): Target => ({ id, small: true, ...targetOf({ x, y }, { width: 78, height: 30 }, true) });

  it('are none where every button has its room', () => {
    expect(crowded([full('a', 100, 100), full('b', 100, 133), sign('c', 200, 100), sign('d', 225, 100)], []).size).toBe(0);
    // A pixel nearer, and the second sign is none.
    expect([...crowded([sign('c', 200, 100), sign('d', 224, 100)], [])]).toEqual(['d']);
  });

  it('are the signs in a pile that the ones before them leave no room: the first keeps its button', () => {
    // Riga from afar: nine signs within seventy pixels.
    const pile = [sign('a', 319, 214), sign('b', 290, 201), sign('c', 278, 218), sign('d', 294, 209), sign('e', 298, 211), sign('f', 307, 219), sign('g', 313, 200), sign('h', 314, 215), sign('i', 311, 179)];
    const still = crowded(pile, []);
    expect(still.has('a')).toBe(false);
    expect(still.size).toBeGreaterThan(4);
    // Whichever the browser draws on top: every one that is a button has its room among the buttons.
    const buttons = pile.filter((one) => !still.has(one.id));
    for (const button of buttons) expect(hasRoom(button, buttons.filter((other) => other !== button))).toBe(true);
  });

  it('are signs rather than capsules: a sign that matters more still yields to the capsule beside it', () => {
    // The sign comes first in the order, and the capsule's button covers all but 10 px of the sign's.
    expect([...crowded([sign('sign', 100, 100), full('capsule', 126, 100, 80)], [])]).toEqual(['sign']);
  });

  it('are the markers under an edge chip or a zoom button, while it lies there', () => {
    const chip = { left: 1, top: 534, right: 111, bottom: 578 };
    expect([...crowded([full('under', 8, 565), full('clear', 200, 565)], [chip])]).toEqual(['under']);
    expect(crowded([full('under', 8, 565), full('clear', 200, 565)], []).size).toBe(0);
  });
});
