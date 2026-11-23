'use client';

import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { lowerFirst } from '@/lib/format';
import { useI18n } from '@/lib/i18n/context';
import { NO_AREA, type AreaLayer, type Bounds } from '@/lib/map/area';
import { boxOf, cameraOf, edgeChip, fit, MAX_ZOOM, metersPerPixel, MIN_ZOOM, projector, spread, type Camera, type Insets, type Project } from '@/lib/map/camera';
import { AREA_ICON, AREA_LAYER, AREA_SOURCE, buildStyle, paletteFor, styleChanges, styleKey, type MapTheme } from '@/lib/map/style';
import { MAP_CREDITS, OSM_COPYRIGHT_URL } from '@/lib/maps';
import { MAP_TILES_URL } from '@/lib/requests';
import { sunPosition } from '@/lib/sky';
import { fullName, glyphFor, isOpenNow, statusText } from '@/lib/status';
import { travel } from '@/lib/travel';
import type { Compass } from '@/lib/geo';
import type { GlyphState, Pharmacy, Scene } from '@/lib/types';
import { CrossGlyph } from './CrossGlyph';
import { cx } from './cx';
import { Icon } from './Icon';
import { MapMarker, YouDot, YouHalo } from './MapMarker';
import { drawSign, SIGN_TOKENS, SIGNS, type SignColours } from './mapSigns';
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
  /**
   * Every other pharmacy on the tiles the device holds (lib/map/area.ts). The map itself draws
   * them, as one layer of small signs: only where MapLibre is drawing.
   */
  area?: AreaLayer;
  /** A pharmacy picked from that layer, while it is the selected one: it gets a marker like the scene's own. */
  extra?: Pharmacy;
  /** One of the layer's signs was pressed: its pharmacy's id. */
  onPick?: (id: string) => void;
  /** The map was moved by hand: what it shows now, for loading the squares that came into view. */
  onView?: (bounds: Bounds) => void;
}

interface Frame {
  width: number;
  height: number;
  /** How much of the bottom the phone's sheet covers. */
  pad: number;
  desktop: boolean;
}

/**
 * What of the map's overlay is React's to render: which chips there are and what they say,
 * and where the name plate goes. Where things are is not in it: positions are written
 * straight to the elements on every frame of a pan or a zoom, and rendering sixty times a
 * second for them is what made the map lag on a phone.
 */
