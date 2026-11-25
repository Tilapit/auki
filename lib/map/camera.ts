/**
 * Where things are on the map, in pixels of its container (PLAN.md section 5). Pure.
 *
 * The map is drawn in two ways: by MapLibre, on real tiles, and without it, as the land
 * colour alone (in /dev/states, and whenever MapLibre can't start). Markers, the edge chips
 * and the framing work the same in both, because they are all placed from this arithmetic:
 * with MapLibre the pixel of a place comes from its camera, without it from the one here.
 *
 * Zoom is MapLibre's: tiles of 512 px. The fixtures and `Scene.views` count tiles of 256 px,
 * one level more for the same view.
 */

import { project as worldPixels } from '../geo.ts';
import type { Compass } from '../geo.ts';
import type { MapViewSpec } from '../types';

export interface Camera {
  lat: number;
  lon: number;
  zoom: number;
}

export interface Size {
  width: number;
  height: number;
}

/** The parts of the container that something else covers: the phone's bar and sheet, the desktop legend. */
export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface LatLon {
  lat: number;
  lon: number;
}

export type Project = (lat: number, lon: number) => Point;

export const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

export const MIN_ZOOM = 5;
export const MAX_ZOOM = 18;
/**
 * The most device pixels the map draws per CSS pixel. A phone's screen has three: the map
 * would fill 2.25 times the pixels of a 2x one on every frame of a pan, for streets that look
 * the same in motion. Measured on real tiles with a software renderer, CPU four times slower:
 * a frame every 50 ms at 3x, every 33 ms at 2x (DESIGN-LOG.md, 25 Nov 2026). The markers and
 * everything else on the page are not the map's canvas: they stay at the screen's own sharpness.
 */
export const MAP_PIXEL_RATIO = 2;

const clampZoom = (zoom: number): number => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

/** A view from a scene, as a camera. */
export function cameraOf(view: MapViewSpec): Camera {
  return { lat: view.center[0], lon: view.center[1], zoom: clampZoom(view.zoom - 1) };
}

export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** What is left of the container inside the insets. Never inside out. */
export function boxOf(size: Size, insets: Insets): Box {
  const left = Math.min(insets.left, size.width / 2);
  const top = Math.min(insets.top, size.height / 2);
  return { left, top, right: Math.max(left, size.width - insets.right), bottom: Math.max(top, size.height - insets.bottom) };
}

const centreOf = (box: Box): Point => ({ x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 });

/** The pixel of a place: the camera's centre sits in the middle of what the padding leaves free. */
export function projector(camera: Camera, size: Size, padding: Insets = NO_INSETS): Project {
  const middle = centreOf(boxOf(size, padding));
  const [cx, cy] = worldPixels(camera.lat, camera.lon, camera.zoom + 1);
  return (lat, lon) => {
    const [x, y] = worldPixels(lat, lon, camera.zoom + 1);
    return { x: Math.round((x - cx + middle.x) * 10) / 10, y: Math.round((y - cy + middle.y) * 10) / 10 };
  };
}

/** Metres on the ground for one pixel on the map. */
export function metersPerPixel(lat: number, zoom: number): number {
  return (40075016.686 * Math.cos((lat * Math.PI) / 180)) / (512 * 2 ** zoom);
}

/** Web Mercator, as fractions of the world: 0 to 1 from west to east and from north to south. */
function toWorld({ lat, lon }: LatLon): Point {
  const [x, y] = worldPixels(lat, lon, 0);
  return { x: x / 256, y: y / 256 };
}

