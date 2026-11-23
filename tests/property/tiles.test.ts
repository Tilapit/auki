import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { distanceMeters } from '@/lib/geo';
import { TILE_ZOOM, borderCell, borderCellCenter, decodeTile, distanceToTile, encodeTile, searchStep, tileBounds, tileKey, tileOf, tilesWithin } from '@/lib/tiles';
import type { GridJson, Hours, Interval, LatLon, TileJson, TilePharmacy, TileRef } from '@/lib/tiles';

// The covered countries lie between these: the Canaries and the North Cape, the Azores and eastern Finland.
const lat = fc.double({ min: 27.5, max: 71.5, noNaN: true });
const lon = fc.double({ min: -31.5, max: 32, noNaN: true });
const position = fc.record({ lat, lon });

/** A point close to a corner where four squares meet: where a search is most likely to go wrong. */
const nearCorner: fc.Arbitrary<LatLon> = fc
  .record({ at: position, dLat: fc.double({ min: -0.002, max: 0.002, noNaN: true }), dLon: fc.double({ min: -0.002, max: 0.002, noNaN: true }) })
  .map(({ at, dLat, dLon }) => {
    const bounds = tileBounds(tileOf(at));
    return { lat: bounds.north + dLat, lon: bounds.west + dLon };
  });

describe('tile numbers', () => {
  it('a position lies inside the square it is given', () => {
    // To within rounding: a point a hair's breadth from an edge may be counted on either side.
    const hair = 1e-9;
    fc.assert(
      fc.property(fc.oneof(position, nearCorner), (at) => {
        const bounds = tileBounds(tileOf(at));
        expect(at.lat).toBeLessThanOrEqual(bounds.north + hair);
        expect(at.lat).toBeGreaterThanOrEqual(bounds.south - hair);
        expect(at.lon).toBeGreaterThanOrEqual(bounds.west - hair);
        expect(at.lon).toBeLessThanOrEqual(bounds.east + hair);
      }),
    );
  });

  it('squares are 12 to 36 km across in the covered latitudes', () => {
    fc.assert(
      fc.property(position, (at) => {
        const bounds = tileBounds(tileOf(at));
        const width = distanceMeters({ lat: at.lat, lon: bounds.west }, { lat: at.lat, lon: bounds.east });
        expect(width).toBeGreaterThan(12_000);
        expect(width).toBeLessThan(36_000);
      }),
    );
  });

  it('no point of a square is nearer than distanceToTile says', () => {
    const offset = fc.integer({ min: -3, max: 3 });
    const share = fc.double({ min: 0, max: 1, noNaN: true });
    fc.assert(
      fc.property(fc.oneof(position, nearCorner), offset, offset, share, share, (at, dx, dy, u, v) => {
        const home = tileOf(at);
        const tile = { x: home.x + dx, y: home.y + dy };
        const bounds = tileBounds(tile);
        const inside = { lat: bounds.south + (bounds.north - bounds.south) * u, lon: bounds.west + (bounds.east - bounds.west) * v };
        expect(distanceMeters(at, inside)).toBeGreaterThanOrEqual(distanceToTile(at, tile));
      }),
      { numRuns: 2000 },
    );
  });

  it('tilesWithin lists every square that has a point within the radius, nearest first', () => {
    fc.assert(
      fc.property(fc.oneof(position, nearCorner), fc.double({ min: 100, max: 50_000, noNaN: true }), fc.double({ min: 0, max: 360, noNaN: true }), fc.double({ min: 0, max: 1, noNaN: true }), (at, radius, bearing, share) => {
        const tiles = tilesWithin(at, radius);
        // The square the position is in comes at no distance. On an edge, so do its neighbours.
        expect(tiles[0].min).toBe(0);
        expect(tiles.find((tile) => tileKey(tile) === tileKey(tileOf(at)))?.min).toBeLessThan(0.01);
        for (let i = 1; i < tiles.length; i++) expect(tiles[i].min).toBeGreaterThanOrEqual(tiles[i - 1].min);
        // Walk some way towards the edge of the circle: the square we end up in must be listed.
        const meters = radius * share * 0.99;
        const rad = (bearing * Math.PI) / 180;
        const there = { lat: at.lat + ((meters * Math.cos(rad)) / 6371008.8) * (180 / Math.PI), lon: at.lon + ((meters * Math.sin(rad)) / (6371008.8 * Math.cos((at.lat * Math.PI) / 180))) * (180 / Math.PI) };
        fc.pre(distanceMeters(at, there) <= radius);
        expect(tiles.map(tileKey)).toContain(tileKey(tileOf(there)));
      }),
      { numRuns: 1000 },
    );
  });
});

