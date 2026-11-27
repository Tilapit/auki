import { COUNTRY_CODES } from '../countries';
import type { SearchResult } from '../live';
import type { Position } from '../state';
import { TILE_ZOOM, tileKey, tileOf } from '../tiles';
import { distanceMeters } from '../geo';
import type { CountryStats, Hours, IndexJson, TilePharmacy } from '../tiles';
import { WALK_METERS_PER_SECOND, byWalking } from '../walking';
import type { Walk, Walks } from '../walking';

/**
 * Tile data at a fixed moment, for /dev/states and the browser tests: pharmacies around
 * Kamppi in Helsinki as a tile would carry them, in the week of Monday 23 November 2026.
 * Names are invented.
 */

const utc = (iso: string): number => Date.parse(iso) / 1000;

/** Monday 23 November 2026, 00:00 in Helsinki. */
export const WEEK_FROM = utc('2026-11-22T22:00:00Z');
export const WEEK_UNTIL = WEEK_FROM + 8 * 86400;
export const GENERATED = utc('2026-11-23T01:17:00Z');
/** Monday 20:41 in Helsinki: the moment of the canvas. */
export const MONDAY_EVENING = utc('2026-11-23T18:41:00Z');
/** Nine days later: the data is out of date. */
export const NINE_DAYS_LATER = MONDAY_EVENING + 9 * 86400;

export const KAMPPI = { lat: 60.16952, lon: 24.93545 };
export const HERE: Position = { source: 'device', ...KAMPPI, accuracy: 25, approximate: false };

const at = (day: number, clock: string): number => WEEK_FROM + day * 86400 + Number(clock.slice(0, 2)) * 3600 + Number(clock.slice(3)) * 60;
/** The same hours every day of the window. "26:00" is two at night. */
export const daily = (open: string, close: string): Hours => ({ kind: 'parsed', open: [0, 1, 2, 3, 4, 5, 6, 7].map((day) => ({ from: at(day, open), to: at(day, close) })), unknown: [] });
/** Weekdays, Saturday and Sunday each with their own hours, or none: the window starts on a Monday. */
export const weekly = (weekdays: [string, string], saturday?: [string, string], sunday?: [string, string]): Hours => ({
  kind: 'parsed',
  open: [0, 1, 2, 3, 4, 5, 6, 7].flatMap((day) => {
    const hours = day % 7 === 5 ? saturday : day % 7 === 6 ? sunday : weekdays;
    return hours ? [{ from: at(day, hours[0]), to: at(day, hours[1]) }] : [];
  }),
  unknown: [],
});
export const ALWAYS: Hours = { kind: 'parsed', open: [{ from: WEEK_FROM, to: WEEK_UNTIL }], unknown: [] };

function pharmacy(id: string, name: string | null, north: number, east: number, hours: Hours, more: Partial<TilePharmacy> = {}): TilePharmacy {
  return {
    id,
    name,
    lat: Math.round((KAMPPI.lat + north / 111_320) * 1e5) / 1e5,
    lon: Math.round((KAMPPI.lon + east / 55_400) * 1e5) / 1e5,
    city: 'Helsinki',
    country: 'FI',
    zone: 'Europe/Helsinki',
    generated: GENERATED,
    windowFrom: WEEK_FROM,
    windowUntil: WEEK_UNTIL,
    hours,
    ...more,
  };
}

/** Around Kamppi, by distance: one closing at 21, one open late, one closed, one without hours, one unreadable. */
export const kamppi: TilePharmacy[] = [
  pharmacy('n101', 'Kampin apteekki', 120, 60, daily('08:00', '21:00'), { street: 'Urho Kekkosen katu 1', phone: '+358 9 1234 501', wheelchair: 'yes', email: 'kamppi@apteekki.example', website: 'https://www.kampinapteekki.example/' }),
  pharmacy('n102', 'Yliopiston apteekki', -260, 180, daily('07:00', '24:00'), { street: 'Mannerheimintie 5', phone: '+358 9 1234 502' }),
  pharmacy('n103', 'Hietalahden apteekki', -420, -380, daily('09:00', '18:00'), { street: 'Bulevardi 30' }),
  pharmacy('n104', null, 610, -240, { kind: 'missing' }, { street: 'Runeberginkatu 6' }),
  pharmacy('n105', 'Töölön apteekki', 900, -300, { kind: 'unparseable', raw: 'soita ensin' }, { street: 'Töölöntori 4' }),
  pharmacy('n106', 'Kruununhaan apteekki', 500, 1500, daily('08:00', '20:00'), { street: 'Liisankatu 21' }),
];

