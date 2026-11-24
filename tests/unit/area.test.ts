import { describe, expect, it } from 'vitest';
import { KAMPPI, MONDAY_EVENING, NINE_DAYS_LATER, farOpen, indexOf, kamppi } from '@/lib/fixtures/tiles';
import { AREA_MAX_SQUARES, EMPTY_AREA, areaLayer, glyphAt, squaresIn } from '@/lib/map/area';
import { Tiles } from '@/lib/search';
import { encodeTile, tileBounds, tileOf, tilePath } from '@/lib/tiles';
import type { TilePharmacy } from '@/lib/tiles';

const home = tileOf(KAMPPI);
const box = tileBounds(home);
/** A view of the map around a point, so many degrees across. */
const view = (lat: number, lon: number, across: number) => ({ north: lat + across / 2, south: lat - across / 2, west: lon - across, east: lon + across });

describe('squaresIn: which pharmacy tiles a view of the map touches', () => {
  it('is the one square the view lies in', () => {
    expect(squaresIn(view(KAMPPI.lat, KAMPPI.lon, 0.01))).toEqual([home]);
  });

  it('is four squares where the view lies on a corner', () => {
    const squares = squaresIn(view(box.north, box.east, 0.01));
    expect(squares).toEqual([
      { x: home.x, y: home.y - 1 },
      { x: home.x + 1, y: home.y - 1 },
      { x: home.x, y: home.y },
      { x: home.x + 1, y: home.y },
    ]);
  });

  it('asks for nothing when the view is too wide to be worth it', () => {
    // Southern Finland from the Baltic to Lake Ladoga: dozens of squares.
    expect(squaresIn({ north: 62, south: 59.5, west: 21, east: 31 })).toBeUndefined();
    const wide = squaresIn({ north: box.north, south: box.south + 0.001, west: box.west, east: box.west + (box.east - box.west) * (AREA_MAX_SQUARES - 0.5) });
    expect(wide).toHaveLength(AREA_MAX_SQUARES);
  });

  it('names squares, never a position: whole tile numbers and nothing else', () => {
    for (const square of squaresIn(view(KAMPPI.lat, KAMPPI.lon, 0.3)) ?? []) {
      expect(Object.keys(square)).toEqual(['x', 'y']);
      expect(Number.isInteger(square.x) && Number.isInteger(square.y)).toBe(true);
    }
  });
});

describe('glyphAt: the sign a pharmacy has on the map', () => {
  const byId = (id: string) => kamppi.find((pharmacy) => pharmacy.id === id)!;

  it('is the list’s own four: open, closing soon, closed, not known', () => {
    expect(glyphAt(byId('n102'), MONDAY_EVENING)).toBe('open');
    expect(glyphAt(byId('n101'), MONDAY_EVENING)).toBe('soon');
    expect(glyphAt(byId('n103'), MONDAY_EVENING)).toBe('closed');
    expect(glyphAt(byId('n104'), MONDAY_EVENING)).toBe('unknown');
    expect(glyphAt(byId('n105'), MONDAY_EVENING)).toBe('unknown');
    expect(glyphAt(farOpen, MONDAY_EVENING)).toBe('open');
  });

  it('never reads open from data that is out of date', () => {
    for (const pharmacy of [...kamppi, farOpen]) expect(glyphAt(pharmacy, NINE_DAYS_LATER)).toBe('unknown');
  });
});

