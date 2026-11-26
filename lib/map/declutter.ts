/**
 * Which markers are drawn in full and which as the small sign (PLAN.md section 5,
 * "Markers"). From afar the pharmacies of a neighbourhood are a few pixels apart: ten
 * capsules with walking times lay on top of each other and on the you-are-here dot, and
 * nothing could be read. Where two would overlap, the one that matters more stays in full
 * and the other becomes the sign the map itself draws for every pharmacy beyond the list:
 * still there, still in its place, still a button. Pure, and cheap enough for every frame
 * of a pan or a pinch.
 *
 * And which of them can be pressed at all (PLAN.md section 9, WCAG 2.5.8). A marker stands
 * where its pharmacy is, and the bar, the sheet, the credit, the edge chips and other markers
 * lie where they lie: some marker always ends up half under one of them. One that has less
 * than TARGET_PX by TARGET_PX of itself left is nothing a finger can aim at, so it is not
 * offered as a button:
 * - under the bar, the sheet or the credit, or beyond the map's edge, it is taken off the map
 *   (`away`). Its pharmacy is still in the list, and an open one gets its edge chip: a
 *   pharmacy is on the map as its marker or as its chip, never as both. The same goes for a
 *   marker that has its room and is cut where it is read: a time with its lower half under
 *   the sheet says less than the chip does.
 * - under a chip, the zoom buttons or the markers that matter more, it stays drawn where it
 *   is and is no button (`crowded`), like the signs the map itself draws beyond the list.
 */

import type { Box, Point } from './camera.ts';

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
/** The least of a control that has to be free for a finger: WCAG 2.5.8, and what axe's `target-size` measures. */
export const TARGET_PX = 24;
/** The least a marker's button measures each way in full, and as a sign (MapMarker.module.css). */
export const FULL_TARGET_PX = 44;
export const SIGN_TARGET_PX = 36;
/**
 * How much of what is drawn of a marker may be hidden on a side before the marker is taken
 * off the map: this part of its height. A capsule is 30 px tall with its time in the middle
 * 15: a quarter is its padding, and what is cut beyond that is the text.
 */
const MAY_HIDE = 1 / 4;
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
  /** The markers the map does not show: what is left of them could not be pressed. Empty when no cover is given. */
  away: Set<string>;
}

/** What lies over the map at its edges, in the map's own pixels. */
export interface Cover {
  /** What the phone's bar and sheet and the map's own edges leave of it. */
  clear: Box;
  /** The app's own things that lie on the map along those edges: the credit. */
  fixed?: readonly Box[];
}

type Rect = Box;

const rect = (centre: Point, width: number, height: number, air = 0): Rect => ({
  left: centre.x - width / 2 - air,
  top: centre.y - height / 2 - air,
  right: centre.x + width / 2 + air,
  bottom: centre.y + height / 2 + air,
});

const overlap = (a: Rect, b: Rect): boolean => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/**
 * A pixel more than the criterion asks. The map counts in whole pixels, a marker's point and
 * its size both, and a browser lays the sheet and the chips out in fractions of one: what is
 * 24 px here may be 23.6 on the page.
 */
const SLACK_PX = 1;
const roomy = (box: Rect): boolean => box.right - box.left >= TARGET_PX + SLACK_PX && box.bottom - box.top >= TARGET_PX + SLACK_PX;

/**
 * Whether a control with this box has TARGET_PX by TARGET_PX of itself free once everything
 * in `over` lies on it, counting only what is inside `within` when that is given.
 */
export function hasRoom(target: Box, over: readonly Box[], within?: Box): boolean {
  const whole = within
    ? { left: Math.max(target.left, within.left), top: Math.max(target.top, within.top), right: Math.min(target.right, within.right), bottom: Math.min(target.bottom, within.bottom) }
    : target;
  let free = roomy(whole) ? [whole] : [];
  for (const cover of over) {
    if (free.length === 0) return false;
    // What is left above, below and on either side of the cover, each piece as large as it can
    // be: a free square lies wholly inside one of the four.
    free = free.flatMap((box) =>
      overlap(box, cover) ? [{ ...box, bottom: cover.top }, { ...box, top: cover.bottom }, { ...box, right: cover.left }, { ...box, left: cover.right }].filter(roomy) : [box],
    );
  }
  return free.length > 0;
}

