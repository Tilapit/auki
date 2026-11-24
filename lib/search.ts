/**
 * The search itself (PLAN.md 7.1, steps 3 and 6): which tiles a position needs, loading
 * them, and what they say. The requests name squares of 20 to 30 km; the position stays on
 * the device. Nothing here is React: the hook calls it and the tests call it with a fake
 * loader.
 */

import { coverageAt } from './coverage';
import { squaresIn } from './map/area.ts';
import type { Bounds } from './map/area.ts';
import { NEAR, OPEN_SEARCH_RADIUS, SHOWN, WIDE, noneShownOpen, staysOpen } from './live';
import type { SearchResult } from './live';
import { INDEX_PATH, decodeTile, hasTile, searchStep, tileKey, tileOf, tilePath } from './tiles.ts';
import type { BorderGrid, Found, IndexJson, LatLon, TileJson, TilePharmacy, TileRef } from './tiles.ts';
import { byWalking } from './walking.ts';
import type { Walks } from './walking.ts';

export type Outcome =
  | { kind: 'results'; result: SearchResult }
  | { kind: 'none' }
  | { kind: 'notCovered'; country?: string }
  /** The index or a tile the answer needs didn't load. */
  | { kind: 'failed' };

/**
 * Asks for the walking times to the candidates (PLAN.md 7.1, step 4). Undefined when they
 * didn't come in time or at all: the search goes on with straight lines. The one request
 * that carries the position is made behind this, by the hook.
 */
export type AskWalks = (candidates: Found[]) => Promise<Walks | undefined>;

/** Loads a JSON file of our own origin by its path. Rejects when it can't. */
export type Load = (path: string) => Promise<unknown>;

/** The tiles loaded for one position. Kept, so that later questions cost no request. */
export class Tiles {
  index: IndexJson | undefined;
  readonly pharmacies = new Map<string, readonly TilePharmacy[]>();
  readonly borders = new Map<string, BorderGrid>();
  readonly failed = new Set<string>();
  /** Squares the map asked for that didn't load. Apart from `failed`: the search's answer never depended on them. */
  readonly unreachable = new Set<string>();
  private readonly asking = new Set<string>();
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
  async loadTiles(tiles: TileRef[], failed: Set<string> = this.failed): Promise<void> {
    await Promise.all(
      tiles.map(async (tile) => {
        const key = tileKey(tile);
        try {
          const decoded = decodeTile((await this.load(tilePath(tile.x, tile.y))) as TileJson);
          this.pharmacies.set(key, decoded.pharmacies);
          if (decoded.border) this.borders.set(key, decoded.border);
        } catch {
          failed.add(key);
        }
      }),
    );
  }

  /** Every pharmacy on the tiles loaded so far, for the map (lib/map/area.ts). */
  all(): TilePharmacy[] {
    return [...this.pharmacies.values()].flat();
  }

  count(): number {
    let count = 0;
    for (const pharmacies of this.pharmacies.values()) count += pharmacies.length;
    return count;
  }

  /**
   * Loads the squares a view of the map touches, where the index says there is a tile and
   * it isn't here yet. Answers whether anything new arrived. The requests name squares of
   * the map, as the search's do; a view too wide to be worth it asks for nothing.
   */
  async loadArea(bounds: Bounds): Promise<boolean> {
    const grid = this.index?.grid;
    const squares = squaresIn(bounds);
    if (!grid || !squares) return false;
    const need = squares.filter((tile) => {
      const key = tileKey(tile);
      return hasTile(grid, tile) && !this.pharmacies.has(key) && !this.failed.has(key) && !this.unreachable.has(key) && !this.asking.has(key);
    });
    if (need.length === 0) return false;
    for (const tile of need) this.asking.add(tileKey(tile));
    await this.loadTiles(need, this.unreachable);
    for (const tile of need) this.asking.delete(tileKey(tile));
    return need.some((tile) => this.pharmacies.has(tileKey(tile)));
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

/**
 * The nearest open pharmacy within 30 km that stays open, or none. Tiles that fail here are
 * just not looked in. `except`: the pharmacies the list already shows. One of them may be
 * open and still not worth the walk, and then the answer is the next one out.
 */
export async function findFarOpen(tiles: Tiles, position: LatLon, now: number, except?: ReadonlySet<string>): Promise<Found | undefined> {
  const [nearest] = await tiles.nearest(position, 1, OPEN_SEARCH_RADIUS, (pharmacy) => !except?.has(pharmacy.id) && staysOpen(pharmacy, now));
  return nearest;
}

/** The ids of the pharmacies a result shows in the list. */
export const shownIds = (result: SearchResult): Set<string> => new Set(result.candidates.slice(0, SHOWN).map((found) => found.pharmacy.id));

export async function findPharmacies(tiles: Tiles, position: LatLon, now: number, askWalks?: AskWalks): Promise<Outcome> {
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

  // Walking times for all twenty, then the order they give: the list shows the first ten of it,
  // once, and is never reordered afterwards (PLAN.md 7.1, step 5).
  const walks = askWalks ? await askWalks(candidates).catch(() => undefined) : undefined;
  const result: SearchResult = { candidates: byWalking(candidates, walks), missing: coverage.missing, ...(walks ? { walks } : {}) };
  // How well the country's hours are covered: the results say it where most hours are missing.
  const country = candidates[0].pharmacy.country;
  const stats = index.countries[country];
  if (stats && stats.pharmacies > 0) result.hoursListed = { country, share: stats.shareWithHours };
  if (noneShownOpen(result, now)) {
    // Only one that isn't in the list already: a candidate beyond the ten shown still counts.
    const farOpen = await findFarOpen(tiles, position, now, shownIds(result));
    if (farOpen) result.farOpen = farOpen;
  }
  return { kind: 'results', result };
}
