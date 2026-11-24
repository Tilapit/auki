import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import { describe, expect, it } from 'vitest';
import { MONDAY_EVENING, kamppi } from '@/lib/fixtures/tiles';
import { areaLayer } from '@/lib/map/area';
import { AREA_LAYER, AREA_SOURCE, buildStyle, DAY, DUSK, lightFor, NIGHT, NO_ROUTE, nightShare, paletteFor, RISE_FROM, RISE_UNTIL, ROUTE_LAYER, ROUTE_SOURCE, ROUTE_UNDER_LAYER, routeData, styleChanges, styleKey, type MapTheme } from '@/lib/map/style';

const themes: MapTheme[] = ['light', 'dark'];
const suns = { noon: { altitude: 10.4, azimuth: 178.65 }, dusk: { altitude: -3.5, azimuth: 236 }, night: { altitude: -35, azimuth: 295 } };

describe('buildStyle', () => {
  it.each(themes.flatMap((theme) => Object.keys(suns).map((moment) => [theme, moment] as const)))('%s theme, %s: a valid MapLibre style', (theme, moment) => {
    const style = buildStyle({ theme, locale: 'fi', sun: suns[moment as keyof typeof suns] });
    expect(validateStyleMin(style).map((error) => error.message)).toEqual([]);
  });

  it('takes its colours from the map tokens of PLAN.md section 6', () => {
    expect(DAY).toMatchObject({ land: '#ebf0f5', water: '#b9d2ea', park: '#dce7e0', major: '#ffffff', majorCasing: '#c2cedc', label: '#55657d' });
    expect(NIGHT).toMatchObject({ land: '#0a192e', water: '#030c1a', park: '#0b1f31', major: '#28456e', minor: '#1a3254', label: '#7b8fac' });
  });

  it('is flat from afar and raises the buildings from zoom 15, top-down, without a sky', () => {
    const style = buildStyle({ theme: 'light', locale: 'fi', sun: suns.noon });
    const flat = style.layers.find((layer) => layer.id === 'building');
    const raised = style.layers.find((layer) => layer.type === 'fill-extrusion');
    expect(flat?.minzoom).toBe(13);
    expect(raised?.minzoom).toBe(RISE_FROM);
    // The height grows from nothing: at zoom 15 the map is still the flat one.
    expect(JSON.stringify(raised?.paint)).toContain(`["interpolate",["linear"],["zoom"],${RISE_FROM},0,${RISE_UNTIL},["get","render_height"]]`);
    expect(style.sky).toBeUndefined();
  });

  it('asks for labels in the UI language first, and stays small', () => {
    const style = buildStyle({ theme: 'light', locale: 'en', sun: suns.noon });
    expect(JSON.stringify(style)).toContain('name:en');
    // The whole style travels inside the JavaScript: keep it a few kilobytes.
    expect(JSON.stringify(style).length).toBeLessThan(8000);
  });
});

