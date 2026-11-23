import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import { describe, expect, it } from 'vitest';
import { buildStyle, DAY, DUSK, lightFor, NIGHT, nightShare, paletteFor, RISE_FROM, RISE_UNTIL, styleKey, type MapTheme } from '@/lib/map/style';

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