/**
 * Farther out around Kamppi. With these there are more pharmacies than the list's ten: the
 * first four are near enough to be listed, the last four are on the map only.
 */
export const beyond: TilePharmacy[] = [
  pharmacy('n301', 'Ruoholahden apteekki', -700, -1100, daily('08:00', '20:00'), { street: 'Itämerenkatu 21' }),
  pharmacy('n302', 'Kallion apteekki', 1500, 900, daily('08:00', '22:00'), { street: 'Siltasaarenkatu 12' }),
  pharmacy('n303', 'Punavuoren apteekki', -1500, 300, daily('09:00', '19:00'), { street: 'Fredrikinkatu 20' }),
  pharmacy('n304', 'Hakaniemen apteekki', 1300, 1200, { kind: 'missing' }, { street: 'Hämeentie 1' }),
  pharmacy('n305', 'Meilahden apteekki', 2600, -900, daily('08:00', '22:00'), { street: 'Mannerheimintie 96' }),
  pharmacy('n306', 'Lauttasaaren apteekki', -1000, -3200, daily('09:00', '18:00'), { street: 'Lauttasaarentie 28' }),
  pharmacy('n307', 'Vallilan apteekki', 2700, 1100, { kind: 'missing' }, { street: 'Mäkelänkatu 30' }),
  pharmacy('n308', 'Munkkiniemen apteekki', 2900, -3300, daily('09:00', '20:30'), { street: 'Munkkiniemen puistotie 14' }),
];

/** Twenty kilometres east, two squares away: no search from Kamppi reaches them. The map does, when it is moved there. */
export const farEast: TilePharmacy[] = [
  pharmacy('n401', 'Söderkullan apteekki', 2500, 21_500, daily('08:00', '22:00'), { city: 'Sipoo', street: 'Amiraalintie 2' }),
  pharmacy('n402', 'Nikkilän apteekki', 9000, 22_800, daily('09:00', '18:00'), { city: 'Sipoo', street: 'Iso Kylätie 12' }),
];

/** Fourteen kilometres north, in the next square: open around the clock. */
export const farOpen: TilePharmacy = pharmacy('n201', 'Jumbon apteekki', 14_000, 1_200, ALWAYS, { city: 'Vantaa', street: 'Vantaanportinkatu 3' });

/** Everything near Kamppi closes by six: at 20:41 nothing nearby is open. */
export const kamppiClosed: TilePharmacy[] = kamppi.map((p) => (p.hours.kind === 'parsed' ? { ...p, hours: daily('09:00', '18:00') } : p));

export function resultOf(pharmacies: TilePharmacy[], more: Partial<SearchResult> = {}): SearchResult {
  const candidates = pharmacies.map((p) => ({ pharmacy: p, meters: distanceMeters(KAMPPI, p) })).sort((a, b) => a.meters - b.meters);
  return { candidates, missing: [], ...more };
}

/**
 * Walking times as a street grid gives them: three tenths longer than the straight line, at
 * 5 km/h. `own` gives a pharmacy its own walk by id, or null for no walking route to it.
 */
export function walksOf(pharmacies: TilePharmacy[], own: Record<string, Walk | null> = {}): Walks {
  const walks = new Map<string, Walk>();
  for (const pharmacy of pharmacies) {
    const meters = Math.round(distanceMeters(KAMPPI, pharmacy) * 1.3);
    const walk = pharmacy.id in own ? own[pharmacy.id] : { meters, seconds: Math.round(meters / WALK_METERS_PER_SECOND) };
    if (walk) walks.set(pharmacy.id, walk);
  }
  return walks;
}

