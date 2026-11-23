import { describe, expect, it } from 'vitest';
import { coverageAt } from '@/lib/coverage';
import { COUNTRY_CODES } from '@/lib/countries';
import { makeI18n } from '@/lib/i18n';
import { RERANK_AFTER_METERS, SHOWN, movedEnough, staysOpen, toOpenStatus, toScene } from '@/lib/live';
import type { SearchResult } from '@/lib/live';
import { carriesPosition, contentSecurityPolicy, isAllowedUrl, securityHeaders } from '@/lib/requests';
import { Tiles, findPharmacies } from '@/lib/search';
import { initialState, reducer } from '@/lib/state';
import type { Position, State } from '@/lib/state';
import { statusText } from '@/lib/status';
import { INDEX_PATH, TILE_ZOOM, encodeTile, tileKey, tileOf, tilePath } from '@/lib/tiles';
import type { BorderGrid, GridJson, Hours, IndexJson, TilePharmacy, TileRef } from '@/lib/tiles';
import { COUNTRY_CODES as PIPELINE_CODES } from '@/pipeline/countries';

const utc = (iso: string): number => Date.parse(iso) / 1000;
const FROM = utc('2026-11-22T22:00:00Z'); // Monday 23 November 2026, 00:00 in Helsinki
const UNTIL = FROM + 8 * 86400;
const GENERATED = utc('2026-11-23T01:30:00Z');
const HERE = { lat: 60.1699, lon: 24.9384 };
const at = (day: number, clock: string): number => FROM + day * 86400 + Number(clock.slice(0, 2)) * 3600 + Number(clock.slice(3)) * 60;
const daily = (open: string, close: string): Hours => ({ kind: 'parsed', open: [0, 1, 2, 3, 4, 5, 6, 7].map((day) => ({ from: at(day, open), to: at(day, close) })), unknown: [] });

let next = 1;
function pharmacy(north: number, hours: Hours, more: Partial<TilePharmacy> = {}): TilePharmacy {
  return { id: `n${next++}`, lat: HERE.lat + north / 111_000, lon: HERE.lon, name: `Apteekki ${next}`, country: 'FI', zone: 'Europe/Helsinki', generated: GENERATED, windowFrom: FROM, windowUntil: UNTIL, hours, ...more };
}
const found = (list: TilePharmacy[]) => list.map((p) => ({ pharmacy: p, meters: Math.abs(p.lat - HERE.lat) * 111_000 }));
const position: Position = { source: 'device', ...HERE, accuracy: 20, approximate: false };
const scene = (result: SearchResult, now: number, deviceZone = 'Europe/Helsinki') => toScene({ position, result, now, deviceZone });

