import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import type { Locale } from '../i18n';
import { NO_AREA } from './area.ts';
import type { AreaData } from './area.ts';

/**
 * The map's look, built from the design tokens of PLAN.md section 6. It is our own style on
 * OpenFreeMap's vector tiles (OpenMapTiles schema), not one of the tile host's ready styles:
 * the only green on the map is the lit cross, so parks are muted, and there are few labels.
 *
 * Chosen from the spike (S1): top-down only, flat and calm at overview zooms, and from about
 * zoom 15 the buildings rise in 3D, lit from the side the sun is really on.
 *
 * The device theme picks light or dark, as everywhere else in the app. The sun never changes
 * the theme. It moves the light on the buildings, and in the dark theme it sets how deep
 * the dark is: `DUSK` while there is still light in the sky, `NIGHT` after it.
 */

export type MapTheme = 'light' | 'dark';

export interface MapPalette {
  land: string;
  water: string;
  park: string;
  building: string;
  buildingEdge: string;
  /** Roof and wall colour of 3D buildings before the light is applied. */
  building3d: string;
  major: string;
  /** Road casings exist in the light theme only: in the dark the roads themselves are the lighter lines. */
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
  building3d: '#eef2f7',
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
  building3d: '#132a4d',
  major: '#28456e',
  minor: '#1a3254',
  path: '#18304f',
  rail: '#1d3558',
  label: '#7b8fac',
  placeLabel: '#a9b8cc',
  waterLabel: '#3f5f8f',
};

/**
 * The dark theme while there is light in the sky: the blue of the first-visit twilight, a
 * clear step lighter than night. Water is the darkest thing on it, as it is at that hour.
 */
export const DUSK: MapPalette = {
  land: '#1b3763',
  water: '#0d2450',
  park: '#1a3d62',
  building: '#234273',
  buildingEdge: '#2b4b7f',
  building3d: '#2a4a7e',
  major: '#4668a2',
  minor: '#31528a',
  path: '#2c4b80',
  rail: '#2f4d80',
  label: '#a9bad3',
  placeLabel: '#d3ddeb',
  waterLabel: '#6c8ec2',
};

