import { distanceMeters } from '../geo';
import { toScene } from '../live';
import type { SearchResult } from '../live';
import type { Position } from '../state';
import type { Hours, TilePharmacy } from '../tiles';
import type { Scene } from '../types';
import { MEASURED_RUNS } from './tiles';

/**
 * Where pharmacies take turns and no search covers the country: the centre of Athens as a
 * tile would carry it, on Monday 23 November 2026. Greece has opening hours for 7 % of its
 * pharmacies in OpenStreetMap, and its duty tables are each local association's own, so the
 * app has no lookup to hand over to: it says what the law says a closed door shows (PLAN.md
 * section 5). Names, streets and phone numbers are invented. Built into scenes through the
 * same code as the live app.
 */

const utc = (iso: string): number => Date.parse(iso) / 1000;

const ZONE = 'Europe/Athens';
/** Monday 23 November 2026, 00:00 in Athens. */
const WEEK_FROM = utc('2026-11-22T22:00:00Z');
const WEEK_UNTIL = WEEK_FROM + 8 * 86400;
const GENERATED = utc('2026-11-23T01:22:00Z');
/** Monday 20:41 in Athens: one pharmacy with hours is still open. */
const EVENING = utc('2026-11-23T18:41:00Z');
/** 22:40 the same evening. */
const NIGHT = utc('2026-11-23T20:40:00Z');

const CENTRE = { lat: 37.9755, lon: 23.7348 };
const HERE: Position = { source: 'device', ...CENTRE, accuracy: 20, approximate: false };

const at = (day: number, clock: string): number => WEEK_FROM + day * 86400 + Number(clock.slice(0, 2)) * 3600 + Number(clock.slice(3)) * 60;
const daily = (open: string, close: string): Hours => ({ kind: 'parsed', open: [0, 1, 2, 3, 4, 5, 6, 7].map((day) => ({ from: at(day, open), to: at(day, close) })), unknown: [] });
const MISSING: Hours = { kind: 'missing' };

function pharmacy(id: string, name: string | null, north: number, east: number, hours: Hours, more: Partial<TilePharmacy> = {}): TilePharmacy {
  return {
    id,
    name,
    lat: Math.round((CENTRE.lat + north / 111_320) * 1e5) / 1e5,
    lon: Math.round((CENTRE.lon + east / 87_750) * 1e5) / 1e5,
    city: 'Αθήνα',
    country: 'GR',
    zone: ZONE,
    generated: GENERATED,
    windowFrom: WEEK_FROM,
    windowUntil: WEEK_UNTIL,
    hours,
    ...more,
  };
}

/** Ten nearest: eight without hours, one closed since 20.30, one open until 22, 1.7 km away. */
const centre: TilePharmacy[] = [
  pharmacy('n601', 'Φαρμακείο Συντάγματος', 80, -90, MISSING, { street: 'Ερμού 12', phone: '+30 21 0000 0101' }),
  pharmacy('n602', null, -160, 150, MISSING, { street: 'Φιλελλήνων 9' }),
  pharmacy('n603', 'Φαρμακείο Πλάκα', -320, -130, MISSING, { street: 'Κυδαθηναίων 3', phone: '+30 21 0000 0103' }),
  pharmacy('n604', 'Φαρμακείο Κολωνάκι', 390, 200, daily('08:30', '20:30'), { street: 'Σκουφά 41', phone: '+30 21 0000 0104' }),
  pharmacy('n605', 'Φαρμακείο Μοναστηράκι', 230, -520, MISSING, { street: 'Αθηνάς 28' }),
  pharmacy('n606', 'Φαρμακείο Ζάππειο', -620, 340, MISSING, { street: 'Βασιλίσσης Όλγας 7' }),
  pharmacy('n607', 'Φαρμακείο Ομόνοια', 740, -660, MISSING, { street: 'Σταδίου 60' }),
  pharmacy('n608', 'Φαρμακείο Εξάρχεια', 990, -310, MISSING, { street: 'Θεμιστοκλέους 15' }),
  pharmacy('n609', 'Φαρμακείο Κουκάκι', -1500, -800, daily('08:00', '22:00'), { street: 'Βεΐκου 2', phone: '+30 21 0000 0109' }),
  pharmacy('n610', 'Φαρμακείο Παγκράτι', -700, 2300, MISSING, { street: 'Υμηττού 18' }),
];

/** The country's share of pharmacies with opening hours, as index.json gives it. */
const GREECE = { country: 'GR', share: Math.round((MEASURED_RUNS.GR[1] / MEASURED_RUNS.GR[0]) * 10000) / 10000 };

function scene(pharmacies: TilePharmacy[], now: number): Scene {
  const candidates = pharmacies.map((p) => ({ pharmacy: p, meters: distanceMeters(CENTRE, p) })).sort((a, b) => a.meters - b.meters);
  const result: SearchResult = { candidates, missing: [], hoursListed: GREECE };
  // Fixtures name the prescription's country themselves: here someone at home, so no banner joins the card.
  return { ...toScene({ position: HERE, result, now, deviceZone: ZONE }), home: 'GR' };
}

/** The only pharmacy known to be open is 1.7 km away, past seven whose hours aren't known. */
export const athens: Scene = scene(centre, EVENING);
/** A night in a neighbourhood whose pharmacies all have hours, and all have closed. */
export const athensNight: Scene = scene(
  centre.map((p) => ({ ...p, hours: daily('08:00', '21:00') })),
  NIGHT,
);