describe('from tiles to the results views', () => {
  it('words each status on the pharmacy clock', () => {
    const fi = makeI18n('fi');
    const text = (hours: Hours, now: number, device = 'Europe/Helsinki') => statusText(fi, toOpenStatus(pharmacy(100, hours), now, device));
    expect(text(daily('08:00', '21:00'), at(0, '12:00'))).toBe('Auki klo 21 asti');
    expect(text(daily('08:00', '21:00'), at(0, '20:41'))).toBe('Sulkeutuu pian, klo 21');
    expect(text(daily('08:00', '24:00'), at(0, '20:00'))).toBe('Auki klo 24 asti');
    expect(text(daily('08:00', '21:00'), at(0, '22:00'))).toBe('Kiinni, avautuu huomenna klo 8');
    expect(text(daily('08:00', '21:00'), at(1, '06:00'))).toBe('Kiinni, avautuu klo 8');
    expect(text({ kind: 'parsed', open: [{ from: FROM, to: UNTIL }], unknown: [] }, at(2, '03:00'))).toBe('Auki ympäri vuorokauden');
    expect(text({ kind: 'missing' }, at(0, '12:00'))).toBe('Aukioloaikoja ei ole merkitty');
    expect(text(daily('08:00', '21:00'), GENERATED + 7 * 86400 + 60)).toBe('Aukioloajat voivat olla vanhentuneet');
    // Seen from Stockholm, an hour behind: the times are the pharmacy's, and the line says so.
    expect(text(daily('08:00', '21:00'), at(0, '12:00'), 'Europe/Stockholm')).toBe('Auki klo 21 asti paikallista aikaa');
    expect(statusText(makeI18n('en'), toOpenStatus(pharmacy(100, daily('08:00', '21:00')), at(0, '12:00'), 'Europe/Stockholm'))).toBe('Open until 21:00 local time');
  });

  it('calls an interval that ends more than a day away open around the clock', () => {
    const long: Hours = { kind: 'parsed', open: [{ from: at(0, '08:00'), to: at(3, '18:00') }], unknown: [] };
    expect(toOpenStatus(pharmacy(100, long), at(0, '12:00'), 'Europe/Helsinki')).toEqual({ kind: 'open24' });
    expect(toOpenStatus(pharmacy(100, long), at(3, '12:00'), 'Europe/Helsinki')).toEqual({ kind: 'open', closes: '18:00' });
  });

  it('shows the nearest ten in the order they came, with straight-line distances', () => {
    const list = Array.from({ length: 14 }, (_, index) => pharmacy(100 * (index + 1), daily('08:00', '21:00')));
    const s = scene({ candidates: found(list), missing: [] }, at(0, '12:00'));
    expect(s.pharmacies).toHaveLength(SHOWN);
    expect(s.pharmacies.map((p) => p.straightMeters)).toEqual([100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]);
    expect(s.distance).toBe('straight');
    expect(s.updated).toBe('12:00');
    expect(s.dataFrom).toBe(GENERATED);
    expect(s.stale).toBeUndefined();
  });

  it('frames the first view so that the pharmacy in the card stands clear of the dot', () => {
    // How far a distance is on screen at a scene zoom (tiles of 256 px).
    const pixels = (meters: number, zoom: number) => meters / ((156543.03392 * Math.cos((HERE.lat * Math.PI) / 180)) / 2 ** zoom);
    const open = daily('08:00', '21:00');
    const closed = daily('08:00', '10:00');
    // The overview fits the fifth nearest, 900 m away. A pharmacy 60 m away would sit on top of the dot in it.
    const block = scene({ candidates: found([pharmacy(60, open), pharmacy(300, closed), pharmacy(500, closed), pharmacy(700, closed), pharmacy(900, closed)]), missing: [] }, at(0, '12:00'));
    expect(pixels(60, block.views.phone.zoom)).toBeGreaterThan(60);
    expect(block.views.phone.zoom).toBe(16.5);
    // The card's pharmacy is the first open one, not the nearest: that is the one kept clear.
    const second = scene({ candidates: found([pharmacy(60, closed), pharmacy(180, open), pharmacy(500, closed), pharmacy(700, closed), pharmacy(900, closed)]), missing: [] }, at(0, '12:00'));
    expect(pixels(180, second.views.phone.zoom)).toBeGreaterThan(60);
    expect(second.views.phone.zoom).toBeLessThan(block.views.phone.zoom);
    // Far enough already: the overview stands as it is, on the phone and wider on the desktop.
    const spread = scene({ candidates: found([pharmacy(600, open), pharmacy(700, closed), pharmacy(800, closed), pharmacy(900, closed), pharmacy(1000, closed)]), missing: [] }, at(0, '12:00'));
    expect(pixels(1000, spread.views.phone.zoom)).toBeLessThanOrEqual(150);
    expect(pixels(1000, spread.views.desktop.zoom)).toBeLessThanOrEqual(330);
    expect(spread.views.desktop.zoom).toBeGreaterThan(spread.views.phone.zoom);
  });

  it('the far open one leads only while nothing shown is open, and only while it stays open itself', () => {
    const near = [pharmacy(100, daily('08:00', '18:00')), pharmacy(200, daily('09:00', '17:00'))];
    const far = found([pharmacy(6300, daily('00:00', '24:00'))])[0];
    const result: SearchResult = { candidates: found(near), farOpen: far, missing: [] };
    expect(scene(result, at(0, '12:00')).farOpen).toBeUndefined();
    expect(scene(result, at(0, '19:00')).farOpen?.straightMeters).toBe(6300);
    const closing = { ...far, pharmacy: { ...far.pharmacy, hours: daily('08:00', '19:20') } };
    expect(staysOpen(closing.pharmacy, at(0, '19:00'))).toBe(false);
    expect(scene({ ...result, farOpen: closing }, at(0, '19:00')).farOpen).toBeUndefined();
  });

  it('says when most of the closed ones open tomorrow', () => {
    const list = [pharmacy(100, daily('08:00', '18:00')), pharmacy(200, daily('09:00', '17:00')), pharmacy(300, daily('10:00', '16:00')), pharmacy(400, daily('00:00', '24:00'))];
    expect(scene({ candidates: found(list), missing: [] }, at(0, '20:00')).closedOpens).toEqual({ from: '08:00', to: '10:00' });
  });

  it('with data older than seven days nothing reads open, and the scene says so', () => {
    const list = [pharmacy(100, daily('00:00', '24:00')), pharmacy(200, { kind: 'missing' })];
    const s = scene({ candidates: found(list), missing: ['RU'] }, GENERATED + 7 * 86400 + 60);
    expect(s.pharmacies.map((p) => p.status.kind)).toEqual(['stale', 'stale']);
    expect(s.stale).toBe(true);
    expect(s.missing).toEqual(['RU']);
  });

  it('one stale country at a border does not make the fresh one stale', () => {
    const list = [pharmacy(100, daily('00:00', '24:00')), pharmacy(200, daily('00:00', '24:00'), { country: 'SE', zone: 'Europe/Stockholm', generated: GENERATED - 8 * 86400 })];
    const s = scene({ candidates: found(list), missing: [] }, at(0, '12:00'));
    expect(s.pharmacies.map((p) => p.status.kind)).toEqual(['open24', 'stale']);
    expect(s.stale).toBeUndefined();
    expect(s.dataFrom).toBe(GENERATED - 8 * 86400);
  });
});