function mix(a: string, b: string, t: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2].map((i) => Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * t).toString(16).padStart(2, '0')).join('')}`;
}

/** Sun altitudes, in degrees, between which the dark map goes from dusk to night. */
export const DUSK_UNTIL = -4;
export const NIGHT_FROM = -8;
const STEPS = 4;

/**
 * How far into the night the dark map is: 0 while there is light in the sky, 1 once it is
 * gone, and a few steps between, so the map never jumps from one to the other.
 */
export function nightShare(sunAltitude: number): number {
  const share = (DUSK_UNTIL - sunAltitude) / (DUSK_UNTIL - NIGHT_FROM);
  return Math.round(Math.min(1, Math.max(0, share)) * STEPS) / STEPS;
}

/** The colours for a theme and a sun. Without a sun the dark theme is night. */
export function paletteFor(theme: MapTheme, sunAltitude?: number): MapPalette {
  if (theme === 'light') return DAY;
  const share = sunAltitude === undefined ? 1 : nightShare(sunAltitude);
  if (share === 1) return NIGHT;
  if (share === 0) return DUSK;
  const keys = Object.keys(NIGHT) as (keyof MapPalette)[];
  return Object.fromEntries(keys.map((key) => [key, mix(DUSK[key]!, NIGHT[key]!, share)])) as unknown as MapPalette;
}

export interface StyleOptions {
  theme: MapTheme;
  /** Labels prefer this language where OpenStreetMap has the name in it. */
  locale: Locale;
  /** The sun at the map's centre: the light on the 3D buildings, and dusk or night in the dark theme. */
  sun?: { altitude: number; azimuth: number };
  /** Vector tiles (TileJSON) and label glyphs. Config, so the tile host can be swapped (PLAN.md, decision D6). */
  tiles?: string;
  glyphs?: string;
  /** Typeface stacks for labels, as named under the glyphs URL. */
  fonts?: { regular: string[]; strong: string[] };
  /** The pharmacies of the area layer. Left out, the layer starts empty and the map is given them afterwards. */
  area?: AreaData;
}

/** The pharmacies beyond the list (lib/map/area.ts): one source of points, one layer of small signs. */
export const AREA_SOURCE = 'area';
export const AREA_LAYER = 'area-pharmacies';
/** The name of a sign's picture. The map asks for it when it first needs it; MapView draws it in the theme's colours. */
export const AREA_ICON = 'pharmacy-';

export const OPENFREEMAP_TILES = 'https://tiles.openfreemap.org/planet';
/** Our own typeface on the map, served from our origin. */
export const OWN_GLYPHS = '/glyphs/{fontstack}/{range}.pbf';
export const OWN_FONTS = { regular: ['Atkinson Hyperlegible Next Regular'], strong: ['Atkinson Hyperlegible Next SemiBold'] };

/** The buildings start to rise here and stand at full height a little over half a zoom level on. */
export const RISE_FROM = 15;
export const RISE_UNTIL = 15.6;

const MAJOR = ['motorway', 'trunk', 'primary', 'secondary'];
const MINOR = ['tertiary', 'minor', 'service'];
const PATHS = ['path', 'pedestrian', 'track'];

const width = (stops: [number, number][]) => ['interpolate', ['exponential', 1.6], ['zoom'], ...stops.flat()] as unknown as number;

/**
 * The light on 3D buildings. With the sun up it comes from the side the sun is really on;
 * after sunset it is dim and from straight above. The light itself is always white: a
 * coloured light tints the dark palettes (MapLibre adds a floor of the complementary colour),
 * and the coolness of dusk and night is already in the building colours.
 */
export function lightFor(theme: MapTheme, sun: StyleOptions['sun']): NonNullable<StyleSpecification['light']> {
  if (!sun || sun.altitude <= 0) {
    const night = theme === 'dark' && (!sun || nightShare(sun.altitude) === 1);
    return { anchor: 'map', position: [1.15, 0, 12], color: '#ffffff', intensity: night ? 0.16 : 0.22 };
  }
  // The real azimuth. The height is kept above 55 degrees: lower than that and the roofs,
  // which are most of what a map shows, go grey. At northern noon in November the sun is at 10.
  const polar = 90 - Math.max(sun.altitude, 55);
  return { anchor: 'map', position: [1.15, Math.round(sun.azimuth), polar], color: '#ffffff', intensity: theme === 'light' ? 0.3 : 0.24 };
}

export function buildStyle(options: StyleOptions): StyleSpecification {
  const { theme, locale, sun } = options;
  const c = paletteFor(theme, sun?.altitude);
  const light = theme === 'light';
  const fonts = options.fonts ?? OWN_FONTS;
  const name = ['coalesce', ['get', `name:${locale}`], ['get', 'name:latin'], ['get', 'name']] as unknown as string;
  const halo = { 'text-halo-color': c.land, 'text-halo-width': 1.4 };

  // Tunnels are left out: underground corridors and metro passages draw a mesh over a city centre.
  const road = (id: string, classes: string[], color: string, stops: [number, number][], minzoom: number): LayerSpecification => ({
    id,
    type: 'line',
    source: 'tiles',
    'source-layer': 'transportation',
    minzoom,
    filter: [
      'all',
      ['in', ['get', 'class'], ['literal', classes]],
      ['!=', ['get', 'brunnel'], 'tunnel'],
      ['!', ['in', ['get', 'subclass'], ['literal', ['platform', 'steps', 'corridor']]]],
      ['==', ['geometry-type'], 'LineString'],
    ],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': color, 'line-width': width(stops) },
  });

  // Widths at zoom 16 follow PLAN.md section 6: major 8.5 px, minor 4.2 px, paths 1.3 px.
  const major: [number, number][] = [[9, 0.6], [13, 2.6], [16, light ? 8.5 : 7.5], [19, 26]];
  const minor: [number, number][] = [[12, 0.4], [14, 1.4], [16, light ? 4.2 : 3.8], [19, 16]];
  const paths: [number, number][] = [[14, 0.5], [16, light ? 1.3 : 1.2], [19, 4]];
  const casing = (stops: [number, number][]) => stops.map(([zoom, w]) => [zoom, w + (zoom >= 15 ? 2 : 1.2)] as [number, number]);
  // From nothing to the building's own height, between the two zooms.
  const rising = (property: string) => ['interpolate', ['linear'], ['zoom'], RISE_FROM, 0, RISE_UNTIL, ['get', property]] as unknown as number;

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
    // The flat footprints stay under the 3D ones, so nothing pops when those fade in.
    {
      id: 'building',
      type: 'fill',
      source: 'tiles',
      'source-layer': 'building',
      minzoom: 13,
      paint: { 'fill-color': c.building, 'fill-outline-color': c.buildingEdge },
    },
    ...(c.minorCasing ? [road('minor-casing', MINOR, c.minorCasing, casing(minor), 13)] : []),
    ...(c.majorCasing ? [road('major-casing', MAJOR, c.majorCasing, casing(major), 9)] : []),
    road('path', PATHS, c.path, paths, 15),
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
    {
      id: 'building-3d',
      type: 'fill-extrusion',
      source: 'tiles',
      'source-layer': 'building',
      minzoom: RISE_FROM,
      filter: ['!', ['has', 'hide_3d']],
      paint: {
        'fill-extrusion-color': c.building3d,
        'fill-extrusion-height': rising('render_height'),
        'fill-extrusion-base': rising('render_min_height'),
        'fill-extrusion-vertical-gradient': true,
        // Height carries the change; the opacity only keeps the first frame from popping.
        'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], RISE_FROM, 0, RISE_FROM + 0.4, 1],
      },
    },
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
    // Every pharmacy on the tiles the device holds, above the labels: a street name gives way to a pharmacy.
    // Signs that would overlap are thinned out, the open ones last, so a whole city stays readable.
    {
      id: AREA_LAYER,
      type: 'symbol',
      source: AREA_SOURCE,
      layout: {
        'icon-image': ['concat', AREA_ICON, ['get', 'glyph']],
        'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.5, 12, 0.75, 14.5, 1],
        'icon-padding': 1,
        'symbol-sort-key': ['get', 'rank'],
      },
    },
  ];

  return {
    version: 8,
    name: `map-${theme}`,
    sources: { tiles: { type: 'vector', url: options.tiles ?? OPENFREEMAP_TILES }, [AREA_SOURCE]: { type: 'geojson', data: options.area ?? NO_AREA } },
    glyphs: options.glyphs ?? OWN_GLYPHS,
    layers,
    light: lightFor(theme, sun),
  };
}

/**
 * What decides the style, as one string: the map is restyled only when this changes, not on
 * every minute's tick. The sun's direction counts in steps of ten degrees.
 */
export function styleKey({ theme, locale, sun }: Pick<StyleOptions, 'theme' | 'locale' | 'sun'>): string {
  if (!sun) return `${theme}/${locale}`;
  const up = sun.altitude > 0;
  return [theme, locale, theme === 'dark' ? nightShare(sun.altitude) : '', up ? Math.round(sun.azimuth / 10) : 'down', up ? Math.round(Math.max(sun.altitude, 55) / 5) : ''].join('/');
}

export interface StyleChange {
  kind: 'paint' | 'layout';
  layer: string;
  property: string;
  /** undefined puts the property back to its default. */
  value: unknown;
}

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * What it takes to turn one of our styles into another without building the map again: the
 * properties that differ, layer by layer. A new sun or a new step of dusk is a handful of
 * colours and the light; the tiles, the layers and everything already drawn stay.
 *
 * Undefined when the two don't have the same layers (the light theme has road casings, the
 * dark one doesn't): then the style has to be set as a whole.
 */
export function styleChanges(before: StyleSpecification, after: StyleSpecification): StyleChange[] | undefined {
  if (before.layers.length !== after.layers.length || before.glyphs !== after.glyphs || !same(before.sources.tiles, after.sources.tiles)) return undefined;
  const changes: StyleChange[] = [];
  for (let index = 0; index < after.layers.length; index++) {
    const from = before.layers[index] as unknown as Record<string, unknown>;
    const to = after.layers[index] as unknown as Record<string, unknown>;
    if (['id', 'type', 'source', 'source-layer', 'minzoom', 'maxzoom', 'filter'].some((key) => !same(from[key], to[key]))) return undefined;
    for (const kind of ['paint', 'layout'] as const) {
      const old = (from[kind] ?? {}) as Record<string, unknown>;
      const next = (to[kind] ?? {}) as Record<string, unknown>;
      for (const property of new Set([...Object.keys(old), ...Object.keys(next)])) {
        if (!same(old[property], next[property])) changes.push({ kind, layer: String(to.id), property, value: next[property] });
      }
    }
  }
  return changes;
}
