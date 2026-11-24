/**
 * Writes the shared test vectors (`npm run vectors`): cases with their answers, as JSON, so
 * the Swift implementation can be checked against the same time and tile logic
 * (PLAN.md section 12). The cases come from a fixed seed: running this twice writes the
 * same files, and tests/unit/vectors.test.ts fails when the files and the code disagree.
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { arrivesInTime, ehditko, isTightSlack } from '../../lib/ehditko.ts';
import { distanceMeters } from '../../lib/geo.ts';
import { hoursStatus, localMoment } from '../../lib/hoursStatus.ts';
import type { HoursStatus } from '../../lib/hoursStatus.ts';
import { TILE_ZOOM, decodeTile, distanceToTile, encodeTile, searchStep, tileBounds, tileKey, tileOf } from '../../lib/tiles.ts';
import type { GridJson, Hours, Interval, LatLon, Tile, TilePharmacy, TileRef } from '../../lib/tiles.ts';
import { clockAt, dateAt, dayNumber, instantOf, startOfDay, wallAt, weekdayAt } from '../../lib/zone.ts';
import type { Wall } from '../../lib/zone.ts';

/** A small seeded generator (mulberry32): the same numbers on every machine. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const utc = (iso: string): number => Date.parse(iso) / 1000;
const round = (value: number, decimals: number): number => Math.round(value * 10 ** decimals) / 10 ** decimals + 0;

/** Every zone a covered pharmacy can be in. Written out, so this file needs nothing from the pipeline. */
const ZONES = [
  'Europe/Helsinki', 'Europe/Vienna', 'Europe/Zurich', 'Europe/Prague', 'Europe/Berlin', 'Europe/Copenhagen', 'Europe/Tallinn',
  'Europe/Madrid', 'Atlantic/Canary', 'Europe/Athens', 'Europe/Zagreb', 'Europe/Budapest', 'Europe/Rome', 'Europe/Vilnius',
  'Europe/Riga', 'Europe/Malta', 'Europe/Oslo', 'Europe/Warsaw', 'Europe/Lisbon', 'Atlantic/Azores', 'Europe/Stockholm',
  'Europe/Ljubljana', 'Europe/Bratislava',
];
// The EU changes its clocks at 01:00 UTC on the last Sunday of March and of October.
const CHANGES = [utc('2026-10-25T01:00:00Z'), utc('2027-03-28T01:00:00Z'), utc('2027-10-31T01:00:00Z')];

// ---------------------------------------------------------------------------