// ---------------------------------------------------------------------------

function gridAround(home: TileRef, squares: Record<string, string>): GridJson {
  const x0 = home.x - 4;
  const y0 = home.y - 4;
  const rows = Array.from({ length: 9 }, (_, row) => Array.from({ length: 9 }, (_, column) => squares[tileKey({ x: x0 + column, y: y0 + row })] ?? 'c').join(''));
  return { z: TILE_ZOOM, x0, y0, width: 9, rows };
}
const COVERED = new Set<string>(['FI']);
const home = tileOf(HERE);

describe('where the coverage ends, on the device', () => {
  it('follows the grid where the square is all one thing', () => {
    expect(coverageAt(gridAround(home, {}), HERE, undefined, COVERED)).toEqual({ kind: 'covered', missing: [] });
    expect(coverageAt(gridAround(home, { [tileKey(home)]: 'd' }), HERE, undefined, COVERED)).toEqual({ kind: 'covered', missing: [] });
    expect(coverageAt(gridAround(home, { [tileKey(home)]: '.' }), HERE, undefined, COVERED)).toEqual({ kind: 'outside' });
  });

  it('reads the border grid of a square that touches another country', () => {
    const grid = gridAround(home, { [tileKey(home)]: 'b' });
    // Two cells by two: Finland in the west, Russia in the east. Helsinki's square, cut down the middle.
    const split: BorderGrid = { n: 2, codes: ['FI', 'RU'], cells: '0101' };
    const allRussia: BorderGrid = { n: 2, codes: ['RU'], cells: '0000' };
    const seaAndRussia: BorderGrid = { n: 2, codes: ['RU'], cells: '.0.0' };
    expect(coverageAt(grid, HERE, split, COVERED)).toEqual({ kind: 'covered', missing: ['RU'] });
    expect(coverageAt(grid, HERE, allRussia, COVERED)).toEqual({ kind: 'outside', country: 'RU' });
    expect(coverageAt(grid, HERE, seaAndRussia, COVERED)).toEqual({ kind: 'outside', country: 'RU' });
    // A border grid that didn't load costs the note, not the results.
    expect(coverageAt(grid, HERE, undefined, COVERED)).toEqual({ kind: 'covered', missing: [] });
  });
});

function world(tiles: { tile: TileRef; pharmacies: TilePharmacy[]; border?: BorderGrid }[], squares: Record<string, string> = {}) {
  const marks = { ...Object.fromEntries(tiles.map(({ tile, border }) => [tileKey(tile), border ? 'b' : 'd'])), ...squares };
  const index: IndexJson = { v: 1, generated: GENERATED, attribution: '', countries: { FI: { generated: GENERATED, pharmacies: 1, withHours: 1, parsed: 1, unparseable: 0, uncertain: 0, corrected: 0, shareWithHours: 1, parseRate: 1 } }, grid: gridAround(home, marks) };
  const files = new Map<string, unknown>([[INDEX_PATH, index], ...tiles.map(({ tile, pharmacies, border }) => [tilePath(tile.x, tile.y), encodeTile({ ...tile, pharmacies, ...(border ? { border } : {}) })] as const)]);
  const asked: string[] = [];
  const load = async (path: string) => {
    asked.push(path);
    if (!files.has(path)) throw new Error('404');
    return JSON.parse(JSON.stringify(files.get(path)));
  };
  return { load, asked, files };
}

