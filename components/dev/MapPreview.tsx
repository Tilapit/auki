'use client';

import { useMemo } from 'react';
import { inventedArea, inventedRoute, MAP_MOMENTS, type MapPreviewView } from '@/lib/dev/mapViews';
import { helsinki } from '@/lib/fixtures/helsinki';
import { distanceMeters } from '@/lib/geo';
import { riga } from '@/lib/fixtures/riga';
import type { Pharmacy, Scene } from '@/lib/types';
import { ResultsView } from '../ResultsView';

const SCENES: Record<MapPreviewView['city'], Scene> = { helsinki, riga };

/**
 * The results view with the real map under it: MapLibre on the map tile host's tiles, in our
 * own style, at a fixed moment. The pharmacies and their statuses are the fixture's own
 * (Helsinki on a Thursday at 20.41, Riga on a Friday at 23.40) whatever the moment: this
 * view is for judging the map, its light and the markers on it.
 *
 * Around them, 160 invented pharmacies as the map's own signs, the way the live app draws
 * every pharmacy beyond the list's ten. A press on one opens a sheet with as little as a
 * pharmacy without a name or hours has.
 *
 * The route line to the selected pharmacy is invented too: two corners between the dot and
 * the marker, to judge the line's colour and weight in each light. It follows no street.
 */
export function MapPreview({ view, zoom, sheet = 'peek', pixels }: { view: MapPreviewView; zoom?: number; sheet?: 'peek' | 'expanded'; pixels?: number }) {
  const at = MAP_MOMENTS.find((moment) => moment.id === view.moment)!.at;
  const scene = useMemo(() => {
    const fixture = SCENES[view.city];
    if (zoom === undefined) return fixture;
    // Scene views count 256 px tiles: one level more than the map's own zoom.
    return { ...fixture, views: { phone: { ...fixture.views.phone, zoom: zoom + 1 }, desktop: { ...fixture.views.desktop, zoom: zoom + 1 } } };
  }, [view.city, zoom]);
  const area = useMemo(() => inventedArea(SCENES[view.city].user, view.moment), [view.city, view.moment]);
  const findInArea = (id: string): Pharmacy | undefined => {
    const feature = area.data.features.find((candidate) => candidate.properties.id === id);
    if (!feature) return undefined;
    const [lon, lat] = feature.geometry.coordinates;
    const { glyph } = feature.properties;
    const status: Pharmacy['status'] = glyph === 'open' ? { kind: 'open', closes: '22:00' } : glyph === 'soon' ? { kind: 'soon', closes: '21:00' } : glyph === 'closed' ? { kind: 'closed', opens: { day: 'tomorrow', time: '09:00' } } : { kind: 'missing' };
    return { id, name: null, lat, lon, status, straightMeters: Math.round(distanceMeters(scene.user, { lat, lon })) };
  };
  const routeFor = useMemo(() => async (pharmacy: Pharmacy) => inventedRoute(scene.user, pharmacy), [scene.user]);
  return <ResultsView scene={scene} sheet={sheet} basemap now={Math.floor(Date.parse(at) / 1000)} reveal area={area} findInArea={findInArea} routeFor={routeFor} mapPixels={pixels} />;
}