// ---------------------------------------------------------------------------

const WINDOW_FROM = 1795384800; // Monday 23 November 2026, 00:00 in Helsinki
const WINDOW_UNTIL = WINDOW_FROM + 8 * 86400;

function pharmacyAt(id: number, at: LatLon): TilePharmacy {
  return { id: `n${id}`, lat: at.lat, lon: at.lon, name: null, country: 'FI', zone: 'Europe/Helsinki', generated: WINDOW_FROM + 3600, windowFrom: WINDOW_FROM, windowUntil: WINDOW_UNTIL, hours: { kind: 'missing' } };
}

/** A grid around a square and the tiles given, with "d" where there is a tile. */
function gridOf(home: TileRef, tiles: TileRef[]): GridJson {
  const all = [home, ...tiles];
  const x0 = Math.min(...all.map((tile) => tile.x)) - 8;
  const y0 = Math.min(...all.map((tile) => tile.y)) - 8;
  const width = Math.max(...all.map((tile) => tile.x)) - x0 + 9;
  const height = Math.max(...all.map((tile) => tile.y)) - y0 + 9;
  const keys = new Set(tiles.map(tileKey));
  const rows = Array.from({ length: height }, (_, row) => Array.from({ length: width }, (_, column) => (keys.has(tileKey({ x: x0 + column, y: y0 + row })) ? 'd' : 'c')).join(''));
  return { z: TILE_ZOOM, x0, y0, width, rows };
}

/** Runs the search to its end, loading whatever each step asks for. Returns the answer and what was loaded. */
function search(at: LatLon, pharmacies: TilePharmacy[], count: number, radius: number, accept?: (pharmacy: TilePharmacy) => boolean) {
  const world = new Map<string, TilePharmacy[]>();
  for (const pharmacy of pharmacies) {
    const key = tileKey(tileOf(pharmacy));
    world.set(key, [...(world.get(key) ?? []), pharmacy]);
  }
  const grid = gridOf(tileOf(at), pharmacies.map((pharmacy) => tileOf(pharmacy)));
  const loaded = new Map<string, TilePharmacy[]>();
  for (let step = 0; step < 200; step++) {
    const result = searchStep({ position: at, count, radius, grid, loaded, accept });
    if (result.done) return { nearest: result.nearest, loaded: loaded.size, tiles: world.size };
    for (const tile of result.need) {
      expect(world.has(tileKey(tile))).toBe(true); // only tiles the index lists are asked for
      loaded.set(tileKey(tile), world.get(tileKey(tile)) ?? []);
    }
  }
  throw new Error('the search did not end');
}

function bruteForce(at: LatLon, pharmacies: TilePharmacy[], count: number, radius: number, accept?: (pharmacy: TilePharmacy) => boolean): string[] {
  return pharmacies
    .filter((pharmacy) => !accept || accept(pharmacy))
    .map((pharmacy) => ({ id: pharmacy.id, meters: distanceMeters(at, pharmacy) }))
    .filter((found) => found.meters <= radius)
    .sort((a, b) => a.meters - b.meters || (a.id < b.id ? -1 : 1))
    .slice(0, count)
    .map((found) => found.id);
}

