/**
 * The tile contract (PLAN.md 7.2): the format of the pharmacy tiles and their index, which
 * tiles a position needs, and how to read them. Pure, and shared by the pipeline that
 * writes the tiles and the browser that reads them. docs/tiles.md describes the same format
 * for the iOS app; tests/vectors/ holds cases both implementations must agree on.
 *
 * Instants are epoch seconds. Distances are metres.
 */

import { distanceMeters, project } from './geo.ts';

export const TILE_VERSION = 1;
/** Standard web-map tile numbering at this zoom: squares of 20 to 30 km in the covered countries. */
export const TILE_ZOOM = 10;
export const INDEX_PATH = `/tiles/v${TILE_VERSION}/index.json`;
export const tilePath = (x: number, y: number): string => `/tiles/v${TILE_VERSION}/${TILE_ZOOM}/${x}/${y}.json`;

export interface LatLon {
  lat: number;
  lon: number;
}

export interface TileRef {
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// What a tile holds, once read
// ---------------------------------------------------------------------------

export interface Interval {
  from: number;
  to: number;
}

export type Hours =
  /** OpenStreetMap has no opening hours for it. */
  | { kind: 'missing' }
  /** The value could not be read: free text like "call for hours". */
  | { kind: 'unparseable'; raw: string }
  /** The value was read but can't be trusted: an evaluation error, or holidays we can't place. */
  | { kind: 'uncertain'; raw: string }
  /**
   * Open intervals inside the window, sorted, not touching each other. `unknown` are stretches
   * where the data itself says the state is unknown; `raw` is kept when there are any.
   */
  | { kind: 'parsed'; open: Interval[]; unknown: Interval[]; raw?: string };

export type Wheelchair = 'yes' | 'limited' | 'no';

export interface TilePharmacy {
  /** OpenStreetMap type and id: "n123", "w456", "r789". */
  id: string;
  lat: number;
  lon: number;
  /** null when OpenStreetMap has no name, brand or operator. */
  name: string | null;
  street?: string;
  /** addr:city as OpenStreetMap writes it. */
  city?: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
  /** IANA time zone the pharmacy keeps. */
  zone: string;
  /** When its country's data was fetched from OpenStreetMap. */
  generated: number;
  /** The hours window: from the start of the local day of the fetch, eight local days on. */
  windowFrom: number;
  windowUntil: number;
  hours: Hours;
  phone?: string;
  email?: string;
  website?: string;
  wheelchair?: Wheelchair;
  wheelchairNote?: string;
  /** false when OpenStreetMap says dispensing=no. */
  dispensing?: false;
  /** check_date of the opening hours, "YYYY-MM-DD". */
  checkDate?: string;
}

/** For a square that touches a country outside the coverage: which country each cell is in. */
export interface BorderGrid {
  /** Cells per side. */
  n: number;
  /** ISO codes, covered or not. */
  codes: string[];
  /** n × n characters, north to south and west to east: "." for no country, else a base-36 index into codes. */
  cells: string;
}

export interface Tile {
  x: number;
  y: number;
  pharmacies: TilePharmacy[];
  border?: BorderGrid;
}

// ---------------------------------------------------------------------------
// The file format
// ---------------------------------------------------------------------------

export interface SourceJson {
  country: string;
  zone: string;
  generated: number;
  from: number;
  until: number;
}

/**
 * One interval set: [open] or [open, unknown]. Each is a flat list of start and end pairs,
 * in minutes from the start of the source's window.
 */
export type HoursSetJson = [number[]] | [number[], number[]];

/** Columns of a pharmacy row, in order. Trailing nulls are left off. */
export const ROW_COLUMNS = [
  'id',
  'lat',
  'lon',
  'name',
  'street',
  'city', // index into cities
  'source', // index into sources
  'hours', // null: missing; a number: index into hours; "x": unparseable; "u": uncertain
  'raw', // the opening_hours value, kept when hours is "x" or "u", or the set has unknown stretches
  'phone',
  'email',
  'website',
  'wheelchair', // "yes", "limited", "no"
  'wheelchairNote',
  'dispensing', // false when dispensing=no
  'checkDate',
] as const;

export type RowJson = (string | number | boolean | null)[];

export interface TileJson {
  v: typeof TILE_VERSION;
  z: typeof TILE_ZOOM;
  x: number;
  y: number;
  sources: SourceJson[];
  cities: string[];
  hours: HoursSetJson[];
  rows: RowJson[];
  border?: BorderGrid;
}

export interface CountryStats {
  /** When this country's data was fetched from OpenStreetMap. */
  generated: number;
  pharmacies: number;
  /** How many have an opening_hours value. */
  withHours: number;
  parsed: number;
  unparseable: number;
  uncertain: number;
  /** Parsed only after the library corrected the value ("Mo-Fr 9-17", "Ma-Pe"). */
  corrected: number;
  /** withHours / pharmacies. */
  shareWithHours: number;
  /** parsed / withHours: of the values that exist, how many give intervals. */
  parseRate: number;
  /** Set when this run could not refresh the country and the data of an earlier run was kept. */
  kept?: 'fetch' | 'check';
}

/**
 * Which squares exist. One string per row of squares, north to south; one character per
 * square, west to east:
 * "." outside the coverage, "c" covered but without a pharmacy (no file),
 * "d" a tile file exists, "b" a tile file exists and carries a border grid.
 */
export interface GridJson {
  z: typeof TILE_ZOOM;
  x0: number;
  y0: number;
  width: number;
  rows: string[];
}

export interface IndexJson {
  v: typeof TILE_VERSION;
  /** When this index was written. */
  generated: number;
  attribution: string;
  countries: Record<string, CountryStats>;
  grid: GridJson;
}

export type Square = '.' | 'c' | 'd' | 'b';

export const ATTRIBUTION = '© OpenStreetMap contributors, ODbL 1.0, https://www.openstreetmap.org/copyright';

// ---------------------------------------------------------------------------
// Tile numbers
// ---------------------------------------------------------------------------

const SQUARES = 2 ** TILE_ZOOM;

/** The square a position is in. */
export function tileOf(position: LatLon): TileRef {
  const [px, py] = project(position.lat, position.lon, TILE_ZOOM);
  const clamp = (value: number) => Math.min(SQUARES - 1, Math.max(0, Math.floor(value / 256)));
  return { x: clamp(px), y: clamp(py) };
}

export interface Bounds {
  north: number;
  south: number;
  west: number;
  east: number;
}

const latOfRow = (y: number): number => (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / SQUARES))) * 180) / Math.PI;
const lonOfColumn = (x: number): number => (x / SQUARES) * 360 - 180;

