/**
 * Where the coverage ends (PLAN.md 7.7). For every square of the tile grid: is any of it in
 * a covered country, and does it also touch a country outside the coverage? The second kind
 * carries a coarse grid of country codes, so the app can tell on the device which side of
 * the border a position is on.
 */

import { feature, iso1A2Code } from '@rapideditor/country-coder';
import { borderCellCenter, tileOf } from '../lib/tiles.ts';
import type { BorderGrid, TileRef } from '../lib/tiles.ts';

/** Cells per side of a square: about 1.5 km each. */
export const BORDER_CELLS = 16;

/** Territories with a code of their own whose pharmacies come with a covered country's query. */
const PART_OF: Record<string, string> = { AX: 'FI', EA: 'ES', SJ: 'NO' };

/**
 * The squares looked at: from the Azores to the eastern tip of Cyprus (34.6° east), and from
 * the Canaries to Svalbard, whose one pharmacy comes with Norway's. This is what "Europe"
 * means to the pipeline: a pharmacy that comes with a country's area and lies outside it
 * (France's overseas departments, the Caribbean parts of the Netherlands) is left out and
 * counted by normalize.ts.
 */
export const EXTENT = { north: 81, south: 27, west: -32, east: 34.7 };

/**
 * The same for a place country-coder knows without a code, by its Wikidata id: the north of
 * Cyprus. Its pharmacies come with Cyprus's area and the island keeps one clock, so a position
 * there is in the coverage like the rest of the island. Without this line the north's own
 * squares gave results, and the squares it shares with the British base areas said "not
 * covered" in Famagusta, over pharmacies that are in the tile.
 */
const PART_OF_BY_ID: Record<string, string> = { Q23681: 'CY' };

export function countryAt(lat: number, lon: number): string | null {
  const code = iso1A2Code([lon, lat], { level: 'territory' });
  if (code) return PART_OF[code] ?? code;
  // No code: the sea, or one of the few places without one.
  const id = feature([lon, lat])?.properties.wikidata;
  return (id ? PART_OF_BY_ID[id] : undefined) ?? null;
}

export interface SquareCoverage {
  /** Some of the square is in a covered country. */
  covered: boolean;
  /** Present when the square also touches a country outside the coverage. */
  border?: BorderGrid;
}

export function coverageOf(tile: TileRef, covered: ReadonlySet<string>, at: (lat: number, lon: number) => string | null = countryAt): SquareCoverage {
  const n = BORDER_CELLS;
  const codes: string[] = [];
  let cells = '';
  let anyCovered = false;
  let anyForeign = false;
  for (let row = 0; row < n; row++) {
    for (let column = 0; column < n; column++) {
      const center = borderCellCenter(tile, n, column, row);
      const code = at(center.lat, center.lon);
      if (code === null) {
        cells += '.';
        continue;
      }
      if (covered.has(code)) anyCovered = true;
      else anyForeign = true;
      let index = codes.indexOf(code);
      if (index < 0) index = codes.push(code) - 1;
      cells += index.toString(36);
    }
  }
  return { covered: anyCovered, ...(anyCovered && anyForeign ? { border: { n, codes, cells } } : {}) };
}

export interface GridExtent {
  x0: number;
  y0: number;
  width: number;
  height: number;
}

export function gridExtent(): GridExtent {
  const northWest = tileOf({ lat: EXTENT.north, lon: EXTENT.west });
  const southEast = tileOf({ lat: EXTENT.south, lon: EXTENT.east });
  return { x0: northWest.x, y0: northWest.y, width: southEast.x - northWest.x + 1, height: southEast.y - northWest.y + 1 };
}