function zoneVectors() {
  const random = seeded(1);
  const instants: { zone: string; instant: number }[] = [];
  for (const zone of ZONES) {
    // Around each change of the clocks, to the minute, and a few ordinary moments.
    for (const change of CHANGES) for (const offset of [-3600, -60, 0, 60, 3600, 5400]) instants.push({ zone, instant: change + offset });
    for (let i = 0; i < 4; i++) instants.push({ zone, instant: utc('2026-06-01T00:00:00Z') + Math.floor(random() * 560 * 86400 / 60) * 60 });
  }
  const atInstant = instants.map(({ zone, instant }) => ({
    zone,
    instant,
    wall: wallAt(instant, zone),
    clock: clockAt(instant, zone),
    date: dateAt(instant, zone),
    weekday: weekdayAt(instant, zone),
    dayNumber: dayNumber(instant, zone),
    startOfDay: startOfDay(instant, zone),
  }));

  const walls: { zone: string; wall: Wall; note?: string }[] = [
    { zone: 'Europe/Helsinki', wall: { year: 2026, month: 11, day: 23, hour: 8, minute: 0 } },
    { zone: 'Europe/Helsinki', wall: { year: 2027, month: 3, day: 28, hour: 3, minute: 30 }, note: 'skipped: the moment the clocks jump' },
    { zone: 'Europe/Helsinki', wall: { year: 2027, month: 3, day: 28, hour: 2, minute: 59 } },
    { zone: 'Europe/Helsinki', wall: { year: 2027, month: 3, day: 28, hour: 4, minute: 0 } },
    { zone: 'Europe/Helsinki', wall: { year: 2026, month: 10, day: 25, hour: 3, minute: 30 }, note: 'comes twice: the first time' },
    { zone: 'Europe/Helsinki', wall: { year: 2026, month: 10, day: 25, hour: 4, minute: 0 } },
    { zone: 'Europe/Berlin', wall: { year: 2027, month: 3, day: 28, hour: 2, minute: 30 }, note: 'skipped' },
    { zone: 'Europe/Berlin', wall: { year: 2026, month: 10, day: 25, hour: 2, minute: 30 }, note: 'comes twice: the first time' },
    { zone: 'Europe/Lisbon', wall: { year: 2027, month: 3, day: 28, hour: 1, minute: 30 }, note: 'skipped' },
    { zone: 'Atlantic/Azores', wall: { year: 2027, month: 3, day: 28, hour: 0, minute: 0 }, note: 'midnight is skipped: the day starts at 01:00' },
    { zone: 'Atlantic/Azores', wall: { year: 2026, month: 10, day: 25, hour: 0, minute: 30 }, note: 'comes twice: the first time' },
    { zone: 'Atlantic/Canary', wall: { year: 2026, month: 12, day: 31, hour: 23, minute: 59 } },
  ];
  for (const zone of ZONES) {
    for (let i = 0; i < 2; i++) {
      const wall = wallAt(utc('2026-06-01T00:00:00Z') + Math.floor(random() * 560 * 1440) * 60, zone);
      // Keep clear of the small hours, so none of these lands on a skipped or doubled time by chance.
      walls.push({ zone, wall: { ...wall, hour: 6 + (wall.hour % 17) } });
    }
  }
  return {
    about: 'Time-zone arithmetic. Instants are epoch seconds. weekday: 0 is Monday. dayNumber: days since 1970-01-01 of the local date.',
    atInstant,
    wallToInstant: walls.map((entry) => ({ ...entry, instant: instantOf(entry.wall, entry.zone) })),
  };
}

// ---------------------------------------------------------------------------

const AREA = { south: 27.5, north: 71.5, west: -31.5, east: 32 };
const randomPosition = (random: () => number): LatLon => ({
  lat: round(AREA.south + random() * (AREA.north - AREA.south), 5),
  lon: round(AREA.west + random() * (AREA.east - AREA.west), 5),
});

const PLACES: (LatLon & { name: string })[] = [
  { name: 'Helsinki', lat: 60.1699, lon: 24.9384 },
  { name: 'Riga', lat: 56.9496, lon: 24.1052 },
  { name: 'Nordkapp', lat: 71.1695, lon: 25.7832 },
  { name: 'Las Palmas', lat: 28.1235, lon: -15.4363 },
  { name: 'Ponta Delgada', lat: 37.7412, lon: -25.6756 },
  { name: 'Valletta', lat: 35.8989, lon: 14.5146 },
  { name: 'Athens', lat: 37.9838, lon: 23.7275 },
  { name: 'Berlin', lat: 52.52, lon: 13.405 },
  { name: 'Greenwich meridian in Spain', lat: 40.0, lon: 0 },
];