describe('the search through tiles', () => {
  const NOON = at(0, '12:00');

  it('finds the pharmacies near the position, and asks only for squares', async () => {
    const list = [pharmacy(300, daily('08:00', '21:00')), pharmacy(100, daily('08:00', '21:00'))];
    const { load, asked } = world([{ tile: home, pharmacies: list }]);
    const outcome = await findPharmacies(new Tiles(load), HERE, NOON);
    expect(outcome.kind === 'results' && outcome.result.candidates.map((f) => Math.round(f.meters))).toEqual([100, 300]);
    expect(asked).toEqual([INDEX_PATH, tilePath(home.x, home.y)]);
    for (const path of asked) expect(carriesPosition(path, HERE)).toBe(false);
  });

  it('looks farther when nothing is within 10 km, and says none when nothing is within 50', async () => {
    const north = { x: home.x, y: home.y - 1 };
    const far = pharmacy(25_000, daily('08:00', '21:00'));
    expect(tileOf(far)).toEqual(north);
    const some = await findPharmacies(new Tiles(world([{ tile: north, pharmacies: [far] }]).load), HERE, NOON);
    expect(some.kind === 'results' && some.result.candidates).toHaveLength(1);
    expect(await findPharmacies(new Tiles(world([]).load), HERE, NOON)).toEqual({ kind: 'none' });
  });

  it('finds a farther open pharmacy when none of those shown is open', async () => {
    const north = { x: home.x, y: home.y - 1 };
    const closed = pharmacy(200, daily('08:00', '10:00'));
    const open = pharmacy(22_000, daily('00:00', '24:00'));
    const outcome = await findPharmacies(new Tiles(world([{ tile: home, pharmacies: [closed] }, { tile: north, pharmacies: [open] }]).load), HERE, NOON);
    expect(outcome.kind === 'results' && outcome.result.farOpen?.pharmacy.id).toBe(open.id);
  });

  it('says not covered outside the grid, and across a border', async () => {
    expect(await findPharmacies(new Tiles(world([], { [tileKey(home)]: '.' }).load), HERE, NOON)).toEqual({ kind: 'notCovered' });
    const across = world([{ tile: home, pharmacies: [pharmacy(9000, daily('08:00', '21:00'))], border: { n: 2, codes: ['RU'], cells: '0000' } }]);
    expect(await findPharmacies(new Tiles(across.load), HERE, NOON)).toEqual({ kind: 'notCovered', country: 'RU' });
  });

  it('names the country that is missing next to the position', async () => {
    const edge = world([{ tile: home, pharmacies: [pharmacy(100, daily('08:00', '21:00'))], border: { n: 2, codes: ['FI', 'RU'], cells: '0101' } }]);
    const outcome = await findPharmacies(new Tiles(edge.load), HERE, NOON);
    expect(outcome.kind === 'results' && outcome.result.missing).toEqual(['RU']);
  });

  it('fails when the index or a tile it needs does not load: no answer is better than a wrong one', async () => {
    expect(await findPharmacies(new Tiles(async () => Promise.reject(new Error('offline'))), HERE, NOON)).toEqual({ kind: 'failed' });
    const { load, files } = world([{ tile: home, pharmacies: [pharmacy(100, daily('08:00', '21:00'))] }]);
    files.delete(tilePath(home.x, home.y));
    expect(await findPharmacies(new Tiles(load), HERE, NOON)).toEqual({ kind: 'failed' });
  });
});