interface Overlay {
  chips: { id: string; side: Compass }[];
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
/** A press this near a sign of the area layer counts as a press on it: the signs are 20 px, a fingertip is 44. */
const PICK_WITHIN_PX = 18;
/** A press that travelled farther than this was a drag of the map, not a press on the marker it began on. */
const DRAG_FROM_PX = 6;
/** Rough sizes, for deciding whether a name fits beside its marker: half a marker's width, a letter, the plate's padding. */
const MARKER_HALF = 52;
const NAME_CHAR = 7.8;
const NAME_PADDING = 24;

/** Where the edge chips may sit: clear of the phone's bar and sheet, the desktop legend and credit. */
const chipInsets = (frame: Frame): Insets =>
  // On the phone the credit lies just above the sheet: the chips keep clear of it.
  frame.desktop ? { top: 64, right: 16, bottom: 44, left: 16 } : { top: 76, right: 12, bottom: frame.pad + 40, left: 12 };
/** The camera's centre sits in the middle of what the phone's bar and sheet leave free. */
const cameraPadding = (frame: Frame): Insets => ({ top: frame.desktop ? 0 : 64, right: 0, bottom: frame.pad, left: 0 });

const sameOverlay = (a: Overlay, b: Overlay): boolean =>
  a.nameAbove === b.nameAbove && a.chips.length === b.chips.length && a.chips.every((chip, i) => chip.id === b.chips[i].id && chip.side === b.chips[i].side);

/**
 * The map (PLAN.md section 5): our own style on OpenFreeMap's tiles, with the app's own
 * markers on top as real buttons, so they share the list's components and focus handling.
 *
 * Everything on the map is placed by the same arithmetic whether MapLibre draws the streets
 * or not (lib/map/camera.ts). So when MapLibre can't start, or its tiles don't load, the
 * markers, the edge chips and the list go on working, and the map says what is missing.
 *
 * Touch: the whole map is the map's to handle (touch-action: none, so a pinch never zooms
 * the page), and once MapLibre is drawing, the markers live inside the element it listens
 * on. A drag or a pinch that begins on a marker then moves the map like any other.
 */
export function MapView({ scene, needsStreet, selectedId, nearestOpenId, onSelect, userOnly, basemap = false, now, you, reveal, area, extra, onPick, onView }: Props) {
  const i18n = useI18n();
  const { t, locale } = i18n;

  const root = useRef<HTMLDivElement>(null);
  const base = useRef<HTMLDivElement>(null);
  const pins = useRef<HTMLDivElement>(null);
  const colourProbe = useRef<HTMLSpanElement>(null);
  const padProbe = useRef<HTMLSpanElement>(null);
  const themeProbe = useRef<HTMLSpanElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  /** Where the press that may become a click began. */
  const pressed = useRef<{ x: number; y: number } | null>(null);

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
  const all = useMemo(() => {
    if (userOnly) return [];
    const own = [...scene.pharmacies, ...(scene.farOpen ? [scene.farOpen] : [])];
    return extra && !own.some((pharmacy) => pharmacy.id === extra.id) ? [...own, extra] : own;
  }, [scene, userOnly, extra]);
  const drawn = useMemo(
    () => all.map((pharmacy) => ({ pharmacy, glyph: glyphFor(pharmacy.status) })).sort((a, b) => ORDER.indexOf(a.glyph) - ORDER.indexOf(b.glyph)),
    [all],
  );
  const glyphs = new Set(drawn.map((pin) => pin.glyph));
  const lit = all.filter((pharmacy) => isOpenNow(pharmacy.status));

  const sun = useMemo(() => (now === undefined ? undefined : sunPosition(now * 1000, scene.user.lat, scene.user.lon)), [now, scene.user.lat, scene.user.lon]);
  const key = styleKey({ theme, locale, sun });

  // What the handlers below read: always the latest, without being set up again.
  const current = { all, lit, here, frame, camera, framing, selectedId, accuracy: you?.accuracy, approximate: scene.user.approximate, look: { theme, locale, sun }, area, onPick, onView };
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
      ? (lat, lon) => live.project([lon, lat])
      : projector(camera, frame, cameraPadding(frame));
    const zoom = live ? live.getZoom() : camera.zoom;

    const places = new Map<string, { lat: number; lon: number }>(all.map((pharmacy) => [pharmacy.id, pharmacy]));
    places.set(YOU, here);
    for (const element of root.current?.querySelectorAll<HTMLElement>('[data-pin]') ?? []) {
      const at = places.get(element.dataset.pin ?? '');
      if (!at) continue;
      // Whole pixels: a marker's text is then drawn the same way every time, and stays sharp.
      const point = project(at.lat, at.lon);
      element.style.transform = `translate(${Math.round(point.x)}px, ${Math.round(point.y)}px)`;
      // The halo is the accuracy the device reports, in the map's own scale, and never smaller than the canvas's 64 px.
      if (element.dataset.pin === YOU) {
        const radius = accuracy !== undefined ? accuracy / metersPerPixel(here.lat, zoom) : approximate ? 95 : 32;
        const halo = `${Math.round(Math.min(Math.max(radius, 32), 600) * 2)}px`;
        if (element.dataset.halo !== halo) {
          element.dataset.halo = halo;
          element.style.setProperty('--halo', halo);
        }
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
    // A chip that is already there moves with the map; one that has just come in is placed after it is rendered.
    for (const chip of chips) {
      const element = root.current?.querySelector<HTMLElement>(`[data-chip="${CSS.escape(chip.id)}"]`);
      if (!element) continue;
      element.style.transform = `translate(${chip.x}px, ${chip.y}px) translate(-50%, -50%)`;
      element.style.visibility = 'visible';
      const arrow = element.querySelector<HTMLElement>('[data-arrow]');
      if (arrow) arrow.style.transform = `rotate(${chip.degrees}deg)`;
    }
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
    const next = { chips: chips.map(({ id, side }) => ({ id, side })), nameAbove };
    setOverlay((current) => (sameOverlay(current, next) ? current : next));
    if (root.current && root.current.dataset.map !== 'ready') root.current.dataset.map = 'ready';
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

  /** The signs of the area layer in the colours of the theme in force, read from the tokens of app/globals.css. */
  const sign = useCallback((glyph: GlyphState) => {
    const probe = colourProbe.current;
    if (!probe) return undefined;
    const colours = Object.fromEntries(
      Object.entries(SIGN_TOKENS).map(([name, token]) => {
        probe.style.color = `var(${token})`;
        return [name, getComputedStyle(probe).color];
      }),
    ) as unknown as SignColours;
    const ratio = Math.min(3, Math.ceil(window.devicePixelRatio || 1));
    return { image: drawSign(glyph, colours, ratio), ratio };
  }, []);

  // MapLibre, loaded only now: it is by far the heaviest thing in the app, and nothing waits for it.
  const styled = useRef<{ key: string; theme: MapTheme; style?: ReturnType<typeof buildStyle> }>({ key, theme });
  const measured = frame !== undefined;
  useEffect(() => {
    if (!basemap || !measured || !base.current) return;
    let cancelled = false;
    let created: MapLibreMap | undefined;
    const home = root.current;
    const layer = pins.current;
    void import('maplibre-gl')
      .then(({ Map, setWorkerUrl }) => {
        if (cancelled || !base.current) return;
        const { frame, camera, look, area } = latest.current;
        const style = buildStyle({ ...look, tiles: MAP_TILES_URL, area: area?.data });
        styled.current = { key: styleKey(look), theme: look.theme, style };
        // The worker is served from our own origin (scripts/copy-map-worker.mjs).
        setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
        created = new Map({
          container: base.current,
          style,
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
        const live = created;

        live.on('move', place);
        live.on('resize', place);

        // The area layer's signs are drawn when the map first needs one.
        live.setMissingStyleImageResolver((id) => {
          const glyph = SIGNS.find((candidate) => id === AREA_ICON + candidate);
          const drawn = glyph && sign(glyph);
          if (drawn && !live.hasImage(id)) live.addImage(id, drawn.image, { pixelRatio: drawn.ratio });
        });

        // A press on one of those signs picks its pharmacy: the nearest one within a fingertip of the press.
        const signAt = (point: { x: number; y: number }): string | undefined => {
          if (!live.getLayer(AREA_LAYER)) return undefined;
          const reach = PICK_WITHIN_PX;
          let nearest: { id: string; distance: number } | undefined;
          for (const feature of live.queryRenderedFeatures([[point.x - reach, point.y - reach], [point.x + reach, point.y + reach]], { layers: [AREA_LAYER] })) {
            if (feature.geometry.type !== 'Point') continue;
            const at = live.project(feature.geometry.coordinates as [number, number]);
            const distance = Math.hypot(at.x - point.x, at.y - point.y);
            if (distance <= reach && (!nearest || distance < nearest.distance)) nearest = { id: String(feature.properties.id), distance };
          }
          return nearest?.id;
        };
        live.on('click', (event) => {
          // A press on one of the app's own markers is that marker's: it has its own handler.
          if ((event.originalEvent.target as Element | null)?.closest?.('[data-pin]')) return;
          const id = signAt(event.point);
          if (id !== undefined) latest.current.onPick?.(id);
        });
        let pointing = false;
        live.on('mousemove', (event) => {
          const over = !live.isMoving() && signAt(event.point) !== undefined;
          if (over === pointing) return;
          pointing = over;
          live.getCanvas().style.cursor = over ? 'pointer' : '';
        });

        // Moved by hand, the map may show squares whose pharmacies aren't on the device yet. A move
        // the app made itself (framing the results, following a walk) asks for nothing: what is
        // loaded then follows from where the user looks, never from where they are.
        if (home) home.dataset.zoom = live.getZoom().toFixed(2);
        live.on('moveend', (event) => {
          if (home) home.dataset.zoom = live.getZoom().toFixed(2);
          if (!('originalEvent' in event) && !(event as { byHand?: boolean }).byHand) return;
          const bounds = live.getBounds();
          latest.current.onView?.({ north: bounds.getNorth(), south: bounds.getSouth(), west: bounds.getWest(), east: bounds.getEast() });
        });

        // The markers move into the element MapLibre listens on, so a drag or a pinch that begins
        // on one of them reaches the map. Being moved would play their switching-on again: it has been played.
        if (layer) {
          for (const capsule of layer.querySelectorAll<HTMLElement>('[data-lit]')) capsule.style.animation = 'none';
          live.getCanvasContainer().appendChild(layer);
        }
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
      // The markers come back out before the map takes its elements away.
      if (layer && home && layer.parentElement !== home) home.appendChild(layer);
      created?.remove();
      setMode('plain');
    };
    // The map is made once; what changes afterwards is handled by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basemap, measured]);

  // A new sun or a new step of dusk: the same map with a few colours and its light changed. The
  // style is not set again for it: that would go through every layer and source for a handful of
  // properties. Only another theme, which has other layers, sets the style as a whole.
  useEffect(() => {
    const live = map.current;
    const from = styled.current;
    if (mode !== 'live' || !live || from.key === key) return;
    const { look, area } = latest.current;
    const style = buildStyle({ ...look, tiles: MAP_TILES_URL });
    const changes = from.style && styleChanges(from.style, style);
    if (changes) {
      for (const change of changes) {
        if (change.kind === 'paint') live.setPaintProperty(change.layer, change.property as never, change.value as never);
        else live.setLayoutProperty(change.layer, change.property as never, change.value as never);
      }
      if (style.light) live.setLight(style.light);
    } else {
      live.setStyle({ ...style, sources: { ...style.sources, [AREA_SOURCE]: { type: 'geojson', data: area?.data ?? NO_AREA } } });
    }
    // The signs follow the theme, not the sun.
    if (from.theme !== look.theme) {
      for (const glyph of SIGNS) {
        const drawn = live.hasImage(AREA_ICON + glyph) && sign(glyph);
        if (drawn) live.updateImage(AREA_ICON + glyph, drawn.image);
      }
    }
    styled.current = { key, theme: look.theme, style };
  }, [key, mode, sign]);

  // The pharmacies of the area layer. Its key changes when a tile arrives, when the list is ranked
  // again, and when one of them opens or closes: not on every minute's tick.
  const areaKey = area?.key ?? '';
  useEffect(() => {
    const live = map.current;
    if (mode !== 'live' || !live) return;
    const give = () => {
      if (map.current !== live) return;
      const data = latest.current.area?.data ?? NO_AREA;
      const source = live.getSource(AREA_SOURCE) as GeoJSONSource | undefined;
      // Before the style has settled there is no source yet: the data waits for it.
      if (!source) return void live.once('style.load', give);
      void source.setData(data as never);
      if (root.current) root.current.dataset.area = String(data.features.length);
    };
    give();
  }, [areaKey, mode]);

  // The sheet opened or closed, or the layout changed: keep the camera's centre in the part of the map that shows.
  const pad = frame?.pad;
  useEffect(() => {
    const frame = latest.current.frame;
    if (mode !== 'live' || !frame) return;
    map.current?.easeTo({ padding: cameraPadding(frame), duration: 200 });
  }, [pad, desktop, mode]);

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
    if (map.current) map.current.easeTo({ zoom: map.current.getZoom() + step, duration: 200 }, { byHand: true });
    else setMoved({ framing, camera: { ...camera, zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, camera.zoom + step)) } });
  };
  const recentre = () => {
    const zoom = cameraOf(view).zoom;
    if (map.current && frame) map.current.easeTo({ center: [here.lon, here.lat], zoom: Math.max(map.current.getZoom(), zoom), padding: cameraPadding(frame), duration: 400 }, { byHand: true });
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
      <span ref={colourProbe} aria-hidden="true" className={styles.colourProbe} />
      {basemap && <div ref={base} className={styles.base} />}

      <div
        ref={pins}
        className={styles.pins}
        // A mouse drag that begins on a marker moves the map and ends on the same marker: that is not a press on it.
        onPointerDownCapture={(event) => {
          pressed.current = { x: event.clientX, y: event.clientY };
        }}
        onClickCapture={(event) => {
          const from = pressed.current;
          // A click from the keyboard has no press before it and no distance to measure.
          if (event.detail > 0 && from && Math.hypot(event.clientX - from.x, event.clientY - from.y) > DRAG_FROM_PX) event.stopPropagation();
        }}
      >
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
            data-chip={chip.id}
            className={cx(styles.edge, 'tnum')}
            aria-label={(pharmacy.id === nearestOpenId ? t.map.edgeNearest : t.map.edge)(fullName(i18n, pharmacy, needsStreet.has(pharmacy.id)), way.primary.long, t.map.directions[chip.side])}
            onClick={() => onSelect?.(pharmacy)}
          >
            <span data-arrow className={styles.arrow}>
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