/** Pharmacies scattered up to about 60 km around a point, some of them very near it. */
const scattered = (at: LatLon): fc.Arbitrary<TilePharmacy[]> =>
  fc
    .array(
      fc.record({
        reach: fc.oneof(fc.constant(0.01), fc.constant(0.1), fc.constant(0.55)),
        dLat: fc.double({ min: -1, max: 1, noNaN: true }),
        dLon: fc.double({ min: -1, max: 1, noNaN: true }),
      }),
      { maxLength: 60 },
    )
    .map((points) => points.map((point, index) => pharmacyAt(index, { lat: at.lat + point.dLat * point.reach, lon: at.lon + (point.dLon * point.reach) / Math.cos((at.lat * Math.PI) / 180) })));

describe('searching through tiles', () => {
  const world = fc.oneof(position, nearCorner).chain((at) => fc.record({ at: fc.constant(at), pharmacies: scattered(at) }));

  it('finds the same nearest pharmacies as a search through all of them', () => {
    fc.assert(
      fc.property(world, fc.integer({ min: 1, max: 20 }), fc.constantFrom(10_000, 30_000, 50_000), ({ at, pharmacies }, count, radius) => {
        const found = search(at, pharmacies, count, radius);
        expect(found.nearest.map((entry) => entry.pharmacy.id)).toEqual(bruteForce(at, pharmacies, count, radius));
      }),
      { numRuns: 1500 },
    );
  });

  it('finds the same with a condition on the pharmacy, as the search for an open one uses', () => {
    const everyThird = (pharmacy: TilePharmacy) => Number(pharmacy.id.slice(1)) % 3 === 0;
    fc.assert(
      fc.property(world, ({ at, pharmacies }) => {
        const found = search(at, pharmacies, 1, 30_000, everyThird);
        expect(found.nearest.map((entry) => entry.pharmacy.id)).toEqual(bruteForce(at, pharmacies, 1, 30_000, everyThird));
      }),
      { numRuns: 500 },
    );
  });

  it('stops loading once nothing unloaded could be nearer', () => {
    // Twenty pharmacies within a few hundred metres, and one tile full of others 40 km away.
    const at = { lat: 60.1699, lon: 24.9384 };
    const near = Array.from({ length: 20 }, (_, index) => pharmacyAt(index, { lat: at.lat + index * 0.0002, lon: at.lon }));
    const far = Array.from({ length: 5 }, (_, index) => pharmacyAt(100 + index, { lat: at.lat + 0.36, lon: at.lon }));
    const found = search(at, [...near, ...far], 20, 10_000);
    expect(found.nearest).toHaveLength(20);
    expect(found.loaded).toBe(1);
    expect(found.tiles).toBe(2);
  });

  it('does not ask again for a tile that failed', () => {
    const at = { lat: 60.1699, lon: 24.9384 };
    const pharmacies = [pharmacyAt(1, at)];
    const grid = gridOf(tileOf(at), [tileOf(at)]);
    const first = searchStep({ position: at, count: 20, radius: 10_000, grid, loaded: new Map() });
    expect(first.need).toEqual([tileOf(at)]);
    const second = searchStep({ position: at, count: 20, radius: 10_000, grid, loaded: new Map(), failed: new Set([tileKey(tileOf(at))]) });
    expect(second).toEqual({ nearest: [], need: [], done: true });
    expect(pharmacies).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------

/** Sorted intervals on whole minutes inside the window, with a gap between each two. */
const intervals: fc.Arbitrary<Interval[]> = fc.array(fc.integer({ min: 1, max: 600 }), { maxLength: 16 }).map((steps) => {
  const result: Interval[] = [];
  let minute = 0;
  for (let i = 0; i + 1 < steps.length; i += 2) {
    const from = minute + steps[i];
    const to = from + steps[i + 1];
    if (to > 8 * 1440) break;
    result.push({ from: WINDOW_FROM + from * 60, to: WINDOW_FROM + to * 60 });
    minute = to;
  }
  return result;
});

const words = fc.string({ minLength: 1, maxLength: 30 }).filter((value) => value.trim() !== '');

const hours: fc.Arbitrary<Hours> = fc.oneof(
  fc.constant<Hours>({ kind: 'missing' }),
  words.map((raw): Hours => ({ kind: 'unparseable', raw })),
  words.map((raw): Hours => ({ kind: 'uncertain', raw })),
  intervals.map((open): Hours => ({ kind: 'parsed', open, unknown: [] })),
  fc.record({ open: intervals, unknown: intervals.filter((list) => list.length > 0), raw: words }).map(({ open, unknown, raw }): Hours => ({ kind: 'parsed', open, unknown, raw })),
);

// JSON has no negative zero, so neither do the coordinates here.
const rounded = (value: number): number => Math.round(value * 1e5) / 1e5 + 0;

const tilePharmacy: fc.Arbitrary<TilePharmacy> = fc
  .record({
    id: fc.integer({ min: 1, max: 1e10 }).map((id) => `n${id}`),
    lat: lat.map(rounded),
    lon: lon.map(rounded),
    name: fc.option(words, { nil: null }),
    source: fc.constantFrom(
      { country: 'FI', zone: 'Europe/Helsinki', generated: WINDOW_FROM + 5400 },
      { country: 'SE', zone: 'Europe/Stockholm', generated: WINDOW_FROM - 86400 },
      { country: 'ES', zone: 'Atlantic/Canary', generated: WINDOW_FROM + 5400 },
    ),
    hours,
    optional: fc.record(
      {
        street: words,
        city: fc.constantFrom('Helsinki', 'Rīga', 'Αθήνα'),
        phone: fc.constant('+358 9 1234567'),
        email: fc.constant('apteekki@example.org'),
        website: fc.constant('https://example.org/'),
        wheelchair: fc.constantFrom('yes' as const, 'limited' as const, 'no' as const),
        wheelchairNote: words,
        dispensing: fc.constant(false as const),
        checkDate: fc.constant('2026-10-01'),
      },
      { requiredKeys: [] },
    ),
  })
  .map(({ id, lat, lon, name, source, hours, optional }) => ({ id, lat, lon, name, ...source, windowFrom: WINDOW_FROM, windowUntil: WINDOW_UNTIL, hours, ...optional }));

describe('writing and reading a tile', () => {
  it('reads back exactly what was written', () => {
    fc.assert(
      fc.property(fc.array(tilePharmacy, { maxLength: 30 }), (pharmacies) => {
        const tile = { x: 582, y: 296, pharmacies };
        const file = JSON.parse(JSON.stringify(encodeTile(tile))) as TileJson;
        expect(decodeTile(file)).toEqual(tile);
      }),
      { numRuns: 500 },
    );
  });

  it('stores an identical schedule once', () => {
    const open = [{ from: WINDOW_FROM + 8 * 3600, to: WINDOW_FROM + 21 * 3600 }];
    const one = pharmacyAt(1, { lat: 60.17, lon: 24.94 });
    const file = encodeTile({ x: 582, y: 296, pharmacies: [1, 2, 3].map((id) => ({ ...one, id: `n${id}`, hours: { kind: 'parsed', open, unknown: [] } })) });
    expect(file.hours).toEqual([[[480, 1260]]]);
    expect(file.sources).toHaveLength(1);
    expect(file.rows.map((row) => row[7])).toEqual([0, 0, 0]);
  });

  it('refuses a file of another version', () => {
    expect(() => decodeTile({ v: 2 } as unknown as TileJson)).toThrow();
  });
});

describe('the border grid', () => {
  it('a cell centre falls in its own cell', () => {
    fc.assert(
      fc.property(position, fc.integer({ min: 0, max: 15 }), fc.integer({ min: 0, max: 15 }), (at, column, row) => {
        const tile = tileOf(at);
        expect(borderCell(tile, 16, borderCellCenter(tile, 16, column, row))).toEqual({ column, row });
      }),
    );
  });
});