function tileVectors() {
  const random = seeded(2);
  const positions = [...PLACES.map(({ lat, lon }) => ({ lat, lon })), ...Array.from({ length: 40 }, () => randomPosition(random))];
  const tiles = positions.map((position) => ({ ...position, ...tileOf(position) }));

  const bounds = tiles.slice(0, 12).map(({ x, y }) => {
    const b = tileBounds({ x, y });
    return { x, y, north: round(b.north, 8), south: round(b.south, 8), west: round(b.west, 8), east: round(b.east, 8) };
  });

  const toTile = positions.slice(0, 25).flatMap((position) => {
    const home = tileOf(position);
    return [
      [0, 0],
      [1, 0],
      [-1, 1],
      [2, -2],
    ].map(([dx, dy]) => {
      const tile = { x: home.x + dx, y: home.y + dy };
      return { ...position, ...tile, meters: round(distanceToTile(position, tile), 2) };
    });
  });

  const distances = Array.from({ length: 20 }, () => {
    const from = randomPosition(random);
    const reach = [0.001, 0.05, 0.5][Math.floor(random() * 3)];
    const to = { lat: round(from.lat + (random() - 0.5) * reach, 5), lon: round(from.lon + (random() - 0.5) * reach, 5) };
    return { from, to, meters: round(distanceMeters(from, to), 2) };
  });

  return {
    about: `Tile numbers at zoom ${TILE_ZOOM}, and distances in metres on a sphere of radius 6371008.8 m. Compare metres to within 0.5 %. distanceToTile is a distance no point of the square is nearer than: the distance to the nearest point of its outline, less a thousandth.`,
    tileOf: tiles,
    bounds,
    distanceToTile: toTile,
    distance: distances,
  };
}

// ---------------------------------------------------------------------------

const HELSINKI = 'Europe/Helsinki';
const FROM = utc('2026-11-22T22:00:00Z'); // Monday 23 November 2026, 00:00 in Helsinki
const UNTIL = FROM + 8 * 86400;
const GENERATED = utc('2026-11-23T01:30:00Z');

const at = (day: number, clock: string): number => {
  const [hour, minute] = clock.split(':').map(Number);
  return FROM + day * 86400 + hour * 3600 + minute * 60;
};
const daily = (open: string, close: string, days = [0, 1, 2, 3, 4, 5, 6, 7]): Hours => ({
  kind: 'parsed',
  open: days.map((day) => ({ from: at(day, open), to: at(day, close) })),
  unknown: [],
});

interface StatusCase {
  name: string;
  zone: string;
  generated: number;
  windowFrom: number;
  windowUntil: number;
  hours: Hours;
  now: number;
}

