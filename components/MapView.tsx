'use client';

import type { Map as MapLibreMap } from 'maplibre-gl';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { lowerFirst } from '@/lib/format';
import { useI18n } from '@/lib/i18n/context';
import { boxOf, cameraOf, edgeChip, fit, MAX_ZOOM, metersPerPixel, MIN_ZOOM, projector, spread, type Camera, type EdgeChip, type Insets, type Project } from '@/lib/map/camera';
import { buildStyle, paletteFor, styleKey, type MapTheme } from '@/lib/map/style';
import { MAP_CREDITS, OSM_COPYRIGHT_URL } from '@/lib/maps';
import { MAP_TILES_URL } from '@/lib/requests';
import { sunPosition } from '@/lib/sky';
import { fullName, glyphFor, isOpenNow, statusText } from '@/lib/status';
import { travel } from '@/lib/travel';
import type { GlyphState, Pharmacy, Scene } from '@/lib/types';
import { CrossGlyph } from './CrossGlyph';
import { cx } from './cx';
import { Icon } from './Icon';
import { MapMarker, YouDot, YouHalo } from './MapMarker';
import styles from './MapView.module.css';

interface Props {
  scene: Scene;
  needsStreet: Set<string>;
  selectedId?: string;
  /** The nearest open pharmacy, so its edge chip is named as that and not as the next one. */
  nearestOpenId?: string;
  onSelect?: (pharmacy: Pharmacy) => void;
  /** While searching and in problem states the map shows only you-are-here. */
  userOnly?: boolean;
  /**
   * Draw the streets with MapLibre, on real tiles. Without it the map is the land colour and
   * the markers: in /dev/states, which calls no service, and before the search has answered,
   * so that the list never waits for the map (PLAN.md section 3).
   */
  basemap?: boolean;
  /** The instant the sun is worked out for, epoch seconds: the light on the buildings, dusk or night. */
  now?: number;
  /** The device's latest position while it is followed: the dot is drawn here, not at the place the search was made for. */
  you?: { lat: number; lon: number; accuracy?: number };
  /** The lit markers switch on one after another (PLAN.md section 6, "Motion"). */
  reveal?: boolean;
}

interface Frame {
  width: number;
  height: number;
  /** How much of the bottom the phone's sheet covers. */
  pad: number;
  desktop: boolean;
}

interface Overlay {
  chips: (EdgeChip & { id: string })[];
  /** The selected pharmacy's name goes above its marker when there is no room beside it. */
  nameAbove: boolean;
}

const DESKTOP = '(min-width: 900px)';
/** The dot's own name among the pins. No pharmacy has it: theirs are OpenStreetMap ids. */
const YOU = 'you-are-here';
/** The style's one source: the map tile host's vector tiles. */
const TILES = 'tiles';
const ORDER: GlyphState[] = ['closed', 'unknown', 'soon', 'open'];
const NO_OVERLAY: Overlay = { chips: [], nameAbove: false };
/** At most this many chips: the nearest open ones that are off the map. */
const CHIPS = 3;
/** Rough sizes, for deciding whether a name fits beside its marker: half a marker's width, a letter, the plate's padding. */
const MARKER_HALF = 52;
const NAME_CHAR = 7.8;
const NAME_PADDING = 24;

/** Where the edge chips may sit: clear of the phone's bar and sheet, the desktop legend and credit. */
const chipInsets = (frame: Frame): Insets =>
  frame.desktop ? { top: 64, right: 16, bottom: 44, left: 16 } : { top: 76, right: 12, bottom: frame.pad + 12, left: 12 };
/** The camera's centre sits in the middle of what the phone's bar and sheet leave free. */
const cameraPadding = (frame: Frame): Insets => ({ top: frame.desktop ? 0 : 64, right: 0, bottom: frame.pad, left: 0 });

const sameOverlay = (a: Overlay, b: Overlay): boolean =>
  a.nameAbove === b.nameAbove && a.chips.length === b.chips.length && a.chips.every((chip, i) => chip.id === b.chips[i].id && chip.x === b.chips[i].x && chip.y === b.chips[i].y && chip.degrees === b.chips[i].degrees);

