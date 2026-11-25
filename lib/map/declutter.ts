/**
 * Which markers are drawn in full and which as the small sign (PLAN.md section 5,
 * "Markers"). From afar the pharmacies of a neighbourhood are a few pixels apart: ten
 * capsules with walking times lay on top of each other and on the you-are-here dot, and
 * nothing could be read. Where two would overlap, the one that matters more stays in full
 * and the other becomes the sign the map itself draws for every pharmacy beyond the list:
 * still there, still in its place, still a button. Pure, and cheap enough for every frame
 * of a pan or a pinch.
 */

import type { Point } from './camera.ts';

/**
 * Below this zoom the map shows a region and not its streets: a walking time on a marker
 * says nothing about where, and a capsule covers a whole town. Every marker but the first is
 * a sign.
 */
export const FULL_FROM_ZOOM = 11;
/**
 * The first marker, the answer, stays in full further out: the app itself frames the map as
 * far out as this when the nearest open pharmacy is tens of kilometres away, and the answer
 * is what that view is for. Below it the map shows a country, which only a pinch reaches:
 * there the first one is a sign too.
 */
export const FIRST_FROM_ZOOM = 8;
/** The small sign with the ring it stands on. */
export const SIGN_PX = 24;
/**
 * How large a sign is drawn at each zoom, as [zoom, scale] with straight lines between: half
 * size where a whole city is on screen, full size from where its blocks show. The map's own
 * layer of signs and the markers that have become signs share it, so the two are one size.
 */
export const SIGN_SCALES: [number, number][] = [
  [9, 0.5],
  [12, 0.75],
  [14.5, 1],
];

export function signScale(zoom: number): number {
  const [first] = SIGN_SCALES;
  if (zoom <= first[0]) return first[1];
  for (let index = 1; index < SIGN_SCALES.length; index++) {
    const [from, small] = SIGN_SCALES[index - 1];
    const [to, large] = SIGN_SCALES[index];
    if (zoom <= to) return small + ((zoom - from) / (to - from)) * (large - small);
  }
  return SIGN_SCALES[SIGN_SCALES.length - 1][1];
}
/** The you-are-here dot with its ring, and a little air around it. */
export const DOT_PX = 30;
/** The ring a marker stands on, and the air between two that count as apart. */
const AIR_PX = 3;
/**
 * A marker that is a sign needs this much more room before it is drawn in full again, so
 * that it doesn't flicker between the two while a pinch passes the point where they meet.
 */
const BACK_PX = 6;

export interface Sized extends Point {
  id: string;
  /** Its size when drawn in full: a capsule with its time, or an unlit disc. */
  width: number;
  height: number;
  /** Whether it is a sign right now. */
  small?: boolean;
}

export interface Decluttered {
  /** The markers to draw as the small sign. */
  small: Set<string>;
  /** How far the first marker is moved off the dot, when it would lie on it. */
  shift?: Point;
}

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const rect = (centre: Point, width: number, height: number, air = 0): Rect => ({
  left: centre.x - width / 2 - air,
  top: centre.y - height / 2 - air,
  right: centre.x + width / 2 + air,
  bottom: centre.y + height / 2 + air,
});

const overlap = (a: Rect, b: Rect): boolean => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/**
 * `markers` in the order they matter: the selected pharmacy, the nearest open one, the
 * other open ones from the nearest, then the rest. `dot` is where the user is, when the
 * map shows it.
 *
 * - The first marker is always drawn in full down to the zoom where the map shows a country.
 *   If it would lie on the dot it is moved just clear of it, the shorter way: the dot is
 *   never covered.
 * - Every other marker is drawn in full only where the zoom shows streets and that covers
 *   neither the dot nor anything already placed, sign or capsule. Otherwise it is a sign.
 */
export function declutter(markers: readonly Sized[], dot: Point | undefined, zoom: number): Decluttered {
  const small = new Set<string>();
  if (zoom < FIRST_FROM_ZOOM) {
    for (const marker of markers) small.add(marker.id);
    return { small };
  }
  const streets = zoom >= FULL_FROM_ZOOM;
  const placed: Rect[] = [];
  const dotRect = dot && rect(dot, DOT_PX, DOT_PX);
  let shift: Point | undefined;
  markers.forEach((marker, index) => {
    const air = AIR_PX + (marker.small ? BACK_PX : 0);
    let full = rect(marker, marker.width, marker.height, air);
    if (index === 0) {
      if (dotRect && overlap(rect(marker, marker.width, marker.height), dotRect)) {
        // Clear of the dot, by the shorter of the two ways, towards the side it is already on.
        const across = marker.x >= dot.x ? dotRect.right - (marker.x - marker.width / 2) : dotRect.left - (marker.x + marker.width / 2);
        const along = marker.y > dot.y ? dotRect.bottom - (marker.y - marker.height / 2) : dotRect.top - (marker.y + marker.height / 2);
        shift = Math.abs(across) < Math.abs(along) ? { x: Math.round(across), y: 0 } : { x: 0, y: Math.round(along) };
        full = rect({ x: marker.x + shift.x, y: marker.y + shift.y }, marker.width, marker.height, AIR_PX);
      }
      placed.push(full);
      return;
    }
    if (!streets || (dotRect && overlap(full, dotRect)) || placed.some((other) => overlap(full, other))) {
      small.add(marker.id);
      placed.push(rect(marker, SIGN_PX, SIGN_PX));
    } else {
      placed.push(full);
    }
  });
  return { small, shift };
}