function statusVectors() {
  const random = seeded(3);
  const base = { zone: HELSINKI, generated: GENERATED, windowFrom: FROM, windowUntil: UNTIL };
  const nineToNine = daily('08:00', '21:00');
  const withUnknown: Hours = {
    kind: 'parsed',
    open: [{ from: at(0, '08:00'), to: at(0, '18:00') }, { from: at(2, '08:00'), to: at(2, '18:00') }],
    unknown: [{ from: at(1, '00:00'), to: at(2, '00:00') }],
    raw: 'Mo,We 08:00-18:00; Tu unknown',
  };
  const cases: StatusCase[] = [
    { name: 'open in the middle of the day', ...base, hours: nineToNine, now: at(0, '12:00') },
    { name: 'exactly thirty minutes before closing is not yet "soon"', ...base, hours: nineToNine, now: at(0, '20:30') },
    { name: 'one second later it is', ...base, hours: nineToNine, now: at(0, '20:30') + 1 },
    { name: 'the last minute', ...base, hours: nineToNine, now: at(0, '20:59') },
    { name: 'closed at the closing minute itself', ...base, hours: nineToNine, now: at(0, '21:00') },
    { name: 'closed before opening, opens today', ...base, hours: nineToNine, now: at(0, '07:59') },
    { name: 'open at the opening minute', ...base, hours: nineToNine, now: at(0, '08:00') },
    { name: 'open only on Mondays: opens next week', ...base, hours: daily('09:00', '17:00', [0, 7]), now: at(1, '10:00') },
    { name: 'around the clock', ...base, hours: { kind: 'parsed', open: [{ from: FROM, to: UNTIL }], unknown: [] }, now: at(3, '03:00') },
    { name: 'an interval that runs to the end of the window has no closing time', ...base, hours: { kind: 'parsed', open: [{ from: at(2, '08:00'), to: UNTIL }], unknown: [] }, now: at(2, '09:00') },
    { name: 'open past midnight, before midnight', ...base, hours: daily('22:00', '26:00', [0, 1, 2, 3, 4, 5, 6]), now: at(0, '23:50') },
    { name: 'open past midnight, after midnight', ...base, hours: daily('22:00', '26:00', [0, 1, 2, 3, 4, 5, 6]), now: at(1, '01:40') },
    { name: 'closes at midnight: 24:00 of the day that ends', ...base, hours: daily('08:00', '24:00'), now: at(0, '20:41') },
    { name: 'closed all week', ...base, hours: { kind: 'parsed', open: [], unknown: [] }, now: at(0, '12:00') },
    { name: 'inside a stretch the data calls unknown', ...base, hours: withUnknown, now: at(1, '12:00') },
    { name: 'closed, and the next thing is unknown: no opening is promised', ...base, hours: withUnknown, now: at(0, '19:00') },
    { name: 'closed after the unknown stretch: the opening is promised again', ...base, hours: withUnknown, now: at(2, '07:00') },
    { name: 'no hours in OpenStreetMap', ...base, hours: { kind: 'missing' }, now: at(0, '12:00') },
    { name: 'hours that could not be read', ...base, hours: { kind: 'unparseable', raw: 'call for hours' }, now: at(0, '12:00') },
    { name: 'hours that can not be trusted', ...base, hours: { kind: 'uncertain', raw: 'sunrise-sunset' }, now: at(0, '12:00') },
    { name: 'seven days old to the second: still read', ...base, hours: daily('00:00', '24:00'), now: GENERATED + 7 * 86400 },
    { name: 'a second older: stale', ...base, hours: daily('00:00', '24:00'), now: GENERATED + 7 * 86400 + 1 },
    { name: 'missing hours go stale too', ...base, hours: { kind: 'missing' }, now: GENERATED + 8 * 86400 },
    { name: 'before the window starts: stale', ...base, hours: nineToNine, now: FROM - 1 },
    { name: 'data kept from an earlier run, read past its window: stale', ...base, generated: UNTIL - 3600, hours: nineToNine, now: UNTIL },
    {
      name: 'a pharmacy in Stockholm seen at 23:30 Helsinki time: its tomorrow starts an hour later',
      zone: 'Europe/Stockholm',
      generated: GENERATED,
      windowFrom: FROM + 3600,
      windowUntil: UNTIL + 3600,
      hours: { kind: 'parsed', open: [{ from: utc('2026-11-23T22:30:00Z'), to: utc('2026-11-24T06:00:00Z') }], unknown: [] },
      now: utc('2026-11-23T21:30:00Z'),
    },
  ];

  // The night the clocks go back, in three zones: 08:00 to 21:00 on the wall, whatever the offset.
  for (const zone of ['Europe/Helsinki', 'Europe/Berlin', 'Atlantic/Azores']) {
    const change = utc('2026-10-25T01:00:00Z');
    const windowFrom = startOfDay(change - 2 * 86400, zone);
    const day = wallAt(windowFrom, zone);
    const open: Interval[] = Array.from({ length: 8 }, (_, index) => ({
      from: instantOf({ ...day, day: day.day + index, hour: 8, minute: 0 }, zone),
      to: instantOf({ ...day, day: day.day + index, hour: 21, minute: 0 }, zone),
    }));
    const windowUntil = instantOf({ ...day, day: day.day + 8, hour: 0, minute: 0 }, zone);
    for (const [label, hour] of [['morning', 7], ['evening', 20]] as const) {
      const sunday = wallAt(change + 12 * 3600, zone);
      cases.push({ name: `${zone}, the day the clocks go back, ${label}`, zone, generated: windowFrom + 5400, windowFrom, windowUntil, hours: { kind: 'parsed', open, unknown: [] }, now: instantOf({ ...sunday, hour, minute: 45 }, zone) });
    }
  }

  // And a spread of random moments over two random weekly schedules.
  for (let i = 0; i < 30; i++) {
    const opens = 6 * 60 + Math.floor(random() * 6 * 4) * 15;
    const length = 4 * 60 + Math.floor(random() * 14 * 4) * 15;
    const days = [0, 1, 2, 3, 4, 5, 6, 7].filter(() => random() > 0.2);
    const two = (value: number) => String(value).padStart(2, '0');
    const clock = (minutes: number) => `${two(Math.floor(minutes / 60))}:${two(minutes % 60)}`;
    cases.push({ name: `random ${i + 1}`, ...base, hours: daily(clock(opens), clock(opens + length), days), now: FROM + Math.floor(random() * 7 * 1440) * 60 });
  }

  return {
    about:
      'Open or closed from intervals. Instants are epoch seconds; an interval holds its start and not its end. ' +
      '"soon" starts under 30 minutes before closing. Data is stale when now − generated > 7 days, or now is outside the window. ' +
      'closes and opens give the moment as the status line says it: day relative to now and "HH:mm", both on the clock of the pharmacy zone; a closing at midnight reads 24:00 of the day that ends.',
    cases: cases.map((entry) => {
      const status: HoursStatus = hoursStatus(entry, entry.now);
      return {
        ...entry,
        status,
        ...(status.kind === 'open' || status.kind === 'soon' ? { closes: localMoment(entry.now, status.closes, entry.zone, true) } : {}),
        ...(status.kind === 'closed' && status.opens !== undefined ? { opens: localMoment(entry.now, status.opens, entry.zone) } : {}),
      };
    }),
  };
}

