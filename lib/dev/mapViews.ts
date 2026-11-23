import type { MapPhase, MapVariant } from '../map/style';

/**
 * The map spike (PLAN.md section 11, S1): three variants, three moments, two cities.
 * Plain data, so the screenshot script can import it without touching a component.
 */
export type MapCity = 'helsinki' | 'riga';

export const MAP_CITIES: MapCity[] = ['helsinki', 'riga'];
export const MAP_VARIANTS: { id: MapVariant; title: string; note: string }[] = [
  { id: 'a', title: 'A: flat and calm', note: 'Water, parks, three road weights, flat buildings, few labels.' },
  { id: 'b', title: 'B: lit buildings', note: 'A, plus buildings in 3D from zoom 15, lit from the side the sun is really on.' },
  { id: 'c', title: 'C: pitched, with a sky', note: 'B, plus a pitched camera and a sky in the colours of the first-visit sky.' },
];

/** Fixed moments, so the sun and the sky are the same in every screenshot. Nothing here reads the clock. */
export const MAP_PHASES: { id: MapPhase; title: string; at: string }[] = [
  { id: 'day', title: 'Day, 19 Nov, local noon', at: '2026-11-19T10:00:00Z' },
  { id: 'dusk', title: 'Dusk, 19 Nov 16.10', at: '2026-11-19T14:10:00Z' },
  { id: 'night', title: 'Night, 19 Nov 20.41', at: '2026-11-19T18:41:00Z' },
];

export interface MapView {
  id: string;
  city: MapCity;
  variant: MapVariant;
  phase: MapPhase;
}

export const mapViews: MapView[] = MAP_CITIES.flatMap((city) =>
  MAP_VARIANTS.flatMap((variant) => MAP_PHASES.map((phase) => ({ id: `${city}-${variant.id}-${phase.id}`, city, variant: variant.id, phase: phase.id }))),
);