describe('the states after the position is known', () => {
  const searching = reducer(reducer(initialState, { type: 'locate', attempt: 1 }), { type: 'located', attempt: 1, ...HERE, accuracy: 20, at: '12:00' });
  const where = (state: State) => ('position' in state ? state.position : undefined)!;
  const result: SearchResult = { candidates: [], missing: [] };

  it('each answer of the tiles has its view', () => {
    const p = where(searching);
    expect(reducer(searching, { type: 'found', position: p, result }).view).toBe('results');
    expect(reducer(searching, { type: 'noneFound', position: p }).view).toBe('none');
    expect(reducer(searching, { type: 'notCovered', position: p, country: 'FR' })).toMatchObject({ view: 'notCovered', country: 'FR' });
    expect(reducer(searching, { type: 'searchFailed', position: p, offline: true })).toMatchObject({ view: 'failed', offline: true });
  });

  it('an answer for another position changes nothing', () => {
    expect(reducer(searching, { type: 'found', position: { ...where(searching) }, result })).toBe(searching);
  });

  it('a retry searches the same place again, as a new search', () => {
    const failed = reducer(searching, { type: 'searchFailed', position: where(searching), offline: false });
    const again = reducer(failed, { type: 'retry' });
    expect(again.view).toBe('searching');
    expect(where(again)).toEqual(where(searching));
    expect(where(again)).not.toBe(where(searching));
    expect(reducer(searching, { type: 'retry' })).toBe(searching);
  });

  it('the far open pharmacy can arrive, change and go once the results are in', () => {
    const results = reducer(searching, { type: 'found', position: where(searching), result });
    const far = found([pharmacy(6000, daily('00:00', '24:00'))])[0];
    const withFar = reducer(results, { type: 'farOpen', position: where(results), farOpen: far });
    expect(withFar.view === 'results' && withFar.result.farOpen).toBe(far);
    expect(reducer(withFar, { type: 'farOpen', position: where(results), farOpen: far })).toBe(withFar);
    const gone = reducer(withFar, { type: 'farOpen', position: where(results), farOpen: undefined });
    expect(gone.view === 'results' && gone.result.farOpen).toBeUndefined();
  });

  it('after a walk the results move to the new position, and only the results that were ranked for the old one', () => {
    const results = reducer(searching, { type: 'found', position: where(searching), result });
    const there = { source: 'device' as const, lat: HERE.lat + 0.004, lon: HERE.lon, accuracy: 12, approximate: false };
    const ranked: SearchResult = { candidates: found([pharmacy(40, daily('08:00', '21:00'))]), missing: [] };
    const moved = reducer(results, { type: 'moved', from: where(results), position: there, at: '12:07', result: ranked });
    expect(moved).toEqual({ view: 'results', position: there, at: '12:07', result: ranked });
    // An answer that was ranked from somewhere else, or that arrives after the view has changed, is dropped.
    expect(reducer(results, { type: 'moved', from: { ...where(results) }, position: there, at: '12:07', result: ranked })).toBe(results);
    expect(reducer(searching, { type: 'moved', from: where(searching), position: there, at: '12:07', result: ranked })).toBe(searching);
  });
});

describe('following a walk', () => {
  const from = { lat: 60.1695, lon: 24.9354 };
  const north = (meters: number, accuracy = 15) => ({ lat: from.lat + meters / 111_320, lon: from.lon, accuracy });

  it('ranks again after about 300 metres, not before', () => {
    expect(RERANK_AFTER_METERS).toBe(300);
    expect(movedEnough(from, north(120))).toBe(false);
    expect(movedEnough(from, north(299))).toBe(false);
    expect(movedEnough(from, north(310))).toBe(true);
  });

  it('does not take a fix that only got vaguer for a walk', () => {
    // 400 m away, but the device is sure of it only to within 900 m.
    expect(movedEnough(from, north(400, 900))).toBe(false);
    expect(movedEnough(from, north(400, 60))).toBe(true);
  });
});

describe('the list of requests the app may make', () => {
  it('allows our own origin and the map tile host, and nobody else', () => {
    expect(isAllowedUrl('https://example.org/tiles/v1/index.json', 'https://example.org')).toBe(true);
    expect(isAllowedUrl('https://tiles.openfreemap.org/planet', 'https://example.org')).toBe(true);
    expect(isAllowedUrl('https://nominatim.openstreetmap.org/search', 'https://example.org')).toBe(false);
  });

  it('builds the policy that keeps the page to them', () => {
    const policy = contentSecurityPolicy({ development: false, devRoutes: false });
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("connect-src 'self' https://tiles.openfreemap.org;");
    // The map draws on a canvas from vector data: no image from anywhere else, and no blob: either.
    expect(policy).toContain("img-src 'self' data:;");
    expect(policy).toContain("worker-src 'self';");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).not.toContain('unsafe-eval');
    expect(policy).not.toContain('ws:');
    expect(contentSecurityPolicy({ development: true, devRoutes: true })).toContain("frame-ancestors 'self'");
    expect(securityHeaders({ development: false, devRoutes: false }).map((header) => header.key)).toEqual(['Content-Security-Policy', 'Referrer-Policy', 'Permissions-Policy', 'X-Content-Type-Options']);
  });

  it('recognises a position at three decimals or more, and not a tile number', () => {
    expect(carriesPosition('/api/walking?lat=60.16990&lon=24.93840', HERE)).toBe(true);
    expect(carriesPosition('{"lat":60.169}', HERE)).toBe(true);
    expect(carriesPosition('/tiles/v1/10/582/296.json', HERE)).toBe(false);
    expect(carriesPosition('lat=60.17&lon=24.94', HERE)).toBe(false);
  });

  it('the countries named in the app are the ones the pipeline covers', () => {
    expect([...COUNTRY_CODES].sort()).toEqual([...PIPELINE_CODES].sort());
  });
});
