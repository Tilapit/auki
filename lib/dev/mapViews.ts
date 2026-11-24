/**
 * The map as built (M4), on real tiles: two cities at three fixed moments, each in the light
 * and in the dark theme. Plain data, so a screenshot script can import it without touching a
 * component. Nothing here reads the clock; the tiles do come from the map tile host, which is
 * why these views live under /dev/map and not in /dev/states.
 */
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

export const mapViews: MapPreviewView[] = MAP_CITIES.flatMap((city) => MAP_MOMENTS.map((moment) => ({ id: `${city.id}-${moment.id}`, city: city.id, moment: moment.id })));
