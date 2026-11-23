/**
 * The search itself (PLAN.md 7.1, steps 3 and 6): which tiles a position needs, loading
 * them, and what they say. The requests name squares of 20 to 30 km; the position stays on
 * the device. Nothing here is React: the hook calls it and the tests call it with a fake
 * loader.
 */

import { coverageAt } from './coverage';
import { NEAR, OPEN_SEARCH_RADIUS, SHOWN, WIDE, noneShownOpen, staysOpen } from './live';
import type { SearchResult } from './live';
import { INDEX_PATH, decodeTile, searchStep, tileKey, tileOf, tilePath } from './tiles.ts';
import type { BorderGrid, Found, IndexJson, LatLon, TileJson, TilePharmacy, TileRef } from './tiles.ts';

export type Outcome =
  | { kind: 'results'; result: SearchResult }
  | { kind: 'none' }
  | { kind: 'notCovered'; country?: string }
  /** The index or a tile the answer needs didn't load. */
  | { kind: 'failed' };

/** Loads a JSON file of our own origin by its path. Rejects when it can't. */
export type Load = (path: string) => Promise<unknown>;

/** The tiles loaded for one position. Kept, so that later questions cost no request. */
export class Tiles {
  index: IndexJson | undefined;
  readonly pharmacies = new Map<string, readonly TilePharmacy[]>();
  readonly borders = new Map<string, BorderGrid>();
  readonly failed = new Set<string>();
  private readonly load: Load;

  constructor(load: Load) {
    this.load = load;
  }

  async loadIndex(): Promise<IndexJson> {
    this.index ??= (await this.load(INDEX_PATH)) as IndexJson;
    if (!this.index?.grid || !this.index.countries) throw new Error('not an index');
    return this.index;
  }

  /** Loads tiles side by side. One that fails is remembered and not asked for again. */
  async loadTiles(tiles: TileRef[]): Promise<void> {
    await Promise.all(
      tiles.map(async (tile) => {
        const key = tileKey(tile);
        try {
          const decoded = decodeTile((await this.load(tilePath(tile.x, tile.y))) as TileJson);
          this.pharmacies.set(key, decoded.pharmacies);
          if (decoded.border) this.borders.set(key, decoded.border);
        } catch {
          this.failed.add(key);
        }
      }),
    );
  }

  /** The nearest matches, loading tiles until no unloaded tile could hold a nearer one. */
  async nearest(position: LatLon, count: number, radius: number, accept?: (pharmacy: TilePharmacy) => boolean): Promise<Found[]> {
    const { grid } = await this.loadIndex();
    for (;;) {
      const step = searchStep({ position, count, radius, grid, loaded: this.pharmacies, failed: this.failed, accept });
      if (step.done) return step.nearest;
      await this.loadTiles(step.need);
    }
  }
}

/** The nearest open pharmacy within 30 km that stays open, or none. Tiles that fail here are just not looked in. */
export async function findFarOpen(tiles: Tiles, position: LatLon, now: number): Promise<Found | undefined> {
  const [nearest] = await tiles.nearest(position, 1, OPEN_SEARCH_RADIUS, (pharmacy) => staysOpen(pharmacy, now));
  return nearest;
}

export async function findPharmacies(tiles: Tiles, position: LatLon, now: number): Promise<Outcome> {
  let index: IndexJson;
  try {
    index = await tiles.loadIndex();
  } catch {
    return { kind: 'failed' };
  }

  const covered = new Set(Object.keys(index.countries));
  // A square outside the coverage has no tile and no neighbours worth asking for.
  if (coverageAt(index.grid, position, undefined, covered).kind === 'outside') return { kind: 'notCovered' };

  let candidates = await tiles.nearest(position, NEAR.count, NEAR.radius);
  if (candidates.length === 0) candidates = await tiles.nearest(position, WIDE.count, WIDE.radius);
  // A tile that didn't load may hold the nearest pharmacy: no answer is better than a wrong one.
  if (tiles.failed.size > 0) return { kind: 'failed' };

  const coverage = coverageAt(index.grid, position, tiles.borders.get(tileKey(tileOf(position))), covered);
  if (coverage.kind === 'outside') return { kind: 'notCovered', country: coverage.country };
  if (candidates.length === 0) return { kind: 'none' };

  const result: SearchResult = { candidates, missing: coverage.missing };
  // How well the country's hours are covered: the results say it where most hours are missing.
  const country = candidates[0].pharmacy.country;
  const stats = index.countries[country];
  if (stats && stats.pharmacies > 0) result.hoursListed = { country, share: stats.shareWithHours };
  if (noneShownOpen(result, now)) {
    const farOpen = await findFarOpen(tiles, position, now);
    // Only one that isn't in the list already: a candidate beyond the ten shown still counts.
    if (farOpen && !candidates.slice(0, SHOWN).some((found) => found.pharmacy.id === farOpen.pharmacy.id)) result.farOpen = farOpen;
  }
  return { kind: 'results', result };
}