// ---------------------------------------------------------------------------

function pharmacyAt(id: string, position: LatLon): TilePharmacy {
  return { id, lat: position.lat, lon: position.lon, name: null, country: 'FI', zone: HELSINKI, generated: GENERATED, windowFrom: FROM, windowUntil: UNTIL, hours: { kind: 'missing' } };
}

function gridOf(home: TileRef, tiles: TileRef[]): GridJson {
  const all = [home, ...tiles];
  const x0 = Math.min(...all.map((tile) => tile.x)) - 6;
  const y0 = Math.min(...all.map((tile) => tile.y)) - 6;
  const width = Math.max(...all.map((tile) => tile.x)) - x0 + 7;
  const height = Math.max(...all.map((tile) => tile.y)) - y0 + 7;
  const keys = new Set(tiles.map(tileKey));
  const rows = Array.from({ length: height }, (_, row) => Array.from({ length: width }, (_, column) => (keys.has(tileKey({ x: x0 + column, y: y0 + row })) ? 'd' : 'c')).join(''));
  return { z: TILE_ZOOM, x0, y0, width, rows };
}

function searchVectors() {
  const random = seeded(4);
  const worlds = [
    { name: 'Helsinki, dense', centre: { lat: 60.1699, lon: 24.9384 }, count: 60, reach: 0.25 },
    { name: 'a corner where four squares meet', centre: (() => { const b = tileBounds(tileOf({ lat: 56.95, lon: 24.1 })); return { lat: round(b.north, 5), lon: round(b.west, 5) }; })(), count: 40, reach: 0.3 },
    { name: 'Lapland, sparse', centre: { lat: 68.9, lon: 27.0 }, count: 6, reach: 0.6 },
    { name: 'nothing near', centre: { lat: 40.0, lon: -20.0 }, count: 0, reach: 0.1 },
  ];
  return {
    about:
      'The nearest pharmacies through tiles. Each world has a grid ("d": a tile exists) and the pharmacies of each tile. ' +
      'A search loads only tiles the grid lists, and stops when no tile it has not loaded could hold something nearer. ' +
      'The answer must equal a search through every pharmacy: nearest first, ties by id. loads says how many tiles the reference implementation needed.',
    worlds: worlds.map((world) => {
      const pharmacies = Array.from({ length: world.count }, (_, index) => {
        const spread = random() < 0.4 ? world.reach / 20 : world.reach;
        return pharmacyAt(`n${index + 1}`, {
          lat: round(world.centre.lat + (random() - 0.5) * 2 * spread, 5),
          lon: round(world.centre.lon + ((random() - 0.5) * 2 * spread) / Math.cos((world.centre.lat * Math.PI) / 180), 5),
        });
      });
      const tiles = new Map<string, TilePharmacy[]>();
      for (const pharmacy of pharmacies) {
        const key = tileKey(tileOf(pharmacy));
        tiles.set(key, [...(tiles.get(key) ?? []), pharmacy]);
      }
      const grid = gridOf(tileOf(world.centre), pharmacies.map((pharmacy) => tileOf(pharmacy)));
      const searches = [
        { count: 20, radius: 10_000 },
        { count: 5, radius: 50_000 },
        { count: 1, radius: 30_000 },
      ].map(({ count, radius }) => {
        const loaded = new Map<string, TilePharmacy[]>();
        for (;;) {
          const step = searchStep({ position: world.centre, count, radius, grid, loaded });
          if (step.done) {
            return { position: world.centre, count, radius, loads: loaded.size, nearest: step.nearest.map((found) => ({ id: found.pharmacy.id, meters: round(found.meters, 1) })) };
          }
          for (const tile of step.need) loaded.set(tileKey(tile), tiles.get(tileKey(tile)) ?? []);
        }
      });
      return {
        name: world.name,
        grid,
        tiles: Object.fromEntries([...tiles].map(([key, list]) => [key, list.map(({ id, lat, lon }) => ({ id, lat, lon }))])),
        searches,
      };
    }),
  };
}

