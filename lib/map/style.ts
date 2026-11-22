import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import type { Locale } from '../i18n';

/**
 * The map's look, built from the design tokens of PLAN.md section 6. It is our own style on
 * OpenFreeMap's vector tiles (OpenMapTiles schema), not one of the tile host's ready styles:
 * the only green on the map is the lit cross, so parks are muted, and there are few labels.
 *
 * Spike (PLAN.md section 11, S1). Three variants:
 *   a  flat and calm: water, parks, three road weights, flat buildings.
 *   b  a, plus buildings in 3D from zoom 15, lit from the side the sun is really on.
 *   c  b, plus a sky for a pitched camera, in the colours of the first-visit sky.
 */

export type MapVariant = 'a' | 'b' | 'c';
export type MapPhase = 'day' | 'dusk' | 'night';

export interface MapPalette {
  land: string;
  water: string;
  park: string;
  building: string;
  buildingEdge: string;
  /** Roof and wall colour of 3D buildings before the light is applied. */
  building3d: string;
  major: string;
  /** Road casings exist in daylight only: at night the roads themselves are the lighter lines. */
  majorCasing?: string;
  minor: string;
  minorCasing?: string;
  path: string;
  rail: string;
  label: string;
  placeLabel: string;
  waterLabel: string;
}

/** PLAN.md section 6, "Map style": the light column. */
export const DAY: MapPalette = {
  land: '#ebf0f5',
  water: '#b9d2ea',
  park: '#dce7e0',
  building: '#dee5ed',
  buildingEdge: '#d2dbe5',
  building3d: '#e6ecf3',
  major: '#ffffff',
  majorCasing: '#c2cedc',
  minor: '#ffffff',
  minorCasing: '#d3dce7',
  path: '#ffffff',
  rail: '#c5d0de',
  label: '#55657d',
  placeLabel: '#45556e',
  waterLabel: '#6c8db5',
};

/** PLAN.md section 6, "Map style": the dark column. */
export const NIGHT: MapPalette = {
  land: '#0a192e',
  water: '#030c1a',
  park: '#0b1f31',
  building: '#0f2240',
  buildingEdge: '#132948',
  building3d: '#16305a',
  major: '#28456e',
  minor: '#1a3254',
  path: '#18304f',
  rail: '#1d3558',
  label: '#7b8fac',
  placeLabel: '#a9b8cc',
  waterLabel: '#3f5f8f',
};