export function tileBounds(tile: TileRef): Bounds {
  return { north: latOfRow(tile.y), south: latOfRow(tile.y + 1), west: lonOfColumn(tile.x), east: lonOfColumn(tile.x + 1) };
}

/**
 * A distance that no point of the square is nearer than: zero inside it, otherwise the
 * distance to the nearest point of its outline, less a thousandth. The margin covers the
 * small error of measuring to a point on the same latitude instead of along the meridian.
 */
export function distanceToTile(position: LatLon, tile: TileRef): number {
  const bounds = tileBounds(tile);
  const lat = Math.min(bounds.north, Math.max(bounds.south, position.lat));
  const lon = Math.min(bounds.east, Math.max(bounds.west, position.lon));
  if (lat === position.lat && lon === position.lon) return 0;
  return distanceMeters(position, { lat, lon }) * 0.999;
}

export interface TileDistance extends TileRef {
  /** No pharmacy in the square is nearer than this. */
  min: number;
}

/** The squares that can hold something within a radius, nearest first. */
export function tilesWithin(position: LatLon, radius: number): TileDistance[] {
  const home = tileOf(position);
  const found: TileDistance[] = [];
  // Walk outwards ring by ring until a whole ring is out of reach.
  for (let ring = 0; ring < SQUARES; ring++) {
    let any = false;
    for (let dy = -ring; dy <= ring; dy++) {
      for (let dx = -ring; dx <= ring; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
        const y = home.y + dy;
        if (y < 0 || y >= SQUARES) continue;
        const x = (((home.x + dx) % SQUARES) + SQUARES) % SQUARES;
        const min = distanceToTile(position, { x, y });
        if (min <= radius) {
          found.push({ x, y, min });
          any = true;
        }
      }
    }
    if (!any) break;
  }
  return found.sort((a, b) => a.min - b.min || a.y - b.y || a.x - b.x);
}

export const tileKey = (tile: TileRef): string => `${tile.x}/${tile.y}`;

// ---------------------------------------------------------------------------
// The index
// ---------------------------------------------------------------------------

/** What the index says about a square. */
export function squareAt(grid: GridJson, tile: TileRef): Square {
  const row = grid.rows[tile.y - grid.y0];
  const cell = row?.[tile.x - grid.x0];
  return cell === 'c' || cell === 'd' || cell === 'b' ? cell : '.';
}

export const hasTile = (grid: GridJson, tile: TileRef): boolean => {
  const square = squareAt(grid, tile);
  return square === 'd' || square === 'b';
};

// ---------------------------------------------------------------------------
// Finding the nearest
// ---------------------------------------------------------------------------

export interface Found {
  pharmacy: TilePharmacy;
  /** Straight-line distance from the position. */
  meters: number;
}

