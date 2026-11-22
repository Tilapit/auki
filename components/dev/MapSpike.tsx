'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MAP_PHASES, type MapView } from '@/lib/dev/mapViews';
import { helsinki } from '@/lib/fixtures/helsinki';
import { riga } from '@/lib/fixtures/riga';
import { lowerFirst } from '@/lib/format';
import { useI18n } from '@/lib/i18n/context';
import { buildStyle, OPENFREEMAP_TILES, OWN_FONTS, OWN_GLYPHS } from '@/lib/map/style';
import { skyAt, sunPosition } from '@/lib/sky';
import { fullName, isOpenNow, statusText } from '@/lib/status';
import { travel } from '@/lib/travel';
import type { Pharmacy } from '@/lib/types';
import { MapMarker, YouAreHere } from '../MapMarker';
import styles from './MapSpike.module.css';

const SCENES = { helsinki: { scene: helsinki, zone: 'Europe/Helsinki' }, riga: { scene: riga, zone: 'Europe/Riga' } };

// OpenFreeMap's own typeface, for comparing against ours (?font=noto).
const NOTO = {
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  fonts: { regular: ['Noto Sans Regular'], strong: ['Noto Sans Bold'] },
};

interface Pin {
  key: string;
  element: HTMLElement;
  pharmacy?: Pharmacy;
}

/**
 * The map spike: MapLibre on real OpenFreeMap tiles with our own style, and the app's own
 * marker components on top. Not wired into the app: fixture pharmacies, a fixed moment.
 */
export function MapSpike({ view, font = 'own' }: { view: MapView; font?: 'own' | 'noto' }) {
  const i18n = useI18n();
  const container = useRef<HTMLDivElement>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const { scene, zone } = SCENES[view.city];
  const dark = view.phase !== 'day';

  useEffect(() => {
    let map: MapLibreMap | undefined;
    let cancelled = false;
    const at = MAP_PHASES.find((phase) => phase.id === view.phase)!.at;
    const sun = sunPosition(Date.parse(at), scene.user.lat, scene.user.lon);
    const sky = skyAt({ at, zone }).vars;
    const pitched = view.variant === 'c';

    void import('maplibre-gl').then(({ Map, Marker, setWorkerUrl }) => {
      if (cancelled || !container.current) return;
      // The worker is served from our own origin (scripts/copy-map-worker.mjs).
      setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
      performance.mark('map:start');
      map = new Map({
        container: container.current,
        style: buildStyle({
          variant: view.variant,
          phase: view.phase,
          locale: i18n.locale,
          sun,
          sky: { top: sky['--sky-2'], horizon: sky['--sky-6'] },
          tiles: OPENFREEMAP_TILES,
          glyphs: font === 'noto' ? NOTO.glyphs : OWN_GLYPHS,
          fonts: font === 'noto' ? NOTO.fonts : OWN_FONTS,
        }),
        center: [scene.user.lon, scene.user.lat],
        zoom: pitched ? 16.1 : 15.4,
        pitch: pitched ? 64 : 0,
        bearing: pitched ? -24 : 0,
        maxPitch: 80,
        attributionControl: { compact: true },
      });

      const next: Pin[] = [];
      const add = (key: string, lat: number, lon: number, pharmacy?: Pharmacy) => {
        const element = document.createElement('div');
        new Marker({ element, anchor: 'center' }).setLngLat([lon, lat]).addTo(map!);
        next.push({ key, element, pharmacy });
      };
      // Closed first, so that the lit ones are drawn on top of them.
      [...scene.pharmacies].sort((a, b) => Number(isOpenNow(a.status)) - Number(isOpenNow(b.status))).forEach((p) => add(p.id, p.lat, p.lon, p));
      add('you', scene.user.lat, scene.user.lon);
      setPins(next);

      map.once('load', () => performance.mark('map:load'));
      map.once('idle', () => {
        performance.mark('map:idle');
        document.documentElement.dataset.map = 'ready';
      });
    });

    return () => {
      cancelled = true;
      delete document.documentElement.dataset.map;
      map?.remove();
    };
  }, [view, font, scene, zone, i18n.locale]);

  const label = (pharmacy: Pharmacy) =>
    [fullName(i18n, pharmacy, false), lowerFirst(statusText(i18n, pharmacy.status)), isOpenNow(pharmacy.status) && travel(i18n, pharmacy, scene.distance).primary.long]
      .filter(Boolean)
      .join(', ');

  return (
    <div data-theme={dark ? 'dark' : 'light'} className={styles.frame}>
      <div ref={container} className={styles.map} />
      {pins.map(({ key, element, pharmacy }) =>
        createPortal(pharmacy ? <MapMarker pharmacy={pharmacy} distance={scene.distance} label={label(pharmacy)} /> : <YouAreHere />, element, key),
      )}
    </div>
  );
}