function fromWorld({ x, y }: Point): LatLon {
  return { lat: (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI, lon: x * 360 - 180 };
}

/**
 * The camera that shows every one of the places inside the free part of the container,
 * with a margin around them. It never zooms in beyond `maxZoom`: two places a street apart
 * shouldn't fill the screen.
 */
export function fit(places: LatLon[], size: Size, padding: Insets, { margin = 56, maxZoom = 16 }: { margin?: number; maxZoom?: number } = {}): Camera | undefined {
  if (places.length === 0) return undefined;
  const points = places.map(toWorld);
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const west = Math.min(...xs);
  const east = Math.max(...xs);
  const north = Math.min(...ys);
  const south = Math.max(...ys);
  const box = boxOf(size, padding);
  const room = { width: Math.max(box.right - box.left - 2 * margin, 40), height: Math.max(box.bottom - box.top - 2 * margin, 40) };
  // At zoom z the world is 512 × 2^z pixels across.
  const zoomFor = (span: number, pixels: number) => (span <= 0 ? Infinity : Math.log2(pixels / (span * 512)));
  const zoom = clampZoom(Math.min(maxZoom, zoomFor(east - west, room.width), zoomFor(south - north, room.height)));
  return { ...fromWorld({ x: (west + east) / 2, y: (north + south) / 2 }), zoom: Math.floor(zoom * 100) / 100 };
}

export const isInside = (point: Point, box: Box): boolean => point.x >= box.left && point.x <= box.right && point.y >= box.top && point.y <= box.bottom;

export interface EdgeChip {
  /** Where the chip's centre goes: on the edge of the box, on the line towards the place. */
  x: number;
  y: number;
  /** The way to the place, degrees clockwise from up: the arrow turns to it. */
  degrees: number;
  /** The same in words, for the chip's label. The map is always north up. */
  side: Compass;
}

const SIDES: Compass[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

/**
 * The chip for a place outside the box, or undefined when the place is inside it. The chip
 * sits where the line from the middle of the box to the place leaves the box, pulled in by
 * half its own size so that it stays whole.
 *
 * With `always`, also for a place just inside the box: the map has taken its marker off
 * because the bar, the sheet or the edge hid too much of it (lib/map/declutter.ts), and the
 * chip stands on the same line, at the edge.
 *
 * No chip where the box can't hold one whole: with the phone's list fully open the map is a
 * strip under the bar, and half a chip there says nothing.
 */
export function edgeChip(point: Point, box: Box, half: Size = { width: 44, height: 22 }, always = false): EdgeChip | undefined {
  if (box.right - box.left < 2 * half.width || box.bottom - box.top < 2 * half.height) return undefined;
  if (!always && isInside(point, box)) return undefined;
  const middle = centreOf(box);
  const dx = point.x - middle.x;
  const dy = point.y - middle.y;
  if (dx === 0 && dy === 0) return undefined;
  const reachX = Math.max((box.right - box.left) / 2 - half.width, 1);
  const reachY = Math.max((box.bottom - box.top) / 2 - half.height, 1);
  // How far along the line the inner box ends: the nearer of its vertical and horizontal sides.
  const scale = Math.min(dx === 0 ? Infinity : reachX / Math.abs(dx), dy === 0 ? Infinity : reachY / Math.abs(dy));
  const degrees = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
  return {
    x: Math.round(middle.x + dx * scale),
    y: Math.round(middle.y + dy * scale),
    degrees: Math.round(degrees),
    side: SIDES[Math.round(degrees / 45) % 8],
  };
}

/**
 * Chips that would lie on top of each other are moved apart along the edge they are on.
 * The first ones keep their place, so the caller puts the most important first. A chip also
 * moves off anything in `keep`: the marker of the pharmacy the map is showing as its answer.
 */
export function spread<T extends EdgeChip>(chips: T[], box: Box, size: Size = { width: 92, height: 40 }, keep: readonly Box[] = []): T[] {
  const placed: T[] = [];
  for (const chip of chips) {
    let { x, y } = chip;
    const overlaps = () =>
      placed.some((other) => Math.abs(other.x - x) < size.width && Math.abs(other.y - y) < size.height) ||
      keep.some((kept) => x - size.width / 2 < kept.right && x + size.width / 2 > kept.left && y - size.height / 2 < kept.bottom && y + size.height / 2 > kept.top);
    const middle = centreOf(box);
    // On a side edge the chip slides down or up; on the top or bottom edge it slides sideways.
    const vertical = Math.abs(x - middle.x) / Math.max(box.right - box.left, 1) > Math.abs(y - middle.y) / Math.max(box.bottom - box.top, 1);
    // One way only, towards the longer half of the edge, until it is clear of the others.
    const dy = vertical ? (y <= middle.y ? size.height : -size.height) : 0;
    const dx = vertical ? 0 : x <= middle.x ? size.width : -size.width;
    for (let step = 0; step < 6 && overlaps(); step++) {
      x += dx;
      y += dy;
    }
    placed.push({ ...chip, x, y });
  }
  return placed;
}

/** True when a place is drawn inside the box. */
export function shows(project: Project, place: LatLon, box: Box): boolean {
  return isInside(project(place.lat, place.lon), box);
}