function mix(a: string, b: string, t: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2].map((i) => Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * t).toString(16).padStart(2, '0')).join('')}`;
}

/** Blue hour: the night map with the sky's last light still on it. Roads have not yet become the lighter lines. */
export const DUSK: MapPalette = {
  land: mix(NIGHT.land, '#2f5ca6', 0.22),
  water: mix(NIGHT.water, '#0e2652', 0.55),
  park: mix(NIGHT.park, '#2f5ca6', 0.18),
  building: mix(NIGHT.building, '#3e5f96', 0.3),
  buildingEdge: mix(NIGHT.buildingEdge, '#3e5f96', 0.35),
  building3d: mix(NIGHT.building3d, '#6e86b4', 0.3),
  major: mix(NIGHT.major, '#8bbaec', 0.22),
  minor: mix(NIGHT.minor, '#8bbaec', 0.14),
  path: mix(NIGHT.path, '#8bbaec', 0.12),
  rail: mix(NIGHT.rail, '#8bbaec', 0.12),
  label: '#93a6c2',
  placeLabel: '#c3cfdf',
  waterLabel: '#5a7bab',
};

export const PALETTES: Record<MapPhase, MapPalette> = { day: DAY, dusk: DUSK, night: NIGHT };

export interface StyleOptions {
  variant: MapVariant;
  phase: MapPhase;
  /** Labels prefer this language where OpenStreetMap has the name in it. */
  locale: Locale;
  /** The sun at the map's centre, for the light on 3D buildings. */
  sun?: { altitude: number; azimuth: number };
  /** Sky colours for variant c, top to horizon: the first-visit sky of the same moment. */
  sky?: { top: string; horizon: string };
  /** Vector tiles (TileJSON) and label glyphs. Config, so the tile host can be swapped (PLAN.md, decision D6). */
  tiles?: string;
  glyphs?: string;
  /** Typeface stacks for labels, as named under the glyphs URL. */
  fonts?: { regular: string[]; strong: string[] };
}

export const OPENFREEMAP_TILES = 'https://tiles.openfreemap.org/planet';
/** Our own typeface on the map, served from our origin. */
export const OWN_GLYPHS = '/glyphs/{fontstack}/{range}.pbf';
export const OWN_FONTS = { regular: ['Atkinson Hyperlegible Next Regular'], strong: ['Atkinson Hyperlegible Next SemiBold'] };

const MAJOR = ['motorway', 'trunk', 'primary', 'secondary'];
const MINOR = ['tertiary', 'minor', 'service'];
const PATHS = ['path', 'pedestrian', 'track'];

const width = (stops: [number, number][]) => ['interpolate', ['exponential', 1.6], ['zoom'], ...stops.flat()] as unknown as number;

/** The light on 3D buildings. In daylight it comes from the sun's side; after sunset, cool and from above. */
function light(phase: MapPhase, sun: StyleOptions['sun']): StyleSpecification['light'] {
  if (!sun || sun.altitude <= 0) {
    return { anchor: 'map', position: [1.15, 0, 18], color: phase === 'night' ? '#8fa9d2' : '#b9cbe8', intensity: phase === 'night' ? 0.22 : 0.3 };
  }
  // The real azimuth. The height is kept above 25 degrees: lower than that and the roofs,
  // which are most of what a map shows, would go dark at northern noon in November.
  const polar = 90 - Math.max(sun.altitude, 25);
  return { anchor: 'map', position: [1.15, sun.azimuth, polar], color: '#fff6e8', intensity: 0.42 };
}

export function buildStyle(options: StyleOptions): StyleSpecification {
  const { variant, phase, locale, sun } = options;
  const c = PALETTES[phase];
  const fonts = options.fonts ?? OWN_FONTS;
  const flatOnly = variant === 'a';
  const name = ['coalesce', ['get', `name:${locale}`], ['get', 'name:latin'], ['get', 'name']] as unknown as string;
  const halo = { 'text-halo-color': c.land, 'text-halo-width': 1.4 };

  const road = (id: string, classes: string[], color: string, stops: [number, number][], minzoom: number): LayerSpecification => ({
    id,
    type: 'line',
    source: 'tiles',
    'source-layer': 'transportation',
    minzoom,
    filter: ['in', ['get', 'class'], ['literal', classes]],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': color, 'line-width': width(stops) },
  });

  // Widths at zoom 16 follow PLAN.md section 6: major 8.5 px, minor 4.2 px, paths 1.3 px.
  const major: [number, number][] = [[9, 0.6], [13, 2.6], [16, phase === 'day' ? 8.5 : 7.5], [19, 26]];
  const minor: [number, number][] = [[12, 0.4], [14, 1.4], [16, phase === 'day' ? 4.2 : 3.8], [19, 16]];
  const paths: [number, number][] = [[14, 0.5], [16, phase === 'day' ? 1.3 : 1.2], [19, 4]];
  const casing = (stops: [number, number][]) => stops.map(([zoom, w]) => [zoom, w + (zoom >= 15 ? 2 : 1.2)] as [number, number]);

  const layers: LayerSpecification[] = [
    { id: 'land', type: 'background', paint: { 'background-color': c.land } },
    {
      id: 'green',
      type: 'fill',
      source: 'tiles',
      'source-layer': 'landcover',
      filter: ['in', ['get', 'class'], ['literal', ['grass', 'wood']]],
      paint: { 'fill-color': c.park, 'fill-opacity': 0.7 },
    },
    { id: 'park', type: 'fill', source: 'tiles', 'source-layer': 'park', paint: { 'fill-color': c.park } },
    { id: 'water', type: 'fill', source: 'tiles', 'source-layer': 'water', filter: ['!=', ['get', 'brunnel'], 'tunnel'], paint: { 'fill-color': c.water } },
    {
      id: 'waterway',
      type: 'line',
      source: 'tiles',
      'source-layer': 'waterway',
      minzoom: 12,
      paint: { 'line-color': c.water, 'line-width': width([[12, 0.8], [16, 3], [19, 10]]) },
    },
    {
      id: 'building',
      type: 'fill',
      source: 'tiles',
      'source-layer': 'building',
      minzoom: 13,
      ...(flatOnly ? {} : { maxzoom: 15 }),
      paint: { 'fill-color': c.building, 'fill-outline-color': c.buildingEdge },
    },
    ...(c.minorCasing ? [road('minor-casing', MINOR, c.minorCasing, casing(minor), 13)] : []),
    ...(c.majorCasing ? [road('major-casing', MAJOR, c.majorCasing, casing(major), 9)] : []),
    road('path', PATHS, c.path, paths, 14),
    road('minor', MINOR, c.minor, minor, 12),
    road('major', MAJOR, c.major, major, 9),
    {
      id: 'rail',
      type: 'line',
      source: 'tiles',
      'source-layer': 'transportation',
      minzoom: 12,
      filter: ['==', ['get', 'class'], 'rail'],
      paint: { 'line-color': c.rail, 'line-width': width([[12, 0.6], [16, 1.6], [19, 4]]) },
    },
    ...(flatOnly
      ? []
      : [
          {
            id: 'building-3d',
            type: 'fill-extrusion',
            source: 'tiles',
            'source-layer': 'building',
            minzoom: 15,
            filter: ['!', ['has', 'hide_3d']],
            paint: {
              'fill-extrusion-color': c.building3d,
              'fill-extrusion-height': ['get', 'render_height'],
              'fill-extrusion-base': ['get', 'render_min_height'],
              'fill-extrusion-vertical-gradient': true,
              'fill-extrusion-opacity': 1,
            },
          } satisfies LayerSpecification,
        ]),
    {
      id: 'water-name',
      type: 'symbol',
      source: 'tiles',
      'source-layer': 'water_name',
      minzoom: 11,
      layout: { 'text-field': name, 'text-font': fonts.regular, 'text-size': 13, 'text-letter-spacing': 0.04, 'text-max-width': 6 },
      paint: { 'text-color': c.waterLabel, 'text-halo-color': c.water, 'text-halo-width': 1.2 },
    },
    {
      id: 'street-name',
      type: 'symbol',
      source: 'tiles',
      'source-layer': 'transportation_name',
      minzoom: 14,
      filter: ['in', ['get', 'class'], ['literal', [...MAJOR, ...MINOR, 'pedestrian']]],
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 420,
        'text-field': name,
        'text-font': fonts.regular,
        'text-size': ['interpolate', ['linear'], ['zoom'], 14, 11, 17, 13.5],
        'text-max-angle': 30,
      },
      paint: { 'text-color': c.label, ...halo },
    },
    {
      id: 'place-name',
      type: 'symbol',
      source: 'tiles',
      'source-layer': 'place',
      minzoom: 10,
      maxzoom: 16.5,
      filter: ['in', ['get', 'class'], ['literal', ['suburb', 'quarter', 'neighbourhood']]],
      layout: { 'text-field': name, 'text-font': fonts.strong, 'text-size': ['interpolate', ['linear'], ['zoom'], 11, 11.5, 16, 15], 'text-max-width': 7, 'text-padding': 18 },
      paint: { 'text-color': c.placeLabel, ...halo },
    },
    {
      id: 'city-name',
      type: 'symbol',
      source: 'tiles',
      'source-layer': 'place',
      maxzoom: 12,
      filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
      layout: { 'text-field': name, 'text-font': fonts.strong, 'text-size': ['interpolate', ['linear'], ['zoom'], 5, 12, 11, 17], 'text-max-width': 7 },
      paint: { 'text-color': c.placeLabel, ...halo },
    },
  ];

  return {
    version: 8,
    name: `map-${variant}-${phase}`,
    sources: { tiles: { type: 'vector', url: options.tiles ?? OPENFREEMAP_TILES } },
    glyphs: options.glyphs ?? OWN_GLYPHS,
    layers,
    ...(flatOnly ? {} : { light: light(phase, sun) }),
    ...(variant === 'c' && options.sky
      ? {
          sky: {
            'sky-color': options.sky.top,
            'horizon-color': options.sky.horizon,
            'fog-color': mix(c.land, options.sky.horizon, 0.45),
            'sky-horizon-blend': 0.7,
            'horizon-fog-blend': 0.55,
            'fog-ground-blend': 0.75,
            'atmosphere-blend': 0,
          },
        }
      : {}),
  };
}