describe('the sun and the theme', () => {
  it('never lets the sun change the theme: the light theme is day at any hour', () => {
    for (const sun of Object.values(suns)) expect(paletteFor('light', sun.altitude)).toBe(DAY);
  });

  it('gives the dark theme dusk while there is light in the sky, and night after it', () => {
    expect(paletteFor('dark', suns.noon.altitude)).toBe(DUSK);
    expect(paletteFor('dark', suns.dusk.altitude)).toBe(DUSK);
    expect(paletteFor('dark', suns.night.altitude)).toBe(NIGHT);
    // Without a sun (the fixtures of /dev/states) the dark theme is the night of PLAN.md.
    expect(paletteFor('dark')).toBe(NIGHT);
  });

  it('goes from dusk to night in steps, never in one jump', () => {
    const shares = [-3, -4, -5, -6, -7, -8, -9].map(nightShare);
    expect(shares).toEqual([0, 0, 0.25, 0.5, 0.75, 1, 1]);
    const between = paletteFor('dark', -6);
    expect(between.land).not.toBe(DUSK.land);
    expect(between.land).not.toBe(NIGHT.land);
  });

  it('keeps dusk and night clearly apart: the ground differs by more than a few shades', () => {
    const luminance = (hex: string) => [0, 1, 2].reduce((sum, i) => sum + parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) * [0.2126, 0.7152, 0.0722][i], 0);
    expect(luminance(DUSK.land) - luminance(NIGHT.land)).toBeGreaterThan(25);
    // Water is the darkest thing on the dusk map, as it is on the night one.
    expect(luminance(DUSK.water)).toBeLessThan(luminance(DUSK.land));
  });

  it('lights the buildings from the side the sun is on, and from above once it is down', () => {
    // The azimuth is the sun's own; the height is held up so that roofs don't go grey.
    expect(lightFor('light', suns.noon).position).toEqual([1.15, 179, 35]);
    expect(lightFor('light', suns.night)).toMatchObject({ position: [1.15, 0, 12], color: '#ffffff' });
    expect(Number(lightFor('dark', suns.night).intensity)).toBeLessThan(Number(lightFor('dark', suns.dusk).intensity));
  });

  it('restyles the map only when something that shows has changed', () => {
    const at = (altitude: number, azimuth: number) => styleKey({ theme: 'dark', locale: 'fi', sun: { altitude, azimuth } });
    // A minute later the sun has barely moved: the same style.
    expect(at(10.4, 178.6)).toBe(at(10.5, 178.9));
    expect(at(10.4, 178.6)).not.toBe(at(10.4, 215));
    expect(at(-3, 236)).not.toBe(at(-9, 240));
    // After sunset the direction no longer matters.
    expect(at(-20, 250)).toBe(at(-30, 290));
    expect(styleKey({ theme: 'light', locale: 'fi', sun: suns.noon })).not.toBe(styleKey({ theme: 'dark', locale: 'fi', sun: suns.noon }));
  });
});

