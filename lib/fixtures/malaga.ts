import { distanceMeters } from '../geo';
import { toScene } from '../live';
import type { SearchResult } from '../live';
import type { Position } from '../state';
import type { Hours, TilePharmacy } from '../tiles';
import type { Scene } from '../types';
import { RUN_OF_23_NOV } from './tiles';

/**
 * Where most pharmacies have no opening hours in OpenStreetMap: the centre of Málaga as a
 * tile would carry it, on Monday 23 November 2026. In Spain 18 % of pharmacies have hours
 * there (the pipeline's run of that day), so most rows read "Aukioloaikoja ei ole merkitty".
 * Names and phone numbers are invented. Built into scenes through the same code as the live app.
 */

const utc = (iso: string): number => Date.parse(iso) / 1000;

const ZONE = 'Europe/Madrid';
/** Monday 23 November 2026, 00:00 in Madrid. */
const WEEK_FROM = utc('2026-11-22T23:00:00Z');
const WEEK_UNTIL = WEEK_FROM + 8 * 86400;
const GENERATED = utc('2026-11-23T01:22:00Z');
/** Monday 20:41 in Málaga: one pharmacy with hours is still open. */
export const MALAGA_EVENING = utc('2026-11-23T19:41:00Z');
/** 22:30 the same evening: it has closed too. */
export const MALAGA_LATE = utc('2026-11-23T21:30:00Z');

const CENTRE = { lat: 36.72016, lon: -4.42034 };
const HERE: Position = { source: 'device', ...CENTRE, accuracy: 20, approximate: false };

const at = (day: number, clock: string): number => WEEK_FROM + day * 86400 + Number(clock.slice(0, 2)) * 3600 + Number(clock.slice(3)) * 60;
const daily = (open: string, close: string): Hours => ({ kind: 'parsed', open: [0, 1, 2, 3, 4, 5, 6, 7].map((day) => ({ from: at(day, open), to: at(day, close) })), unknown: [] });
const MISSING: Hours = { kind: 'missing' };

function pharmacy(id: string, name: string | null, north: number, east: number, hours: Hours, more: Partial<TilePharmacy> = {}): TilePharmacy {
  return {
    id,
    name,
    lat: Math.round((CENTRE.lat + north / 111_320) * 1e5) / 1e5,
    lon: Math.round((CENTRE.lon + east / 89_200) * 1e5) / 1e5,
    city: 'Málaga',
    country: 'ES',
    zone: ZONE,
    generated: GENERATED,
    windowFrom: WEEK_FROM,
    windowUntil: WEEK_UNTIL,
    hours,
    ...more,
  };
}

/** Ten nearest: eight without hours we can read, one closed since 20.30, one open until 22, 1.9 km away. */
const centre: TilePharmacy[] = [
  pharmacy('n301', 'Farmacia Alameda', 90, -80, MISSING, { street: 'Alameda Principal 12', phone: '+34 952 000 101' }),
  pharmacy('n302', null, -150, 170, MISSING, { street: 'Calle Nueva 9' }),
  pharmacy('n303', 'Farmacia del Puerto', -310, -140, MISSING, { street: 'Calle Córdoba 3', phone: '+34 952 000 103' }),
  pharmacy('n304', 'Farmacia Santa Lucía', 380, 190, daily('09:30', '20:30'), { street: 'Calle Granada 41', phone: '+34 952 000 104' }),
  pharmacy('n305', 'Farmacia Central', 240, -510, MISSING, { street: 'Calle Carretería 28' }),
  pharmacy('n306', 'Farmacia La Merced', 610, 350, MISSING, { street: 'Plaza de la Merced 7' }),
  pharmacy('n307', 'Farmacia Victoria', 720, 670, { kind: 'unparseable', raw: 'mañanas y tardes' }, { street: 'Calle Victoria 60' }),
  pharmacy('n308', 'Farmacia Trinidad', 880, -960, MISSING, { street: 'Calle Trinidad 15' }),
  pharmacy('n309', 'Farmacia Estación', -900, -1670, daily('09:00', '22:00'), { street: 'Explanada de la Estación 2', phone: '+34 952 000 109' }),
  pharmacy('n310', 'Farmacia El Limonar', 900, 2400, MISSING, { street: 'Paseo del Limonar 18' }),
];

/** The country's share of pharmacies with opening hours, as index.json gives it. */
const SPAIN = { country: 'ES', share: Math.round((RUN_OF_23_NOV.ES[1] / RUN_OF_23_NOV.ES[0]) * 10000) / 10000 };

function scene(pharmacies: TilePharmacy[], now: number): Scene {
  const candidates = pharmacies.map((p) => ({ pharmacy: p, meters: distanceMeters(CENTRE, p) })).sort((a, b) => a.meters - b.meters);
  const result: SearchResult = { candidates, missing: [], hoursListed: SPAIN };
  // Fixtures name the prescription's country themselves: the live app takes it from the device.
  return { ...toScene({ position: HERE, result, now, deviceZone: ZONE }), home: 'FI' };
}

/** The proposal's case: the only pharmacy known to be open is 1.9 km away, past seven whose hours aren't known. */
export const malaga: Scene = scene(centre, MALAGA_EVENING);
/** Later the same evening no pharmacy is known to be open, and of eight of the ten nothing can be said. */
export const malagaLate: Scene = scene(centre, MALAGA_LATE);
/** The nearest one has no phone number in OpenStreetMap either. */
export const malagaNoPhone: Scene = scene(centre.slice(1), MALAGA_EVENING);
/** The pharmacy known to be open is 220 m past the nearest: it leads as before, and the card says what lies nearer. */
export const malagaNear: Scene = scene(
  centre.map((p) => (p.id === 'n303' ? { ...p, hours: daily('09:00', '22:00') } : p)),
  MALAGA_EVENING,
);