export interface SearchStep {
  /** The nearest matches among the tiles loaded so far, nearest first. */
  nearest: Found[];
  /** Tiles to load before asking again. Empty when the answer is final. */
  need: TileRef[];
  done: boolean;
}

export interface SearchOptions {
  position: LatLon;
  /** How many to find. */
  count: number;
  /** How far to look. */
  radius: number;
  grid: GridJson;
  /** The tiles loaded so far, by tileKey. A tile that failed to load is absent. */
  loaded: ReadonlyMap<string, readonly TilePharmacy[]>;
  /** Tiles that were asked for and can't be had: they are not asked for again. */
  failed?: ReadonlySet<string>;
  /** Only pharmacies that pass count. */
  accept?: (pharmacy: TilePharmacy) => boolean;
  /** At most this many tiles are asked for at once. */
  batch?: number;
}

/**
 * One step of the search for the nearest pharmacies. Call it, load the tiles it needs, and
 * call it again, until it is done. It asks for a tile only while that tile could still hold
 * something nearer than what is already found, so the answer equals a search through
 * every pharmacy there is.
 */
export function searchStep(options: SearchOptions): SearchStep {
  const { position, count, radius, grid, loaded, failed, accept, batch = 4 } = options;

  const matches: Found[] = [];
  for (const pharmacies of loaded.values()) {
    for (const pharmacy of pharmacies) {
      if (accept && !accept(pharmacy)) continue;
      const meters = distanceMeters(position, pharmacy);
      if (meters <= radius) matches.push({ pharmacy, meters });
    }
  }
  matches.sort((a, b) => a.meters - b.meters || (a.pharmacy.id < b.pharmacy.id ? -1 : 1));
  const nearest = matches.slice(0, count);

  // Nothing farther than the last of a full list can change it.
  const reach = nearest.length === count ? nearest[count - 1].meters : radius;
  const need = tilesWithin(position, reach)
    .filter((tile) => hasTile(grid, tile) && !loaded.has(tileKey(tile)) && !failed?.has(tileKey(tile)))
    .slice(0, batch)
    .map(({ x, y }) => ({ x, y }));

  return { nearest, need, done: need.length === 0 };
}

// ---------------------------------------------------------------------------
// Writing and reading a tile
// ---------------------------------------------------------------------------

const MINUTE = 60;

function flat(intervals: Interval[], from: number): number[] {
  return intervals.flatMap((interval) => [Math.round((interval.from - from) / MINUTE), Math.round((interval.to - from) / MINUTE)]);
}

function unflat(pairs: number[], from: number): Interval[] {
  const intervals: Interval[] = [];
  for (let i = 0; i + 1 < pairs.length; i += 2) intervals.push({ from: from + pairs[i] * MINUTE, to: from + pairs[i + 1] * MINUTE });
  return intervals;
}

/** Rounds a coordinate to five decimals, about a metre. */
export const roundCoordinate = (value: number): number => Math.round(value * 1e5) / 1e5;

export function encodeTile(tile: Tile): TileJson {
  const sources: SourceJson[] = [];
  const sourceIndex = new Map<string, number>();
  const cities: string[] = [];
  const cityIndex = new Map<string, number>();
  const hours: HoursSetJson[] = [];
  const hoursIndex = new Map<string, number>();

  const rows = tile.pharmacies.map((pharmacy): RowJson => {
    const sourceKey = `${pharmacy.country}|${pharmacy.zone}|${pharmacy.generated}|${pharmacy.windowFrom}|${pharmacy.windowUntil}`;
    let source = sourceIndex.get(sourceKey);
    if (source === undefined) {
      source = sources.push({ country: pharmacy.country, zone: pharmacy.zone, generated: pharmacy.generated, from: pharmacy.windowFrom, until: pharmacy.windowUntil }) - 1;
      sourceIndex.set(sourceKey, source);
    }

    let city: number | null = null;
    if (pharmacy.city !== undefined) {
      city = cityIndex.get(pharmacy.city) ?? null;
      if (city === null) {
        city = cities.push(pharmacy.city) - 1;
        cityIndex.set(pharmacy.city, city);
      }
    }

    let hoursCell: number | string | null = null;
    let raw: string | null = null;
    const h = pharmacy.hours;
    if (h.kind === 'unparseable') {
      hoursCell = 'x';
      raw = h.raw;
    } else if (h.kind === 'uncertain') {
      hoursCell = 'u';
      raw = h.raw;
    } else if (h.kind === 'parsed') {
      const open = flat(h.open, pharmacy.windowFrom);
      const unknown = flat(h.unknown, pharmacy.windowFrom);
      const set: HoursSetJson = unknown.length > 0 ? [open, unknown] : [open];
      const key = JSON.stringify(set);
      let index = hoursIndex.get(key);
      if (index === undefined) {
        index = hours.push(set) - 1;
        hoursIndex.set(key, index);
      }
      hoursCell = index;
      raw = h.raw ?? null;
    }

    const row: RowJson = [
      pharmacy.id,
      roundCoordinate(pharmacy.lat),
      roundCoordinate(pharmacy.lon),
      pharmacy.name,
      pharmacy.street ?? null,
      city,
      source,
      hoursCell,
      raw,
      pharmacy.phone ?? null,
      pharmacy.email ?? null,
      pharmacy.website ?? null,
      pharmacy.wheelchair ?? null,
      pharmacy.wheelchairNote ?? null,
      pharmacy.dispensing === false ? false : null,
      pharmacy.checkDate ?? null,
    ];
    while (row.length > 0 && row[row.length - 1] === null) row.pop();
    return row;
  });

  return {
    v: TILE_VERSION,
    z: TILE_ZOOM,
    x: tile.x,
    y: tile.y,
    sources,
    cities,
    hours,
    rows,
    ...(tile.border ? { border: tile.border } : {}),
  };
}

