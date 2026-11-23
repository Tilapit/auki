/**
 * Writes what gets published (PLAN.md 7.2, step 5): the tiles, index.json, and one file per
 * country that the next run falls back on when that country can't be refreshed.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { ATTRIBUTION, TILE_VERSION, TILE_ZOOM, decodeTile, encodeTile, tileKey, tileOf } from '../lib/tiles.ts';
import type { CountryStats, IndexJson, Square, Tile, TileJson, TilePharmacy } from '../lib/tiles.ts';
import { coverageOf, gridExtent } from './coverage.ts';
import type { SquareCoverage } from './coverage.ts';

export interface CountryData {
  code: string;
  stats: CountryStats;
  pharmacies: TilePharmacy[];
}

/** The per-country file: everything needed to write that country's rows again. */
export interface CountryFile {
  v: typeof TILE_VERSION;
  country: string;
  stats: CountryStats;
  tile: TileJson;
}

export const countryPath = (code: string): string => `/tiles/v${TILE_VERSION}/countries/${code}.json`;

export function encodeCountry(data: CountryData): CountryFile {
  return { v: TILE_VERSION, country: data.code, stats: data.stats, tile: encodeTile({ x: -1, y: -1, pharmacies: data.pharmacies }) };
}

export function decodeCountry(file: CountryFile): CountryData {
  if (file?.v !== TILE_VERSION || typeof file.country !== 'string') throw new Error('not a country file of this version');
  return { code: file.country, stats: file.stats, pharmacies: decodeTile(file.tile).pharmacies };
}

export interface SiteSummary {
  tiles: number;
  /** Tile files that hold only a border grid. */
  borderOnly: number;
  squares: Record<Square, number>;
  /** Tile sizes in bytes, as written and gzipped the way a CDN would send them. */
  sizes: { median: number; largest: number; medianGzip: number; largestGzip: number; largestTile: string; total: number; totalGzip: number };
  index: { bytes: number; gzip: number };
  countryFiles: { bytes: number; gzip: number };
}

export interface BuildOptions {
  outDir: string;
  /** Epoch seconds: when this site was written. */
  now: number;
  covered: string[];
  /** For tests: where each point is, instead of asking country-coder. */
  countryAt?: (lat: number, lon: number) => string | null;
}

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

function writeJson(file: string, value: unknown): { bytes: number; gzip: number } {
  const text = JSON.stringify(value);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  return { bytes: Buffer.byteLength(text), gzip: gzipSync(text).length };
}

/** Builds the whole site into an empty directory. */
export function buildSite(countries: CountryData[], options: BuildOptions): SiteSummary {
  const { outDir, now } = options;
  const covered = new Set(options.covered);
  const root = path.join(outDir, 'tiles', `v${TILE_VERSION}`);

  // Pharmacies by square.
  const bySquare = new Map<string, TilePharmacy[]>();
  for (const country of countries) {
    for (const pharmacy of country.pharmacies) {
      const key = tileKey(tileOf(pharmacy));
      const list = bySquare.get(key);
      if (list) list.push(pharmacy);
      else bySquare.set(key, [pharmacy]);
    }
  }

  // Every square of the extent: covered or not, and which ones need a border grid.
  const extent = gridExtent();
  const rows: string[] = [];
  const squares: Record<Square, number> = { '.': 0, c: 0, d: 0, b: 0 };
  const tiles: Tile[] = [];
  for (let y = extent.y0; y < extent.y0 + extent.height; y++) {
    let row = '';
    for (let x = extent.x0; x < extent.x0 + extent.width; x++) {
      const pharmacies = bySquare.get(tileKey({ x, y })) ?? [];
      const coverage: SquareCoverage = coverageOf({ x, y }, covered, options.countryAt);
      let square: Square = '.';
      if (coverage.border) square = 'b';
      else if (pharmacies.length > 0) square = 'd';
      else if (coverage.covered) square = 'c';
      row += square;
      squares[square]++;
      if (square === 'b' || square === 'd') {
        // Nearest the middle of the square first is no better than any other order: sort by id, so runs compare.
        pharmacies.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        tiles.push({ x, y, pharmacies, ...(coverage.border ? { border: coverage.border } : {}) });
      }
      bySquare.delete(tileKey({ x, y }));
    }
    rows.push(row);
  }
  if (bySquare.size > 0) {
    throw new Error(`${bySquare.size} squares with pharmacies lie outside the grid, the first at ${[...bySquare.keys()][0]}: widen EXTENT in pipeline/coverage.ts`);
  }

  const bytes: number[] = [];
  const gzips: number[] = [];
  let largest = { bytes: 0, gzip: 0, tile: '' };
  let borderOnly = 0;
  for (const tile of tiles) {
    const size = writeJson(path.join(root, String(TILE_ZOOM), String(tile.x), `${tile.y}.json`), encodeTile(tile));
    if (tile.pharmacies.length === 0) {
      borderOnly++;
      continue;
    }
    bytes.push(size.bytes);
    gzips.push(size.gzip);
    if (size.gzip > largest.gzip) largest = { ...size, tile: tileKey(tile) };
  }

  const index: IndexJson = {
    v: TILE_VERSION,
    generated: now,
    attribution: ATTRIBUTION,
    countries: Object.fromEntries(countries.map((country) => [country.code, country.stats])),
    grid: { z: TILE_ZOOM, x0: extent.x0, y0: extent.y0, width: extent.width, rows },
  };
  const indexSize = writeJson(path.join(root, 'index.json'), index);

  // The data host's own configuration (caching), next to the files it serves.
  const siteConfig = path.join(path.dirname(fileURLToPath(import.meta.url)), 'site', 'vercel.json');
  if (fs.existsSync(siteConfig)) fs.copyFileSync(siteConfig, path.join(outDir, 'vercel.json'));

  const countryFiles = { bytes: 0, gzip: 0 };
  for (const country of countries) {
    const size = writeJson(path.join(outDir, countryPath(country.code)), encodeCountry(country));
    countryFiles.bytes += size.bytes;
    countryFiles.gzip += size.gzip;
  }

  const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
  return {
    tiles: tiles.length,
    borderOnly,
    squares,
    sizes: {
      median: median(bytes),
      largest: largest.bytes,
      medianGzip: median(gzips),
      largestGzip: largest.gzip,
      largestTile: largest.tile,
      total: sum(bytes),
      totalGzip: sum(gzips),
    },
    index: indexSize,
    countryFiles,
  };
}