describe('the pharmacies beyond the list, as a layer of the map', () => {
  it('is the top layer of every style, drawn from one source of points that starts empty', () => {
    for (const theme of themes) {
      const style = buildStyle({ theme, locale: 'fi', sun: suns.dusk });
      expect(style.layers[style.layers.length - 1]).toMatchObject({ id: AREA_LAYER, type: 'symbol', source: AREA_SOURCE });
      expect(style.sources[AREA_SOURCE]).toEqual({ type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    }
  });

  it('thins itself out: signs may not overlap, and the open ones are placed first', () => {
    const layer = buildStyle({ theme: 'light', locale: 'fi' }).layers.find((candidate) => candidate.id === AREA_LAYER);
    const layout = (layer as { layout: Record<string, unknown> }).layout;
    expect(layout['icon-allow-overlap']).toBeUndefined();
    expect(layout['symbol-sort-key']).toEqual(['get', 'rank']);
    expect(layout['icon-image']).toEqual(['concat', 'pharmacy-', ['get', 'glyph']]);
  });

  it('can start with the pharmacies it already has, and is still a valid style', () => {
    const { data } = areaLayer(kamppi, MONDAY_EVENING);
    const style = buildStyle({ theme: 'dark', locale: 'fi', sun: suns.night, area: data });
    expect(validateStyleMin(style).map((error) => error.message)).toEqual([]);
    expect((style.sources[AREA_SOURCE] as unknown as { data: typeof data }).data.features).toHaveLength(kamppi.length);
  });
});

describe('styleChanges: a new sun without a new style', () => {
  const dark = (sun: { altitude: number; azimuth: number }) => buildStyle({ theme: 'dark', locale: 'fi', sun });

  it('turns dusk into night with colours alone: no layer, source or layout is touched', () => {
    const changes = styleChanges(dark(suns.dusk), dark(suns.night));
    expect(changes).toBeDefined();
    expect(changes!.length).toBeGreaterThan(10);
    expect(new Set(changes!.map((change) => change.kind))).toEqual(new Set(['paint']));
    expect(changes).toContainEqual({ kind: 'paint', layer: 'land', property: 'background-color', value: NIGHT.land });
    // The pharmacies' layer is not part of the look: a new sun leaves it alone.
    expect(changes!.some((change) => change.layer === AREA_LAYER)).toBe(false);
  });

  it('has nothing to change when only the light moves: the light is set by itself', () => {
    const morning = buildStyle({ theme: 'light', locale: 'fi', sun: { altitude: 20, azimuth: 120 } });
    const afternoon = buildStyle({ theme: 'light', locale: 'fi', sun: { altitude: 20, azimuth: 230 } });
    expect(styleChanges(morning, afternoon)).toEqual([]);
    expect(morning.light).not.toEqual(afternoon.light);
  });

  it('every step from dusk to night is such a change', () => {
    const steps = [-3, -5, -6, -7, -9].map((altitude) => dark({ altitude, azimuth: 240 }));
    for (let index = 1; index < steps.length; index++) expect(styleChanges(steps[index - 1], steps[index])).toBeDefined();
  });

  it('says so when the two styles are not the same map: another theme has other layers', () => {
    expect(styleChanges(buildStyle({ theme: 'light', locale: 'fi', sun: suns.noon }), dark(suns.noon))).toBeUndefined();
    expect(styleChanges(dark(suns.night), buildStyle({ theme: 'dark', locale: 'fi', sun: suns.night, tiles: 'https://tiles.example/planet' }))).toBeUndefined();
  });

  it('a new language is a change of the labels’ text, nothing more', () => {
    const changes = styleChanges(buildStyle({ theme: 'light', locale: 'fi', sun: suns.noon }), buildStyle({ theme: 'light', locale: 'en', sun: suns.noon }));
    expect(changes!.length).toBeGreaterThan(0);
    expect(changes!.every((change) => change.kind === 'layout' && change.property === 'text-field')).toBe(true);
  });
});

describe('the walking route', () => {
  const line = { type: 'LineString' as const, coordinates: [[24.93545, 60.16952], [24.9361, 60.1701]] as [number, number][] };
  const paint = (theme: MapTheme, id: string, sun = suns.noon) => buildStyle({ theme, locale: 'fi', sun }).layers.find((layer) => layer.id === id)?.paint as Record<string, unknown>;

  it('is cobalt on a white casing by day', () => {
    expect(paint('light', ROUTE_LAYER)).toEqual({ 'line-color': '#2f5ca6', 'line-width': 5.5 });
    expect(paint('light', ROUTE_UNDER_LAYER)).toMatchObject({ 'line-color': '#ffffff', 'line-width': 10, 'line-blur': 0 });
  });

  it('is sky blue on its own blurred glow in the dark, at dusk and at night alike', () => {
    for (const sun of [suns.dusk, suns.night]) {
      expect(paint('dark', ROUTE_LAYER, sun)).toEqual({ 'line-color': '#8bbaec', 'line-width': 5 });
      expect(paint('dark', ROUTE_UNDER_LAYER, sun)).toMatchObject({ 'line-color': '#8bbaec', 'line-width': 14 });
      expect(Number(paint('dark', ROUTE_UNDER_LAYER, sun)['line-blur'])).toBeGreaterThan(0);
    }
  });

  it('lies over the streets and the buildings, under every name and every pharmacy', () => {
    const ids = buildStyle({ theme: 'light', locale: 'fi', sun: suns.noon }).layers.map((layer) => layer.id);
    const at = (id: string) => ids.indexOf(id);
    expect(at(ROUTE_UNDER_LAYER)).toBe(at(ROUTE_LAYER) - 1);
    expect(at(ROUTE_UNDER_LAYER)).toBeGreaterThan(at('building-3d'));
    for (const above of ['water-name', 'street-name', 'place-name', 'city-name', AREA_LAYER]) expect(at(ROUTE_LAYER)).toBeLessThan(at(above));
  });

  it('has a source of its own, empty until a line is given', () => {
    const empty = buildStyle({ theme: 'light', locale: 'fi' });
    expect(empty.sources[ROUTE_SOURCE]).toEqual({ type: 'geojson', data: NO_ROUTE });
    const drawn = buildStyle({ theme: 'light', locale: 'fi', route: line });
    expect(drawn.sources[ROUTE_SOURCE]).toEqual({ type: 'geojson', data: { type: 'Feature', properties: {}, geometry: line } });
    expect(routeData(undefined)).toBe(NO_ROUTE);
    expect(validateStyleMin(drawn).map((error) => error.message)).toEqual([]);
  });

  it('a new sun changes no layer of it: the same style with other colours', () => {
    const dusk = buildStyle({ theme: 'dark', locale: 'fi', sun: suns.dusk });
    const night = buildStyle({ theme: 'dark', locale: 'fi', sun: suns.night });
    const changes = styleChanges(dusk, night);
    expect(changes).toBeDefined();
    expect(changes!.filter((change) => change.layer === ROUTE_LAYER || change.layer === ROUTE_UNDER_LAYER)).toEqual([]);
  });
});
