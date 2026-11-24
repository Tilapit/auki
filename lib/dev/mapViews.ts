/**
 * The map as built (M4), on real tiles: two cities at three fixed moments, each in the light
 * and in the dark theme. Plain data, so a screenshot script can import it without touching a
 * component. Nothing here reads the clock; the tiles do come from the map tile host, which is
 * why these views live under /dev/map and not in /dev/states.
 */
import type { AreaFeature, AreaLayer } from '../map/area';
import type { GlyphState } from '../types';

export type MapCity = 'helsinki' | 'riga';
export type MapMoment = 'noon' | 'dusk' | 'night';

export const MAP_CITIES: { id: MapCity; title: string }[] = [
  { id: 'helsinki', title: 'Helsinki' },
  { id: 'riga', title: 'Riga' },
];

/** Fixed moments, so the sun is the same in every screenshot. */
export const MAP_MOMENTS: { id: MapMoment; title: string; at: string; note: string }[] = [
  { id: 'noon', title: 'Noon, 19 Nov', at: '2026-11-19T10:00:00Z', note: 'The sun is up, ten degrees above the horizon in Helsinki.' },
  { id: 'dusk', title: 'Dusk, 19 Nov 16.10', at: '2026-11-19T14:10:00Z', note: 'The sun has just set: there is still light in the sky.' },
  { id: 'night', title: 'Night, 19 Nov 20.41', at: '2026-11-19T18:41:00Z', note: 'No light left in the sky.' },
];

/** Zoom levels that show the buildings before, while and after they rise. */
export const MAP_ZOOMS = [13.5, 15.3, 16.5];

export interface MapPreviewView {
  id: string;
  city: MapCity;
  moment: MapMoment;
}

/**
 * Invented pharmacies around a place, for judging the map's own signs (lib/map/area.ts) in
 * every light: 160 points within about six kilometres, denser towards the middle, the same
 * every time. They are not real, and some stand in the sea. How many are open follows the
 * moment: most at noon, a third at dusk, a few at night.
 */
export function inventedArea(center: { lat: number; lon: number }, moment: MapMoment): AreaLayer {
  let seed = 20261124;
  const random = () => {
    // A small generator with a fixed seed: the same scatter in every screenshot.
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  const open = { noon: 0.72, dusk: 0.34, night: 0.06 }[moment];
  const features: AreaFeature[] = [];
  for (let index = 0; index < 160; index++) {
    const far = 400 + 5600 * random() ** 1.6;
    const turn = random() * Math.PI * 2;
    const dice = random();
    const glyph: GlyphState = dice < open ? 'open' : dice < open + 0.05 ? 'soon' : dice < 0.86 ? 'closed' : 'unknown';
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [center.lon + (Math.sin(turn) * far) / (111_320 * Math.cos((center.lat * Math.PI) / 180)), center.lat + (Math.cos(turn) * far) / 110_574] },
      properties: { id: `invented-${index}`, glyph, rank: { open: 0, soon: 1, unknown: 2, closed: 3 }[glyph] },
    });
  }
  return { key: `invented/${moment}`, data: { type: 'FeatureCollection', features } };
}

export const mapViews: MapPreviewView[] = MAP_CITIES.flatMap((city) => MAP_MOMENTS.map((moment) => ({ id: `${city.id}-${moment.id}`, city: city.id, moment: moment.id })));