/**
 * The map (PLAN.md section 5): our own style on OpenFreeMap's tiles, with the app's own
 * markers on top as real buttons, so they share the list's components and focus handling.
 *
 * Everything on the map is placed by the same arithmetic whether MapLibre draws the streets
 * or not (lib/map/camera.ts). So when MapLibre can't start, or its tiles don't load, the
 * markers, the edge chips and the list go on working, and the map says what is missing.
 */
export function MapView({ scene, needsStreet, selectedId, nearestOpenId, onSelect, userOnly, basemap = false, now, you, reveal }: Props) {
  const i18n = useI18n();
  const { t, locale } = i18n;

  const root = useRef<HTMLDivElement>(null);
  const base = useRef<HTMLDivElement>(null);
  const padProbe = useRef<HTMLSpanElement>(null);
  const themeProbe = useRef<HTMLSpanElement>(null);
  const map = useRef<MapLibreMap | null>(null);

  const [frame, setFrame] = useState<Frame>();
  const [theme, setTheme] = useState<MapTheme>('light');
  const [mode, setMode] = useState<'plain' | 'live' | 'failed'>('plain');
  const [tilesMissing, setTilesMissing] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>(NO_OVERLAY);

  // The framing the scene asks for: its phone or its desktop view. A new search, or the same one ranked again, frames again.
  const desktop = frame?.desktop ?? false;
  const view = desktop ? scene.views.desktop : scene.views.phone;
  const framing = `${view.center[0]}/${view.center[1]}/${view.zoom}`;
  /** The camera when MapLibre isn't drawing, once the zoom buttons or a selection have moved it from the scene's own. */
  const [moved, setMoved] = useState<{ framing: string; camera: Camera }>();
  const camera = useMemo(() => (moved?.framing === framing ? moved.camera : cameraOf(view)), [moved, framing, view]);

  const here = you ?? scene.user;
  const all = useMemo(() => (userOnly ? [] : [...scene.pharmacies, ...(scene.farOpen ? [scene.farOpen] : [])]), [scene, userOnly]);
  const drawn = useMemo(
    () => all.map((pharmacy) => ({ pharmacy, glyph: glyphFor(pharmacy.status) })).sort((a, b) => ORDER.indexOf(a.glyph) - ORDER.indexOf(b.glyph)),
    [all],
  );
  const glyphs = new Set(drawn.map((pin) => pin.glyph));
  const lit = all.filter((pharmacy) => isOpenNow(pharmacy.status));

  const sun = useMemo(() => (now === undefined ? undefined : sunPosition(now * 1000, scene.user.lat, scene.user.lon)), [now, scene.user.lat, scene.user.lon]);
  const key = styleKey({ theme, locale, sun });

  // What the handlers below read: always the latest, without being set up again.
  const current = { all, lit, here, frame, camera, framing, selectedId, accuracy: you?.accuracy, approximate: scene.user.approximate, look: { theme, locale, sun } };
  const latest = useRef(current);
  useLayoutEffect(() => {
    latest.current = current;
  });

  /** Puts every marker, the dot and the chips where the current camera says they are. */
  const place = useCallback(() => {
    const { all, lit, here, frame, camera, selectedId, accuracy, approximate } = latest.current;
    if (!frame) return;
    const live = map.current;
    const project: Project = live
      ? (lat, lon) => {
          const point = live.project([lon, lat]);
          return { x: Math.round(point.x * 10) / 10, y: Math.round(point.y * 10) / 10 };
        }
      : projector(camera, frame, cameraPadding(frame));
    const zoom = live ? live.getZoom() : camera.zoom;

    const places = new Map<string, { lat: number; lon: number }>(all.map((pharmacy) => [pharmacy.id, pharmacy]));
    places.set(YOU, here);
    for (const element of root.current?.querySelectorAll<HTMLElement>('[data-pin]') ?? []) {
      const at = places.get(element.dataset.pin ?? '');
      if (!at) continue;
      const point = project(at.lat, at.lon);
      element.style.transform = `translate(${point.x}px, ${point.y}px)`;
      // The halo is the accuracy the device reports, in the map's own scale, and never smaller than the canvas's 64 px.
      if (element.dataset.pin === YOU) {
        const radius = accuracy !== undefined ? accuracy / metersPerPixel(here.lat, zoom) : approximate ? 95 : 32;
        element.style.setProperty('--halo', `${Math.round(Math.min(Math.max(radius, 32), 600) * 2)}px`);
      }
    }

    const box = boxOf(frame, chipInsets(frame));
    const chips = spread(
      lit.flatMap((pharmacy) => {
        const chip = edgeChip(project(pharmacy.lat, pharmacy.lon), box);
        return chip ? [{ ...chip, id: pharmacy.id }] : [];
      }).slice(0, CHIPS),
      box,
    );
    // The name stands beside its marker unless the map's edge or another marker is in the way there.
    const selected = all.find((pharmacy) => pharmacy.id === selectedId);
    const at = selected && project(selected.lat, selected.lon);
    // About how far the plate reaches to the right of the marker's middle: half a marker, and the name.
    const reach = MARKER_HALF + NAME_CHAR * (selected?.name ?? selected?.street ?? '').length + NAME_PADDING;
    const nameAbove =
      !!selected &&
      !!at &&
      (at.x + reach > frame.width - 8 ||
        all.some((other) => {
          if (other === selected) return false;
          const point = project(other.lat, other.lon);
          return point.x > at.x && point.x - MARKER_HALF < at.x + reach && Math.abs(point.y - at.y) < 32;
        }));
    const next = { chips, nameAbove };
    setOverlay((current) => (sameOverlay(current, next) ? current : next));
    root.current?.setAttribute('data-map', 'ready');
  }, []);

  // The container's size, how much of it the sheet covers, and which layout this is.
  useLayoutEffect(() => {
    const element = root.current;
    const probe = padProbe.current;
    if (!element || !probe) return;
    const query = window.matchMedia(DESKTOP);
    const measure = () => {
      const next = { width: element.clientWidth, height: element.clientHeight, pad: probe.offsetHeight, desktop: query.matches };
      setFrame((current) => (current && current.width === next.width && current.height === next.height && current.pad === next.pad && current.desktop === next.desktop ? current : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    observer.observe(probe);
    query.addEventListener('change', measure);
    return () => {
      observer.disconnect();
      query.removeEventListener('change', measure);
    };
  }, []);

  // The theme in force here: the device's, or a data-theme above. Read from a colour that differs between the two.
  useLayoutEffect(() => {
    const probe = themeProbe.current;
    if (!probe) return;
    const read = () => setTheme(getComputedStyle(probe).color === 'rgb(0, 0, 0)' ? 'dark' : 'light');
    read();
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    query.addEventListener('change', read);
    return () => query.removeEventListener('change', read);
  }, []);

  // After every render the markers are where they belong, before the browser paints.
  useLayoutEffect(place);

  // A new framing from the scene moves the real map too.
  const framed = useRef(framing);
  useEffect(() => {
    if (framed.current === framing) return;
    framed.current = framing;
    const next = latest.current.camera;
    map.current?.easeTo({ center: [next.lon, next.lat], zoom: next.zoom, duration: 400 });
  }, [framing]);

  // MapLibre, loaded only now: it is by far the heaviest thing in the app, and nothing waits for it.
  const measured = frame !== undefined;
  useEffect(() => {
    if (!basemap || !measured || !base.current) return;
    let cancelled = false;
    let created: MapLibreMap | undefined;
    void import('maplibre-gl')
      .then(({ Map, setWorkerUrl }) => {
        if (cancelled || !base.current) return;
        const { frame, camera, look } = latest.current;
        // The worker is served from our own origin (scripts/copy-map-worker.mjs).
        setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
        created = new Map({
          container: base.current,
          style: buildStyle({ ...look, tiles: MAP_TILES_URL }),
          center: [camera.lon, camera.lat],
          zoom: camera.zoom,
          minZoom: MIN_ZOOM,
          maxZoom: MAX_ZOOM,
          // Top-down, north up: no tilting and no turning (decided in the spike, S1).
          maxPitch: 0,
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          rollEnabled: false,
          // The credit is our own line, in the app's typeface, with the same three names.
          attributionControl: false,
          locale: { 'Map.Title': t.map.canvas },
        });
        created.touchZoomRotate.disableRotation();
        created.keyboard.disableRotation();
        if (frame) created.setPadding(cameraPadding(frame));

        created.on('move', place);
        // Tiles that never arrive leave the land colour and the markers: the map then says what is missing.
        // One loaded tile is enough to call the map drawn; a single square that fails later is not news.
        let drawn = false;
        created.on('sourcedata', (event) => {
          if (event.sourceId !== TILES || !event.tile || drawn) return;
          drawn = true;
          setTilesMissing(false);
        });
        created.on('error', (event) => {
          if (!drawn && 'sourceId' in event && event.sourceId === TILES) setTilesMissing(true);
        });
        created.once('idle', () => performance.mark('map-ready'));
        map.current = created;
        setMode('live');
      })
      // No WebGL, or the code didn't arrive: the markers stay on the plain map.
      .catch(() => {
        if (!cancelled) setMode('failed');
      });
    return () => {
      cancelled = true;
      map.current = null;
      created?.remove();
      setMode('plain');
    };
    // The map is made once; what changes afterwards is handled by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basemap, measured]);

  // A new theme, language or sun: the same map in its new colours.
  const styled = useRef(key);
  useEffect(() => {
    if (mode !== 'live' || styled.current === key) return;
    styled.current = key;
    map.current?.setStyle(buildStyle({ ...latest.current.look, tiles: MAP_TILES_URL }));
  }, [key, mode]);

  // The sheet opened or closed: keep the camera's centre in the part of the map that shows.
  const pad = frame?.pad;
  useEffect(() => {
    const frame = latest.current.frame;
    if (mode !== 'live' || !frame) return;
    map.current?.easeTo({ padding: cameraPadding(frame), duration: 200 });
  }, [pad, mode]);

  // A pharmacy picked in the list comes into view on the map, together with the dot.
  const picked = useRef(selectedId);
  useEffect(() => {
    if (picked.current === selectedId) return;
    picked.current = selectedId;
    const { all, here, frame, camera, framing } = latest.current;
    const target = all.find((pharmacy) => pharmacy.id === selectedId);
    if (!target || !frame) return;
    const live = map.current;
    const project: Project = live ? (lat, lon) => live.project([lon, lat]) : projector(camera, frame, cameraPadding(frame));
    const point = project(target.lat, target.lon);
    const box = boxOf(frame, chipInsets(frame));
    if (point.x >= box.left && point.x <= box.right && point.y >= box.top && point.y <= box.bottom) return;
    const zoom = live ? live.getZoom() : camera.zoom;
    const next = fit([here, target], frame, { ...chipInsets(frame), bottom: Math.max(chipInsets(frame).bottom, frame.pad) }, { maxZoom: zoom });
    if (!next) return;
    if (live) live.easeTo({ center: [next.lon, next.lat], zoom: next.zoom, padding: cameraPadding(frame), duration: 400 });
    else setMoved({ framing, camera: next });
  }, [selectedId]);

  const zoomBy = (step: number) => {
    if (map.current) map.current.easeTo({ zoom: map.current.getZoom() + step, duration: 200 });
    else setMoved({ framing, camera: { ...camera, zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, camera.zoom + step)) } });
  };
  const recentre = () => {
    const zoom = cameraOf(view).zoom;
    if (map.current && frame) map.current.easeTo({ center: [here.lon, here.lat], zoom: Math.max(map.current.getZoom(), zoom), padding: cameraPadding(frame), duration: 400 });
    else setMoved({ framing, camera: { lat: here.lat, lon: here.lon, zoom } });
  };

  const markerLabel = (pharmacy: Pharmacy) => {
    const way = travel(i18n, pharmacy, scene.distance);
    return [fullName(i18n, pharmacy, needsStreet.has(pharmacy.id)), lowerFirst(statusText(i18n, pharmacy.status)), isOpenNow(pharmacy.status) && way.primary.long]
      .filter(Boolean)
      .join(', ');
  };
  const live = mode === 'live';
  // The labels on the markers stand on the map's own ground colour, which at dusk is not the theme's.
  const ground = live ? ({ '--map-land': paletteFor(theme, sun?.altitude).land } as CSSProperties) : undefined;

  return (
    <div ref={root} className={styles.map} data-map="pending" data-basemap={mode} data-reveal={reveal || undefined} style={ground}>
      <span ref={padProbe} aria-hidden="true" className={styles.padProbe} />
      <span ref={themeProbe} aria-hidden="true" className={styles.themeProbe} />
      {basemap && <div ref={base} className={styles.base} />}

      <div className={styles.pins}>
        <span data-pin={YOU} className={cx(styles.pin, styles.haloPin)}>
          <YouHalo />
        </span>
        {drawn.map(({ pharmacy }) => {
          const selected = pharmacy.id === selectedId;
          return (
            <span key={pharmacy.id} data-pin={pharmacy.id} className={cx(styles.pin, selected && styles.front)} style={{ '--order': lit.indexOf(pharmacy) } as CSSProperties}>
              <span className={styles.body}>
                <MapMarker pharmacy={pharmacy} distance={scene.distance} label={markerLabel(pharmacy)} selected={selected} onSelect={onSelect} />
                {selected && (
                  <span aria-hidden="true" className={cx(styles.name, overlay.nameAbove && styles.above)}>
                    {pharmacy.name ?? pharmacy.street ?? t.app.fallbackName}
                  </span>
                )}
              </span>
            </span>
          );
        })}
        <span data-pin={YOU} className={cx(styles.pin, styles.youPin)}>
          <YouDot />
        </span>
      </div>

      {/* An open pharmacy outside the view gets a chip on the edge, on the line towards it. */}
      {overlay.chips.map((chip) => {
        const pharmacy = all.find((candidate) => candidate.id === chip.id);
        if (!pharmacy) return null;
        const way = travel(i18n, pharmacy, scene.distance);
        return (
          <button
            key={chip.id}
            type="button"
            className={cx(styles.edge, 'tnum')}
            style={{ transform: `translate(${chip.x}px, ${chip.y}px) translate(-50%, -50%)` }}
            aria-label={(pharmacy.id === nearestOpenId ? t.map.edgeNearest : t.map.edge)(fullName(i18n, pharmacy, needsStreet.has(pharmacy.id)), way.primary.long, t.map.directions[chip.side])}
            onClick={() => onSelect?.(pharmacy)}
          >
            <span className={styles.arrow} style={{ transform: `rotate(${chip.degrees}deg)` }}>
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
          <button type="button" aria-label={t.map.zoomIn} className={styles.control} onClick={() => zoomBy(1)}>
            <Icon name="plus" />
          </button>
          <span aria-hidden="true" className={styles.rule} />
          <button type="button" aria-label={t.map.zoomOut} className={styles.control} onClick={() => zoomBy(-1)}>
            <Icon name="minus" />
          </button>
        </div>
        <button type="button" aria-label={scene.searched ? t.map.backToPlace : t.map.locate} className={cx(styles.control, styles.locate)} onClick={recentre}>
          <Icon name="locate" />
        </button>
      </div>

      {(mode === 'failed' || (live && tilesMissing)) && <p className={styles.missing}>{t.map.failed}</p>}

      <p className={styles.attribution}>
        {live && MAP_CREDITS.map((credit) => (
          <a key={credit.url} href={credit.url}>
            {credit.label}
          </a>
        ))}
        <a href={OSM_COPYRIGHT_URL}>{t.map.attribution}</a>
      </p>
    </div>
  );
}
