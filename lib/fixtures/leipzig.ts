import { distanceMeters } from '../geo';
import { toScene } from '../live';
import type { SearchResult } from '../live';
import type { Position } from '../state';
import type { Hours, TilePharmacy } from '../tiles';
import type { Scene } from '../types';

/**
 * Where pharmacies take turns at night: the centre of Leipzig as a tile would carry it, on
 * Monday 23 November 2026 at 22.40. Every pharmacy nearby has closed for the day, and the one
 * on duty tonight is in none of these opening hours: only the country's own lookup knows it
 * (PLAN.md section 5). Names, streets and phone numbers are invented. Built into scenes
 * through the same code as the live app.
 */

const utc = (iso: string): number => Date.parse(iso) / 1000;

const ZONE = 'Europe/Berlin';
/** Monday 23 November 2026, 00:00 in Berlin. */
const WEEK_FROM = utc('2026-11-22T23:00:00Z');
const WEEK_UNTIL = WEEK_FROM + 8 * 86400;
const GENERATED = utc('2026-11-23T01:22:00Z');
/** Monday 22:40 in Leipzig. */
export const LEIPZIG_NIGHT = utc('2026-11-23T21:40:00Z');

const CENTRE = { lat: 51.3397, lon: 12.3731 };
const HERE: Position = { source: 'device', ...CENTRE, accuracy: 20, approximate: false };

const at = (day: number, clock: string): number => WEEK_FROM + day * 86400 + Number(clock.slice(0, 2)) * 3600 + Number(clock.slice(3)) * 60;
const daily = (open: string, close: string): Hours => ({ kind: 'parsed', open: [0, 1, 2, 3, 4, 5, 6, 7].map((day) => ({ from: at(day, open), to: at(day, close) })), unknown: [] });
const ALWAYS: Hours = { kind: 'parsed', open: [{ from: WEEK_FROM, to: WEEK_UNTIL }], unknown: [] };

function pharmacy(id: string, name: string, north: number, east: number, hours: Hours, more: Partial<TilePharmacy> = {}): TilePharmacy {
  return {
    id,
    name,
    lat: Math.round((CENTRE.lat + north / 111_320) * 1e5) / 1e5,
    lon: Math.round((CENTRE.lon + east / 69_540) * 1e5) / 1e5,
    city: 'Leipzig',
    country: 'DE',
    zone: ZONE,
    generated: GENERATED,
    windowFrom: WEEK_FROM,
    windowUntil: WEEK_UNTIL,
    hours,
    ...more,
  };
}

/** Ten nearest, all closed by 20: the first ones open again at 8. */
const centre: TilePharmacy[] = [
  pharmacy('n501', 'Apotheke am Markt', 110, -70, daily('08:00', '19:00'), { street: 'Markt 14', phone: '+49 341 000 0101' }),
  pharmacy('n502', 'Linden-Apotheke', -190, 150, daily('08:00', '18:30'), { street: 'Lindenweg 3' }),
  pharmacy('n503', 'Apotheke am Park', 300, 260, daily('08:30', '18:30'), { street: 'Parkstraße 21', phone: '+49 341 000 0103' }),
  pharmacy('n504', 'Sonnen-Apotheke', -420, -310, daily('08:00', '20:00'), { street: 'Sonnenallee 8' }),
  pharmacy('n505', 'Brunnen-Apotheke', 560, -380, daily('09:00', '18:00'), { street: 'Brunnenplatz 2' }),
  pharmacy('n506', 'Rosen-Apotheke', -640, 520, daily('08:00', '18:30'), { street: 'Rosengasse 17' }),
  pharmacy('n507', 'Apotheke am Bahnhof', 880, 420, daily('08:00', '20:00'), { street: 'Bahnhofsplatz 5', phone: '+49 341 000 0107' }),
  pharmacy('n508', 'Neue Apotheke', -960, -720, daily('08:30', '18:30'), { street: 'Neue Straße 40' }),
  pharmacy('n509', 'Garten-Apotheke', 1240, -910, daily('08:00', '18:00'), { street: 'Gartenweg 11' }),
  pharmacy('n510', 'Apotheke an der Brücke', -1480, 1130, daily('08:00', '19:00'), { street: 'Brückenstraße 6' }),
];

/** Open round the clock, 8.4 km away in the next town: what the wider search can find from opening hours. */
const farAway = pharmacy('n520', 'Apotheke am Klinikum', -7900, 1900, ALWAYS, { city: 'Markkleeberg', street: 'Klinikstraße 1', phone: '+49 341 000 0120' });

function scene(pharmacies: TilePharmacy[], more: Partial<SearchResult> = {}): Scene {
  const found = (p: TilePharmacy) => ({ pharmacy: p, meters: distanceMeters(CENTRE, p) });
  const candidates = pharmacies.map(found).sort((a, b) => a.meters - b.meters);
  const result: SearchResult = { candidates, missing: [], ...more };
  // Fixtures name the prescription's country themselves: here someone at home, so no banner joins the card.
  return { ...toScene({ position: HERE, result, now: LEIPZIG_NIGHT, deviceZone: ZONE }), home: 'DE' };
}

/** Nothing is open within 30 km, as far as opening hours can say. */
export const leipzigNothingOpen: Scene = scene(centre);
/** The wider search finds one that is open round the clock, 8.4 km away. */
export const leipzigFarOpen: Scene = scene(centre, { farOpen: { pharmacy: farAway, meters: distanceMeters(CENTRE, farAway) } });
/** One nearby pharmacy is open until midnight, past six that have closed: our answer stays first. */
export const leipzigOneOpen: Scene = scene(centre.map((p) => (p.id === 'n507' ? { ...p, hours: daily('08:00', '24:00') } : p)));