/** The box a marker's button takes around its point: in full, or as a sign. */
export function targetOf(centre: Point, size: { width: number; height: number }, small: boolean): Box {
  return small ? rect(centre, SIGN_TARGET_PX, SIGN_TARGET_PX) : rect(centre, Math.max(size.width, FULL_TARGET_PX), Math.max(size.height, FULL_TARGET_PX));
}

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
 * - With a `cover`, a marker is away when the cover hides more of what is drawn of it than
 *   its outer quarter, or leaves its button no room: it is not drawn, and takes no room
 *   from the others.
 */
export function declutter(markers: readonly Sized[], dot: Point | undefined, zoom: number, cover?: Cover): Decluttered {
  const small = new Set<string>();
  const away = new Set<string>();
  const shows = (centre: Point, marker: Sized, sign: boolean): boolean => {
    if (!cover) return true;
    const { clear, fixed = [] } = cover;
    // What has to be seen of it: the capsule, the disc or the sign without its outer quarter.
    const drawn = sign ? { width: SIGN_PX * signScale(zoom), height: SIGN_PX * signScale(zoom) } : marker;
    const core = rect(centre, drawn.width - 2 * MAY_HIDE * drawn.height, drawn.height - 2 * MAY_HIDE * drawn.height);
    const seen = core.left >= clear.left && core.right <= clear.right && core.top >= clear.top && core.bottom <= clear.bottom && !fixed.some((other) => overlap(core, other));
    return seen && hasRoom(targetOf(centre, marker, sign), fixed, clear);
  };
  if (zoom < FIRST_FROM_ZOOM) {
    for (const marker of markers) (shows(marker, marker, true) ? small : away).add(marker.id);
    return { small, away };
  }
  const streets = zoom >= FULL_FROM_ZOOM;
  const placed: Rect[] = [];
  const dotRect = dot && rect(dot, DOT_PX, DOT_PX);
  let shift: Point | undefined;
  markers.forEach((marker, index) => {
    const air = AIR_PX + (marker.small ? BACK_PX : 0);
    let full = rect(marker, marker.width, marker.height, air);
    if (index === 0) {
      let moved: Point | undefined;
      if (dotRect && overlap(rect(marker, marker.width, marker.height), dotRect)) {
        // Clear of the dot, by the shorter of the two ways, towards the side it is already on.
        const across = marker.x >= dot.x ? dotRect.right - (marker.x - marker.width / 2) : dotRect.left - (marker.x + marker.width / 2);
        const along = marker.y > dot.y ? dotRect.bottom - (marker.y - marker.height / 2) : dotRect.top - (marker.y + marker.height / 2);
        moved = Math.abs(across) < Math.abs(along) ? { x: Math.round(across), y: 0 } : { x: 0, y: Math.round(along) };
        full = rect({ x: marker.x + moved.x, y: marker.y + moved.y }, marker.width, marker.height, AIR_PX);
      }
      if (!shows({ x: marker.x + (moved?.x ?? 0), y: marker.y + (moved?.y ?? 0) }, marker, false)) return void away.add(marker.id);
      shift = moved;
      placed.push(full);
      return;
    }
    const sign = !streets || (dotRect && overlap(full, dotRect)) || placed.some((other) => overlap(full, other));
    if (!shows(marker, marker, !!sign)) return void away.add(marker.id);
    if (sign) {
      small.add(marker.id);
      placed.push(rect(marker, SIGN_PX, SIGN_PX));
    } else {
      placed.push(full);
    }
  });
  return { small, shift, away };
}

export interface Target extends Box {
  id: string;
  /** Drawn as a sign. */
  small?: boolean;
}

/**
 * Which of the drawn markers are not buttons: the ones that the others, and what lies on the
 * map above them all (`over`: the edge chips, the zoom buttons), leave less than a finger's
 * room. `targets` are the markers' buttons in the order they matter.
 *
 * Capsules and discs come before signs, each kind in its order, and one that comes later is
 * a button only if that takes the room of none before it: whichever of two the browser
 * draws on top, each button that is offered has its room.
 */
export function crowded(targets: readonly Target[], over: readonly Box[]): Set<string> {
  const still = new Set<string>();
  const buttons: Target[] = [];
  for (const target of [...targets.filter((one) => !one.small), ...targets.filter((one) => one.small)]) {
    const near = buttons.filter((button) => overlap(button, target));
    const fits =
      hasRoom(target, [...over, ...near]) &&
      near.every((button) => hasRoom(button, [...over, ...buttons.filter((other) => other !== button && overlap(other, button)), target]));
    if (fits) buttons.push(target);
    else still.add(target.id);
  }
  return still;
}
