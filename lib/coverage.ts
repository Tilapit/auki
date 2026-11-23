/**
 * Where the coverage ends, worked out on the device (PLAN.md 7.7). The index says which
 * squares hold a covered country; a square that also touches another country carries a
 * coarse grid of country codes. No lookup, and the position goes nowhere.
 */

import { borderCell, countryInCell, squareAt, tileOf } from './tiles.ts';
import type { BorderGrid, GridJson, LatLon } from './tiles.ts';

export type Coverage =
  /** Results as usual. `missing` names countries outside the coverage that are right next to the position. */
  | { kind: 'covered'; missing: string[] }
  /** Not covered. The country is known only where a border grid says it. */
  | { kind: 'outside'; country?: string };

/**
 * @param border The border grid of the position's own square, when it has one and it loaded.
 * @param covered The ISO codes of the countries the tiles cover.
 */
export function coverageAt(grid: GridJson, position: LatLon, border: BorderGrid | undefined, covered: ReadonlySet<string>): Coverage {
  const tile = tileOf(position);
  const square = squareAt(grid, tile);
  if (square === '.') return { kind: 'outside' };
  if (square !== 'b' || !border) return { kind: 'covered', missing: [] };

  const { column, row } = borderCell(tile, border.n, position);
  const own = countryInCell(border, column, row);
  const around = new Set<string>();
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const code = countryInCell(border, column + dx, row + dy);
      if (code) around.add(code);
    }
  }

  const here = [...(own ? [own] : []), ...around];
  const missing = [...new Set(here.filter((code) => !covered.has(code)))];
  // The grid is coarse on purpose. A covered cell here or next door means results as usual:
  // the border can cost a note too many, and it cannot hide a result.
  if (here.some((code) => covered.has(code))) return { kind: 'covered', missing };
  return { kind: 'outside', country: own ?? missing[0] };
}
