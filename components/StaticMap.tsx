'use client';

import type { CSSProperties } from 'react';
import { lowerFirst } from '@/lib/format';
import { bearing, compass, offsetFromCenter } from '@/lib/geo';
import { useI18n } from '@/lib/i18n/context';
import { OSM_COPYRIGHT_URL } from '@/lib/maps';
import { fullName, glyphFor, isOpenNow, statusText } from '@/lib/status';
import { travel } from '@/lib/travel';
import type { GlyphState, Pharmacy, Scene } from '@/lib/types';
import { CrossGlyph } from './CrossGlyph';
import { cx } from './cx';
import { Icon } from './Icon';
import { MapMarker, YouAreHere } from './MapMarker';
import styles from './StaticMap.module.css';

interface Props {
  scene: Scene;
  needsStreet: Set<string>;
  selectedId?: string;
  /** The nearest open pharmacy, so its edge chip is named as that and not as the next one. */
  nearestOpenId?: string;
  onSelect?: (pharmacy: Pharmacy) => void;
  /** While searching and in problem states the map shows only you-are-here. */
  userOnly?: boolean;
}

// Roughly what fits around the centre at 390 and 1440 px. Good enough for a placeholder:
// MapLibre knows the real bounds from M4 on.
const PHONE = { x: 185, up: 290, down: 250 };
const DESKTOP = { x: 480, up: 440, down: 440 };

const ORDER: GlyphState[] = ['closed', 'unknown', 'soon', 'open'];

/**
 * M0 stand-in for the map: a surface in the map's land colour with the real marker components
 * placed from coordinates. No tiles, no MapLibre, no route line. Replaced by MapView in M4.
 */
export function StaticMap({ scene, needsStreet, selectedId, nearestOpenId, onSelect, userOnly }: Props) {
  const i18n = useI18n();
  const { t } = i18n;

  const place = (lat: number, lon: number) => {
    const phone = offsetFromCenter(scene.views.phone.center, scene.views.phone.zoom, lat, lon);
    const desktop = offsetFromCenter(scene.views.desktop.center, scene.views.desktop.zoom, lat, lon);
    return { phone, desktop, style: { '--xp': phone.dx, '--yp': phone.dy, '--xd': desktop.dx, '--yd': desktop.dy } as CSSProperties };
  };
  const outside = (o: { dx: number; dy: number }, box: typeof PHONE) => Math.abs(o.dx) > box.x || o.dy < -box.up || o.dy > box.down;

  const all = userOnly ? [] : [...scene.pharmacies, ...(scene.farOpen ? [scene.farOpen] : [])];
  const pins = all
    .map((pharmacy) => ({ pharmacy, glyph: glyphFor(pharmacy.status), at: place(pharmacy.lat, pharmacy.lon) }))
    .sort((a, b) => ORDER.indexOf(a.glyph) - ORDER.indexOf(b.glyph));
  const you = place(scene.user.lat, scene.user.lon);
  const glyphs = new Set(pins.map((pin) => pin.glyph));

  const markerLabel = (pharmacy: Pharmacy) => {
    const way = travel(i18n, pharmacy, scene.distance);
    return [fullName(i18n, pharmacy, needsStreet.has(pharmacy.id)), lowerFirst(statusText(i18n, pharmacy.status)), isOpenNow(pharmacy.status) && way.primary.long]
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className={styles.map}>
      {pins.map(({ pharmacy, at }) => {
        const selected = pharmacy.id === selectedId;
        return (
          <span key={pharmacy.id} className={cx(styles.pin, selected && styles.front)} style={at.style}>
            <MapMarker pharmacy={pharmacy} distance={scene.distance} label={markerLabel(pharmacy)} selected={selected} onSelect={onSelect} />
            {selected && (
              <span aria-hidden="true" className={cx(styles.name, at.desktop.dx > 240 && styles.above)}>
                {pharmacy.name ?? pharmacy.street ?? t.app.fallbackName}
              </span>
            )}
          </span>
        );
      })}

      <span className={cx(styles.pin, styles.youPin)} style={you.style}>
        <YouAreHere approximate={scene.user.approximate} />
      </span>

      {/* An open pharmacy outside the view gets a chip on the edge nearest to it. */}
      {pins
        .filter(({ pharmacy }) => isOpenNow(pharmacy.status))
        .map(({ pharmacy, at }) => {
          const offPhone = outside(at.phone, PHONE);
          const offDesktop = outside(at.desktop, DESKTOP);
          if (!offPhone && !offDesktop) return null;
          const degrees = bearing(scene.user, pharmacy);
          const side = compass(degrees);
          const way = travel(i18n, pharmacy, scene.distance);
          return (
            <button
              key={pharmacy.id}
              type="button"
              className={cx(styles.edge, styles[side], !offPhone && styles.desktopOnly, !offDesktop && styles.phoneOnly, 'tnum')}
              aria-label={(pharmacy.id === nearestOpenId ? t.map.edgeNearest : t.map.edge)(
                fullName(i18n, pharmacy, needsStreet.has(pharmacy.id)),
                way.primary.long,
                t.map.directions[side],
              )}
              onClick={() => onSelect?.(pharmacy)}
            >
              <span className={styles.arrow} style={{ transform: `rotate(${Math.round(degrees)}deg)` }}>
                <Icon name="arrowUp" size={16} />
              </span>
              <CrossGlyph state="open" size={15} />
              {way.primary.short}
            </button>
          );
        })}

      {!userOnly && (
        <ul className={styles.legend} aria-label={t.map.legend}>
          {(['open', 'soon', 'closed'] as const).map((state) => (
            <li key={state}>
              <CrossGlyph state={state} size={15} />
              {t.status.legend[state]}
            </li>
          ))}
          {glyphs.has('unknown') && (
            <li>
              <CrossGlyph state="unknown" size={15} />
              {t.status.legend.unknown}
            </li>
          )}
        </ul>
      )}

      <div className={styles.controls}>
        <div className={styles.zoom}>
          <button type="button" aria-label={t.map.zoomIn} className={styles.control}>
            <Icon name="plus" />
          </button>
          <span aria-hidden="true" className={styles.rule} />
          <button type="button" aria-label={t.map.zoomOut} className={styles.control}>
            <Icon name="minus" />
          </button>
        </div>
        <button type="button" aria-label={t.map.locate} className={cx(styles.control, styles.locate)}>
          <Icon name="locate" />
        </button>
      </div>

      <p className={styles.attribution}>
        <a href={OSM_COPYRIGHT_URL}>{t.map.attribution}</a>
      </p>
    </div>
  );
}