const text = (value: unknown): string | undefined => (typeof value === 'string' && value !== '' ? value : undefined);

/** Reads a tile file. Throws on a file it doesn't understand: the caller treats that as a failed load. */
export function decodeTile(json: TileJson): Tile {
  if (json?.v !== TILE_VERSION || !Array.isArray(json.rows) || !Array.isArray(json.sources)) throw new Error('not a tile of this version');

  const pharmacies = json.rows.map((row): TilePharmacy => {
    const source = json.sources[row[6] as number];
    if (!source) throw new Error('row without a source');
    const cell = row[7] ?? null;
    const raw = text(row[8]);

    let hours: Hours;
    if (cell === null) hours = { kind: 'missing' };
    else if (cell === 'x') hours = { kind: 'unparseable', raw: raw ?? '' };
    else if (cell === 'u') hours = { kind: 'uncertain', raw: raw ?? '' };
    else {
      const set = json.hours[cell as number];
      if (!set) throw new Error('row without its hours');
      hours = { kind: 'parsed', open: unflat(set[0], source.from), unknown: unflat(set[1] ?? [], source.from), ...(raw ? { raw } : {}) };
    }

    const access = row[12];
    const wheelchair: Wheelchair | undefined = access === 'yes' || access === 'limited' || access === 'no' ? access : undefined;
    return {
      id: String(row[0]),
      lat: row[1] as number,
      lon: row[2] as number,
      name: text(row[3]) ?? null,
      ...optional('street', text(row[4])),
      ...optional('city', typeof row[5] === 'number' ? json.cities[row[5]] : undefined),
      country: source.country,
      zone: source.zone,
      generated: source.generated,
      windowFrom: source.from,
      windowUntil: source.until,
      hours,
      ...optional('phone', text(row[9])),
      ...optional('email', text(row[10])),
      ...optional('website', text(row[11])),
      ...optional('wheelchair', wheelchair),
      ...optional('wheelchairNote', text(row[13])),
      ...(row[14] === false ? { dispensing: false as const } : {}),
      ...optional('checkDate', text(row[15])),
    };
  });

  return { x: json.x, y: json.y, pharmacies, ...(json.border ? { border: json.border } : {}) };
}

function optional<K extends string, V>(key: K, value: V | undefined): { [P in K]?: V } {
  return (value === undefined ? {} : { [key]: value }) as { [P in K]?: V };
}

// ---------------------------------------------------------------------------
// The border grid
// ---------------------------------------------------------------------------

/** The cell of a square's border grid that a position falls in: column and row, from the north-west corner. */
export function borderCell(tile: TileRef, n: number, position: LatLon): { column: number; row: number } {
  const [px, py] = project(position.lat, position.lon, TILE_ZOOM);
  const clamp = (value: number) => Math.min(n - 1, Math.max(0, Math.floor(value)));
  return { column: clamp((px / 256 - tile.x) * n), row: clamp((py / 256 - tile.y) * n) };
}

/** The middle of a cell of a square's border grid. */
export function borderCellCenter(tile: TileRef, n: number, column: number, row: number): LatLon {
  const x = tile.x + (column + 0.5) / n;
  const y = tile.y + (row + 0.5) / n;
  return { lat: latOfRow(y), lon: lonOfColumn(x) };
}

/** The country code of one cell, or null where the cell is in no country (open sea). */
export function countryInCell(border: BorderGrid, column: number, row: number): string | null {
  if (column < 0 || row < 0 || column >= border.n || row >= border.n) return null;
  const cell = border.cells[row * border.n + column];
  if (cell === undefined || cell === '.') return null;
  return border.codes[parseInt(cell, 36)] ?? null;
}