describe('areaLayer: every pharmacy the results do not already mark', () => {
  const everything = [...kamppi, farOpen];

  it('leaves out the listed ones, and gives the rest the sign they have now', () => {
    const { data } = areaLayer(everything, MONDAY_EVENING, new Set(['n101', 'n102']));
    expect(data.features.map((feature) => [feature.properties.id, feature.properties.glyph])).toEqual([
      ['n103', 'closed'],
      ['n104', 'unknown'],
      ['n105', 'unknown'],
      ['n106', 'closed'],
      ['n201', 'open'],
    ]);
    // Longitude first, as GeoJSON has it.
    expect(data.features[0].geometry.coordinates).toEqual([kamppi[2].lon, kamppi[2].lat]);
  });

  it('where signs would overlap, the open ones are kept: they rank first', () => {
    const rank = (glyph: string) => areaLayer(everything, MONDAY_EVENING).data.features.find((feature) => feature.properties.glyph === glyph)!.properties.rank;
    expect(rank('open')).toBeLessThan(rank('soon'));
    expect(rank('soon')).toBeLessThan(rank('unknown'));
    expect(rank('unknown')).toBeLessThan(rank('closed'));
  });

  it('keeps its key from one minute to the next while nothing opens or closes', () => {
    expect(areaLayer(everything, MONDAY_EVENING).key).toBe(areaLayer(everything, MONDAY_EVENING + 60).key);
    // At 21.00 the one on Urho Kekkosen katu closes.
    expect(areaLayer(everything, MONDAY_EVENING).key).not.toBe(areaLayer(everything, MONDAY_EVENING + 20 * 60).key);
  });

  it('gets a new key when a tile arrives, and when the list marks other pharmacies', () => {
    expect(areaLayer(kamppi, MONDAY_EVENING).key).not.toBe(areaLayer(everything, MONDAY_EVENING).key);
    // n103 and n106 are both closed: the same number of signs of the same kinds, and still another layer.
    expect(areaLayer(everything, MONDAY_EVENING, new Set(['n103'])).key).not.toBe(areaLayer(everything, MONDAY_EVENING, new Set(['n106'])).key);
  });

  it('is the one empty layer when there is nothing to draw', () => {
    expect(areaLayer([], MONDAY_EVENING)).toBe(EMPTY_AREA);
    expect(areaLayer(kamppi, MONDAY_EVENING, new Set(kamppi.map((pharmacy) => pharmacy.id)))).toBe(EMPTY_AREA);
  });
});

describe('Tiles.loadArea: the squares of a view of the map', () => {
  const east = { x: home.x + 1, y: home.y };
  const north = { x: home.x, y: home.y - 1 };
  const inEast: TilePharmacy = { ...farOpen, id: 'n301', lat: KAMPPI.lat, lon: tileBounds(east).west + 0.05 };
  const files: Record<string, unknown> = {
    [tilePath(home.x, home.y)]: encodeTile({ ...home, pharmacies: kamppi }),
    [tilePath(east.x, east.y)]: encodeTile({ ...east, pharmacies: [inEast] }),
  };
  /** The index says there are tiles at home, to the east and to the north; the northern one won't load. */
  const store = () => {
    const asked: string[] = [];
    const tiles = new Tiles(async (path) => {
      asked.push(path);
      if (path in files) return files[path];
      throw new Error('404');
    });
    tiles.index = indexOf([home, east, north]);
    return { tiles, asked };
  };
  const around = (square: { x: number; y: number }) => {
    const bounds = tileBounds(square);
    const lat = (bounds.north + bounds.south) / 2;
    const lon = (bounds.west + bounds.east) / 2;
    return { north: lat + 0.01, south: lat - 0.01, west: lon - 0.02, east: lon + 0.02 };
  };

  it('loads a square the map has come to, once, and says that something arrived', async () => {
    const { tiles, asked } = store();
    expect(await tiles.loadArea(around(east))).toBe(true);
    expect(asked).toEqual([tilePath(east.x, east.y)]);
    expect(tiles.all().map((pharmacy) => pharmacy.id)).toEqual(['n301']);
    expect(tiles.count()).toBe(1);
    // The same view again: it is on the device already.
    expect(await tiles.loadArea(around(east))).toBe(false);
    expect(asked).toHaveLength(1);
  });

  it('asks for no square the index has no tile for', async () => {
    const { tiles, asked } = store();
    expect(await tiles.loadArea(around({ x: home.x - 2, y: home.y + 2 }))).toBe(false);
    expect(asked).toEqual([]);
  });

  it('remembers a square that did not load, apart from the tiles the search depends on', async () => {
    const { tiles, asked } = store();
    expect(await tiles.loadArea(around(north))).toBe(false);
    expect(await tiles.loadArea(around(north))).toBe(false);
    expect(asked).toEqual([tilePath(north.x, north.y)]);
    // The search calls its answer failed when one of its own tiles is missing. A square of the map is not one of them.
    expect(tiles.failed.size).toBe(0);
    expect(tiles.unreachable.size).toBe(1);
  });

  it('asks for nothing when the view is too wide, or before the index is there', async () => {
    const { tiles, asked } = store();
    expect(await tiles.loadArea({ north: 62, south: 59.5, west: 21, east: 31 })).toBe(false);
    tiles.index = undefined;
    expect(await tiles.loadArea(around(east))).toBe(false);
    expect(asked).toEqual([]);
  });

  it('requests name a square and carry nothing of the view that asked', async () => {
    const { tiles, asked } = store();
    await tiles.loadArea(around(east));
    expect(asked[0]).toMatch(/^\/tiles\/v1\/10\/\d+\/\d+\.json$/);
  });
});