// ---------------------------------------------------------------------------

function tileFileVectors() {
  const schedule: Interval[] = [0, 1, 2, 3, 4].map((day) => ({ from: at(day, '08:00'), to: at(day, '21:00') }));
  const tile: Tile = {
    x: 582,
    y: 296,
    pharmacies: [
      { ...pharmacyAt('n1', { lat: 60.1699, lon: 24.9384 }), name: 'Keskustan apteekki', street: 'Mannerheimintie 5', city: 'Helsinki', hours: { kind: 'parsed', open: schedule, unknown: [] }, phone: '+358 9 1234567', email: 'apteekki@example.org', website: 'https://example.org/', wheelchair: 'yes', wheelchairNote: 'Luiska sivuovella', checkDate: '2026-10-01' },
      { ...pharmacyAt('w2', { lat: 60.1705, lon: 24.941 }), name: 'Aseman apteekki', city: 'Helsinki', hours: { kind: 'parsed', open: schedule, unknown: [] } },
      { ...pharmacyAt('n3', { lat: 60.18, lon: 24.95 }), name: 'Yöapteekki', hours: { kind: 'parsed', open: [{ from: FROM, to: UNTIL }], unknown: [] }, dispensing: false },
      { ...pharmacyAt('r4', { lat: 60.19, lon: 24.96 }), hours: { kind: 'parsed', open: [{ from: at(0, '08:00'), to: at(0, '18:00') }], unknown: [{ from: at(1, '00:00'), to: at(2, '00:00') }], raw: 'Mo 08:00-18:00; Tu unknown' } },
      { ...pharmacyAt('n5', { lat: 60.2, lon: 24.97 }), name: 'Kyläapteekki', hours: { kind: 'unparseable', raw: 'soita ensin' } },
      { ...pharmacyAt('n6', { lat: 60.21, lon: 24.98 }), name: 'Rantaapteekki', hours: { kind: 'uncertain', raw: 'sunrise-sunset' } },
      { ...pharmacyAt('n7', { lat: 60.22, lon: 24.99 }), name: 'Apotek över viken', country: 'SE', zone: 'Europe/Stockholm', generated: GENERATED - 86400, windowFrom: FROM - 86400 + 3600, windowUntil: UNTIL - 86400 + 3600, city: 'Haparanda' },
    ],
    border: { n: 2, codes: ['FI', 'RU'], cells: '0.01' },
  };
  const file = encodeTile(tile);
  return {
    about: 'One tile as it is stored, and what reading it must give. See docs/tiles.md.',
    file,
    decoded: decodeTile(file),
  };
}

// ---------------------------------------------------------------------------

