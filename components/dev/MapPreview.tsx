'use client';

import { useMemo } from 'react';
import { MAP_MOMENTS, type MapPreviewView } from '@/lib/dev/mapViews';
import { helsinki } from '@/lib/fixtures/helsinki';
import { riga } from '@/lib/fixtures/riga';
import type { Scene } from '@/lib/types';
import { ResultsView } from '../ResultsView';

const SCENES: Record<MapPreviewView['city'], Scene> = { helsinki, riga };

/**
 * The results view with the real map under it: MapLibre on the map tile host's tiles, in our
 * own style, at a fixed moment. The pharmacies and their statuses are the fixture's own
 * (Helsinki on a Thursday at 20.41, Riga on a Friday at 23.40) whatever the moment: this
 * view is for judging the map, its light and the markers on it.
 */
export function MapPreview({ view, zoom, sheet = 'peek' }: { view: MapPreviewView; zoom?: number; sheet?: 'peek' | 'expanded' }) {
  const at = MAP_MOMENTS.find((moment) => moment.id === view.moment)!.at;
  const scene = useMemo(() => {
    const fixture = SCENES[view.city];
    if (zoom === undefined) return fixture;
    // Scene views count 256 px tiles: one level more than the map's own zoom.
    return { ...fixture, views: { phone: { ...fixture.views.phone, zoom: zoom + 1 }, desktop: { ...fixture.views.desktop, zoom: zoom + 1 } } };
  }, [view.city, zoom]);
  return <ResultsView scene={scene} sheet={sheet} basemap now={Math.floor(Date.parse(at) / 1000)} reveal />;
}
