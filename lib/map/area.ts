/**
 * Every pharmacy the device holds, for the map (PLAN.md section 5, "Markers"). The list is
 * the nearest ten; the map shows all of them, from the tiles that are already there, and
 * the tiles of a new area once the map is moved to it. Pure.
 *
 * They are drawn by the map itself, as one layer of small signs, not as elements of the
 * page: there can be a thousand of them in one square of a city.
 */

import { hoursStatus } from '../hoursStatus.ts';
import { tileOf } from '../tiles.ts';
import type { TilePharmacy, TileRef } from '../tiles.ts';
import type { GlyphState } from '../types';

/** The four corners of a view of the map, in degrees. */
export interface Bounds {
  north: number;
  south: number;
  west: number;
  east: number;
}

/**
 * A view that touches more squares than this is too far out to load pharmacies for: at
 * that zoom they are dots on top of each other, and the requests would be many. A phone
 * reaches it at about zoom 8, a desktop window a level earlier.
 */
export const AREA_MAX_SQUARES = 12;

/**
 * The squares a view of the map touches, in the numbering of the pharmacy tiles (PLAN.md
 * 7.2), or undefined when the view is too wide. The squares follow from what the map shows,
 * never from where the user is.
 */
export function squaresIn(bounds: Bounds, max = AREA_MAX_SQUARES): TileRef[] | undefined {
  const from = tileOf({ lat: bounds.north, lon: bounds.west });
  const to = tileOf({ lat: bounds.south, lon: bounds.east });
  // A view across the date line would run the long way round: no covered country is near it.
  if (to.x < from.x || to.y < from.y) return undefined;
  if ((to.x - from.x + 1) * (to.y - from.y + 1) > max) return undefined;
  const squares: TileRef[] = [];
  for (let y = from.y; y <= to.y; y++) {
    for (let x = from.x; x <= to.x; x++) squares.push({ x, y });
  }
  return squares;
}

/** Which of the four signs a pharmacy gets at an instant: the same four as in the list. */
export function glyphAt(pharmacy: TilePharmacy, now: number): GlyphState {
  const { kind } = hoursStatus(pharmacy, now);
  if (kind === 'open' || kind === 'open24') return 'open';
  if (kind === 'soon') return 'soon';
  return kind === 'closed' ? 'closed' : 'unknown';
}

/** Where signs would lie on top of each other, the open ones are the ones that stay. */
const RANK: Record<GlyphState, number> = { open: 0, soon: 1, unknown: 2, closed: 3 };

export interface AreaFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: { id: string; glyph: GlyphState; rank: number };
}

export interface AreaData {
  type: 'FeatureCollection';
  features: AreaFeature[];
}

export const NO_AREA: AreaData = { type: 'FeatureCollection', features: [] };

export interface AreaLayer {
  /** Changes only when something the map draws has changed: the map is given new data only then. */
  key: string;
  data: AreaData;
}

export const EMPTY_AREA: AreaLayer = { key: '', data: NO_AREA };

/**
 * The layer's data at an instant: one point per pharmacy with the sign it has right now.
 * `listed` are the pharmacies the results already show with markers of their own.
 *
 * Most minutes no pharmacy opens or closes. The key then stays the same, and the map
 * keeps what it has.
 */
export function areaLayer(pharmacies: readonly TilePharmacy[], now: number, listed: ReadonlySet<string> = new Set()): AreaLayer {
  const features: AreaFeature[] = [];
  let signs = '';
  // Which pharmacies they are, as one number (FNV-1a over the ids): another set of the same size has another.
  let which = 0x811c9dc5;
  for (const pharmacy of pharmacies) {
    if (listed.has(pharmacy.id)) continue;
    const glyph = glyphAt(pharmacy, now);
    features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [pharmacy.lon, pharmacy.lat] }, properties: { id: pharmacy.id, glyph, rank: RANK[glyph] } });
    signs += glyph[0];
    for (let i = 0; i < pharmacy.id.length; i++) which = Math.imul(which ^ pharmacy.id.charCodeAt(i), 0x01000193);
    which = Math.imul(which ^ 0x2f, 0x01000193);
  }
  if (features.length === 0) return EMPTY_AREA;
  return { key: `${features.length}/${(which >>> 0).toString(36)}/${signs}`, data: { type: 'FeatureCollection', features } };
}