/** A search result with walking times, in the order they give, as the live search builds it. */
export function walkedResultOf(pharmacies: TilePharmacy[], more: Partial<SearchResult> = {}, own: Record<string, Walk | null> = {}): SearchResult {
  const straight = resultOf(pharmacies, more);
  const walks = walksOf(pharmacies, own);
  return { ...straight, candidates: byWalking(straight.candidates, walks), walks };
}

const stats = (pharmacies: number, withHours: number, parsed: number, more: Partial<CountryStats> = {}): CountryStats => ({
  generated: GENERATED,
  pharmacies,
  withHours,
  parsed,
  unparseable: withHours - parsed,
  uncertain: 0,
  corrected: 0,
  shareWithHours: Math.round((withHours / pharmacies) * 10000) / 10000,
  parseRate: Math.round((parsed / withHours) * 10000) / 10000,
  ...more,
});

/**
 * Pharmacies, how many of them have opening hours, and how many of those were read, per
 * country, as the pipeline measured them. The first 21: its run of 23 November 2026 on
 * OpenStreetMap's data of that day. The ten that joined on 27 November 2026 (the rest of the
 * EU and the EEA): its run of that day on that day's data, France and the Netherlands without
 * what lies outside Europe.
 */
export const MEASURED_RUNS: Record<string, [pharmacies: number, withHours: number, parsed: number]> = {
  FI: [787, 624, 624],
  AT: [1517, 1189, 1188],
  CH: [1646, 1036, 1035],
  CZ: [2540, 2283, 2283],
  DE: [17084, 14023, 14023],
  DK: [545, 308, 308],
  EE: [480, 289, 289],
  ES: [18253, 3313, 3306],
  GR: [5600, 409, 407],
  HR: [916, 330, 329],
  HU: [2358, 1160, 1160],
  IT: [16875, 3829, 3827],
  LT: [773, 454, 454],
  LV: [694, 532, 532],
  MT: [156, 44, 43],
  NO: [1081, 1025, 1024],
  PL: [12809, 4892, 4887],
  PT: [2746, 645, 642],
  SE: [1110, 622, 622],
  SI: [315, 130, 130],
  SK: [1702, 943, 942],
  BE: [3581, 1495, 1495],
  BG: [1718, 828, 828],
  CY: [647, 63, 62],
  FR: [19098, 10117, 10116],
  IE: [1500, 403, 402],
  LU: [107, 104, 104],
  NL: [1694, 1104, 1104],
  RO: [4032, 1062, 1061],
  IS: [109, 100, 99],
  LI: [6, 6, 5],
};

/**
 * An index with every covered country, for the data page: the real numbers of one run, each
 * country fetched a little after the one before it, as in a real night. Latvia could not be
 * refreshed and keeps the data of two nights earlier.
 */
export function indexOf(tiles: { x: number; y: number }[], outside: { x: number; y: number }[] = []): IndexJson {
  const home = tileOf(KAMPPI);
  const x0 = home.x - 4;
  const y0 = home.y - 4;
  const has = new Set(tiles.map(tileKey));
  const out = new Set(outside.map(tileKey));
  const rows = Array.from({ length: 9 }, (_, row) => Array.from({ length: 9 }, (_, column) => (out.has(tileKey({ x: x0 + column, y: y0 + row })) ? '.' : has.has(tileKey({ x: x0 + column, y: y0 + row })) ? 'd' : 'c')).join(''));
  const countries = Object.fromEntries(COUNTRY_CODES.map((code, index) => [code, stats(...MEASURED_RUNS[code], { generated: GENERATED + index * 47 })]));
  countries.LV = { ...countries.LV, generated: GENERATED - 2 * 86400 + 11 * 47, kept: 'fetch' };
  return { v: 1, generated: GENERATED + COUNTRY_CODES.length * 47 + 5, attribution: '© OpenStreetMap contributors, ODbL 1.0, https://www.openstreetmap.org/copyright', countries, grid: { z: TILE_ZOOM, x0, y0, width: 9, rows } };
}
