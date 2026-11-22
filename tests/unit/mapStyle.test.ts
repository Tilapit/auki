import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import { describe, expect, it } from 'vitest';
import { buildStyle, DAY, NIGHT, type MapPhase, type MapVariant } from '@/lib/map/style';

const variants: MapVariant[] = ['a', 'b', 'c'];
const phases: MapPhase[] = ['day', 'dusk', 'night'];
const sun = { altitude: 10.4, azimuth: 178.65 };
const sky = { top: '#1e417f', horizon: '#f6d4bd' };

describe('buildStyle', () => {
  it.each(variants.flatMap((variant) => phases.map((phase) => [variant, phase] as const)))('variant %s, %s: a valid MapLibre style', (variant, phase) => {
    const style = buildStyle({ variant, phase, locale: 'fi', sun, sky });
    expect(validateStyleMin(style).map((error) => error.message)).toEqual([]);
  });

  it('takes its colours from the map tokens of PLAN.md section 6', () => {
    expect(DAY).toMatchObject({ land: '#ebf0f5', water: '#b9d2ea', park: '#dce7e0', major: '#ffffff', majorCasing: '#c2cedc', label: '#55657d' });
    expect(NIGHT).toMatchObject({ land: '#0a192e', water: '#030c1a', park: '#0b1f31', major: '#28456e', minor: '#1a3254', label: '#7b8fac' });
  });

  it('keeps variant a flat, lights b and c from the sun, and gives only c a sky', () => {
    const style = (variant: MapVariant) => buildStyle({ variant, phase: 'day', locale: 'fi', sun, sky });
    const has3d = (variant: MapVariant) => style(variant).layers.some((layer) => layer.type === 'fill-extrusion');
    expect([has3d('a'), has3d('b'), has3d('c')]).toEqual([false, true, true]);
    expect(style('a').light).toBeUndefined();
    // The azimuth is the sun's own; the height is held up so that roofs don't go grey.
    expect(style('b').light?.position).toEqual([1.15, 178.65, 35]);
    expect([style('a').sky, style('b').sky].every((value) => value === undefined)).toBe(true);
    expect(style('c').sky).toMatchObject({ 'sky-color': '#1e417f', 'horizon-color': '#f6d4bd' });
  });

  it('lights the buildings dimly from above once the sun is down', () => {
    const night = buildStyle({ variant: 'b', phase: 'night', locale: 'fi', sun: { altitude: -35, azimuth: 295 } });
    expect(night.light).toMatchObject({ position: [1.15, 0, 12], color: '#ffffff' });
  });

  it('asks for labels in the UI language first, and stays small', () => {
    const style = buildStyle({ variant: 'c', phase: 'day', locale: 'en', sun, sky });
    expect(JSON.stringify(style)).toContain('name:en');
    // The whole style travels inside the JavaScript: keep it a few kilobytes.
    expect(JSON.stringify(style).length).toBeLessThan(8000);
  });
});