function ehditkoVectors() {
  const random = seeded(5);
  // Closing times on the minute: ordinary evenings, a midnight, and closings just after each change of the clocks.
  const closings = [utc('2026-11-19T19:00:00Z'), utc('2026-11-23T22:00:00Z'), utc('2027-06-11T17:30:00Z'), ...CHANGES.map((change) => change + 30 * 60)];
  const cases: { status: HoursStatus; walkMin: number; now: number; answer: ReturnType<typeof ehditko>; inTime: boolean }[] = [];
  const add = (status: HoursStatus, walkMin: number, now: number) => cases.push({ status, walkMin, now, answer: ehditko(status, walkMin, now), inTime: arrivesInTime(status, walkMin, now) });

  for (const closes of closings) {
    const open = (now: number): HoursStatus => ({ kind: closes - now < 30 * 60 ? 'soon' : 'open', closes });
    // Around the start of the timeline: 61, 60 and 59 minutes before closing, at any second of the minute.
    for (const minutes of [61, 60, 59]) {
      for (const seconds of [0, 1, 59]) {
        const now = closes - minutes * 60 + seconds;
        add(open(now), 5, now);
      }
    }
    // Around arriving exactly at closing.
    for (const walkMin of [1, 3, 10, 45]) {
      for (const early of [-1, 0, 1]) {
        const now = closes - (walkMin + early) * 60 + Math.floor(random() * 60);
        add(open(now), walkMin, now);
      }
    }
    // A long walk to a door that closes more than an hour from now, and some ordinary moments.
    add(open(closes - 80 * 60), 90, closes - 80 * 60);
    add(open(closes - 80 * 60), 30, closes - 80 * 60);
    for (let i = 0; i < 6; i++) {
      const now = closes - Math.floor(random() * 3 * 3600);
      add(open(now), 1 + Math.floor(random() * 40), now);
    }
  }
  // Nothing to say for a pharmacy that never closes, or isn't open.
  const now = closings[0] - 19 * 60;
  for (const status of [{ kind: 'open24' }, { kind: 'closed', opens: now + 3600 }, { kind: 'closed' }, { kind: 'missing' }, { kind: 'unparseable', raw: 'by appointment' }, { kind: 'uncertain', raw: 'Mo-Fr 08:00-18:00; PH off' }, { kind: 'stale' }] as HoursStatus[]) {
    add(status, 3, now);
  }

  const tight = [
    [4, 3], [5, 3], [16, 3], [0, 1], [4, 25], [5, 25], [5, 26], [5, 30], [6, 30], [7, 40], [8, 40], [11, 60], [12, 60],
  ].map(([slackMin, walkMin]) => ({ slackMin, walkMin, tight: isTightSlack(slackMin, walkMin) }));

  return {
    about:
      'Ehditkö: will the walk end before closing. status is the answer of the status rules (status.json); closes, now and arrives are epoch seconds; walkMin is whole minutes, rounded up from the walking time. ' +
      'The walk is counted from the start of the current minute. tooLate when it ends at closing time or after it; the timeline when closing is at most 60 minutes after the current minute; otherwise none. ' +
      'inTime: open, and the walk ends before closing (always true around the clock). tight: the slack is under five minutes or under a fifth of the walk.',
    cases,
    tight,
  };
}

// ---------------------------------------------------------------------------

export function buildVectors(): Record<string, unknown> {
  return {
    'zone.json': zoneVectors(),
    'tiles.json': tileVectors(),
    'status.json': statusVectors(),
    'search.json': searchVectors(),
    'tile-file.json': tileFileVectors(),
    'ehditko.json': ehditkoVectors(),
  };
}

export const serialize = (value: unknown): string => `${JSON.stringify(value, null, 1)}\n`;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const directory = path.dirname(path.resolve(process.argv[1]));
  for (const [name, content] of Object.entries(buildVectors())) {
    fs.writeFileSync(path.join(directory, name), serialize(content));
    console.log(name, `${(fs.statSync(path.join(directory, name)).size / 1024).toFixed(1)} KB`);
  }
}
