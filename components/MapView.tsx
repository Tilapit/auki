'use client';

import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useRouteLine, type RouteFor } from '@/hooks/useRouteLine';
import { lowerFirst } from '@/lib/format';
import { useI18n } from '@/lib/i18n/context';
import { NO_AREA, type AreaLayer, type Bounds } from '@/lib/map/area';
import { boxOf, cameraOf, edgeChip, fit, MAP_PIXEL_RATIO, MAX_ZOOM, metersPerPixel, MIN_ZOOM, projector, spread, type Box, type Camera, type Insets, type Project } from '@/lib/map/camera';
import { crowded, declutter, hasRoom, signScale, targetOf } from '@/lib/map/declutter';
import { AREA_ICON, AREA_LAYER, AREA_SOURCE, ROUTE_SOURCE, buildStyle, paletteFor, routeData, styleChanges, styleKey, type MapTheme } from '@/lib/map/style';
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
  /**
   * The selected pharmacy's details are open: when the phone's sheet grows over its marker, the
   * map moves so that the marker is in view again above the sheet.
   */
  keepSelected?: boolean;
  /** One of the layer's signs was pressed: its pharmacy's id. */
  onPick?: (id: string) => void;
  /** The map was moved by hand: what it shows now, for loading the squares that came into view. */
  onView?: (bounds: Bounds) => void;
  /**
   * The pharmacy the walking route is drawn to, and where the line comes from (PLAN.md 7.1,
   * step 7). The map asks for it only once it is drawing: a line it can't draw is not asked for.
   */
  routeTo?: Pharmacy;
  routeFor?: RouteFor;
  /** /dev/map only: another limit for the map's device pixels per CSS pixel, to compare on a phone. */
  pixels?: number;
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
/** A marker's room before it has been measured: about a capsule with a time. */
const UNMEASURED = { width: 78, height: 30 };
/** At most this many chips: the nearest open ones that are off the map. */
const CHIPS = 3;
/** A chip's room before it has been measured: the arrow, the cross and a time. */
const CHIP_UNMEASURED = { width: 112, height: 44 };
/** A press this near a sign of the area layer counts as a press on it: the signs are 20 px, a fingertip is 44. */
const PICK_WITHIN_PX = 18;
/**
 * A press that travelled farther than this was a drag of the map, not a press on what it began
 * on. A mouse is exact. A thumb rolls: browsers themselves still call a touch that has moved
 * this far a tap, and a tap the browser has made a click of is not ours to throw away.
 */
const DRAG_FROM_PX = { mouse: 6, finger: 12 };
/** The click a mouse makes when it lets go after such a drag comes within this time of letting go. */
const CLICK_AFTER_DRAG_MS = 400;
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
 * the page), and once MapLibre is drawing, everything that lies on the map lives inside the
 * element it listens on: the markers, the edge chips and the credit. A drag or a pinch that
 * begins on any of them then moves the map like any other, and a press is still a press.
 */
export function MapView({ scene, needsStreet, selectedId, nearestOpenId, onSelect, userOnly, basemap = false, now, you, reveal, area, extra, keepSelected, onPick, onView, routeTo, routeFor, pixels = MAP_PIXEL_RATIO }: Props) {
  const i18n = useI18n();
  const { t, locale } = i18n;

  const root = useRef<HTMLDivElement>(null);
  const base = useRef<HTMLDivElement>(null);
  const pins = useRef<HTMLDivElement>(null);
  const colourProbe = useRef<HTMLSpanElement>(null);
  const padProbe = useRef<HTMLSpanElement>(null);
  const themeProbe = useRef<HTMLSpanElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  /** Where the press on a marker, a chip or the credit began, and when it ended if it had become a drag of the map: the events' own clock. */
  const pressed = useRef<{ x: number; y: number } | null>(null);
  const dragEnded = useRef<number | null>(null);
  /** How much room each marker takes when drawn in full, measured after every render, and which are signs right now. */
  const sizes = useRef(new Map<string, { width: number; height: number }>());
  const signs = useRef(new Set<string>());
  /** What else lies on the map, in its own pixels, measured with the markers: the credit, the zoom buttons, and each chip's size. */
  const lying = useRef<{ credit: Box[]; controls: Box[]; chips: Map<string, { width: number; height: number }> }>({ credit: [], controls: [], chips: new Map() });

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

  // The walking route to the selected pharmacy, once MapLibre is there to draw it.
  const route = useRouteLine(routeFor, mode === 'live' && !userOnly ? routeTo : undefined);

  // What the handlers below read: always the latest, without being set up again.
  const current = { all, lit, here, frame, camera, framing, selectedId, nearestOpenId, keepSelected, accuracy: you?.accuracy, approximate: scene.user.approximate, look: { theme, locale, sun }, area, route, onPick, onView };
  const latest = useRef(current);
  useLayoutEffect(() => {
    latest.current = current;
  });

  /** Puts every marker, the dot and the chips where the current camera says they are. */
  const place = useCallback(() => {
    const { all, lit, here, frame, camera, selectedId, nearestOpenId, accuracy, approximate } = latest.current;
    if (!frame) return;
    const live = map.current;
    const project: Project = live
      ? (lat, lon) => live.project([lon, lat])
      : projector(camera, frame, cameraPadding(frame));
    const zoom = live ? live.getZoom() : camera.zoom;

    // Whole pixels: a marker's text is then drawn the same way every time, and stays sharp.
    const whole = (lat: number, lon: number) => {
      const point = project(lat, lon);
      return { x: Math.round(point.x), y: Math.round(point.y) };
    };
    const dot = whole(here.lat, here.lon);
    const points = new Map(all.map((pharmacy) => [pharmacy.id, whole(pharmacy.lat, pharmacy.lon)]));
    // Where markers would lie on top of each other or on the dot, the one that matters most is
    // drawn in full and the others as signs: the selected pharmacy, then the nearest open one,
    // the other open ones from the nearest, then the rest.
    const rank = (id: string, index: number) => (id === selectedId ? -3 : id === nearestOpenId ? -2 : lit.some((pharmacy) => pharmacy.id === id) ? -1 : 0) * all.length + index;
    const order = all
      .map((pharmacy, index) => ({ id: pharmacy.id, rank: rank(pharmacy.id, index), ...points.get(pharmacy.id)!, ...(sizes.current.get(pharmacy.id) ?? UNMEASURED), small: signs.current.has(pharmacy.id) }))
      .sort((a, b) => a.rank - b.rank);
    // A marker that the bar, the sheet, the credit or the map's edge hides too much of, or leaves
    // no room to press, is not drawn (lib/map/declutter.ts). The one the keyboard is on stays as
    // it is until the keyboard has left it: focus is never taken from under it.
    const { small, shift, away } = declutter(order, dot, zoom, { clear: boxOf(frame, cameraPadding(frame)), fixed: lying.current.credit });
    signs.current = small;
    const focused = pins.current?.contains(document.activeElement) ? document.activeElement?.closest<HTMLElement>('[data-pin]')?.dataset.pin : undefined;
    // A marker that is a sign is the size of the map's own signs at this zoom.
    const scale = signScale(zoom).toFixed(2);
    if (root.current && root.current.dataset.signScale !== scale) {
      root.current.dataset.signScale = scale;
      root.current.style.setProperty('--sign-scale', scale);
    }

    // An open pharmacy the map does not show gets a chip on the edge, on the line towards it: the
    // nearest ones. A chip keeps off the first marker, the answer; any other marker it lies on
    // is no button while it does.
    const box = boxOf(frame, chipInsets(frame));
    const first = order[0];
    const nudge = (id: string) => (shift && id === first?.id ? shift : undefined);
    const centre = (id: string) => {
      const at = points.get(id)!;
      return { x: at.x + (nudge(id)?.x ?? 0), y: at.y + (nudge(id)?.y ?? 0) };
    };
    const shown = order.filter((marker) => !away.has(marker.id) || marker.id === focused);
    const targets = shown.map((marker) => ({ id: marker.id, small: small.has(marker.id), ...targetOf(centre(marker.id), marker, small.has(marker.id)) }));
    const off = lit.flatMap((pharmacy) => {
      const chip = away.has(pharmacy.id) && pharmacy.id !== focused ? edgeChip(project(pharmacy.lat, pharmacy.lon), box, undefined, true) : undefined;
      return chip ? [{ ...chip, id: pharmacy.id }] : [];
    }).slice(0, CHIPS);
    const boxesOf = (placed: typeof off) =>
      placed.map((chip) => {
        const { width, height } = lying.current.chips.get(chip.id) ?? CHIP_UNMEASURED;
        return { left: chip.x - width / 2, top: chip.y - height / 2, right: chip.x + width / 2, bottom: chip.y + height / 2 };
      });
    let chips = spread(off, box);
    // Only when a chip would take the answer's room does it move further along its edge.
    const answer = first && targets[0]?.id === first.id ? targets[0] : undefined;
    if (answer && !hasRoom(answer, [...lying.current.controls, ...boxesOf(chips)])) chips = spread(off, box, undefined, [answer]);
    const chipBoxes = boxesOf(chips);
    const still = crowded(targets, [...lying.current.controls, ...chipBoxes]);

    for (const element of root.current?.querySelectorAll<HTMLElement>('[data-pin]') ?? []) {
      const id = element.dataset.pin ?? '';
      if (id === YOU) {
        element.style.transform = `translate(${dot.x}px, ${dot.y}px)`;
        // The halo is the accuracy the device reports, in the map's own scale, and never smaller than the canvas's 64 px.
        const radius = accuracy !== undefined ? accuracy / metersPerPixel(here.lat, zoom) : approximate ? 95 : 32;
        const halo = `${Math.round(Math.min(Math.max(radius, 32), 600) * 2)}px`;
        if (element.dataset.halo !== halo) {
          element.dataset.halo = halo;
          element.style.setProperty('--halo', halo);
        }
        continue;
      }
      const at = points.get(id);
      if (!at) continue;
      // The first in that order stands just clear of the dot when it would have covered it.
      const to = centre(id);
      element.style.transform = `translate(${to.x}px, ${to.y}px)`;
      if (small.has(id) !== (element.dataset.small !== undefined)) {
        if (small.has(id)) element.dataset.small = '';
        else delete element.dataset.small;
      }
      if (id === focused) continue;
      if (away.has(id) !== (element.dataset.away !== undefined)) {
        if (away.has(id)) element.dataset.away = '';
        else delete element.dataset.away;
      }
      // Drawn, and no button: it takes no press and no focus, and a screen reader passes it by.
      if (still.has(id) !== element.inert) element.inert = still.has(id);
    }

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

  // After every render the markers are where they belong, before the browser paints. Their
  // sizes are read here and only here: a pan or a pinch then reads nothing from the page.
  useLayoutEffect(() => {
    const measured = new Map<string, { width: number; height: number }>();
    for (const element of root.current?.querySelectorAll<HTMLElement>('[data-pin]') ?? []) {
      const full = element.querySelector<HTMLElement>('[data-full]');
      if (full && full.offsetWidth > 0) measured.set(element.dataset.pin ?? '', { width: full.offsetWidth, height: full.offsetHeight });
    }
    sizes.current = measured;
    // What else lies on the map: where the credit and the zoom buttons are, and how large each chip is.
    const frameBox = root.current?.getBoundingClientRect();
    const boxesOf = (selector: string): Box[] =>
      [...(root.current?.querySelectorAll<HTMLElement>(selector) ?? [])].flatMap((element) => {
        const box = element.getBoundingClientRect();
        return frameBox && box.width > 0 ? [{ left: box.left - frameBox.left, top: box.top - frameBox.top, right: box.right - frameBox.left, bottom: box.bottom - frameBox.top }] : [];
      });
    lying.current = {
      credit: boxesOf('[data-credit]'),
      controls: boxesOf('[data-controls] button'),
      chips: new Map([...(root.current?.querySelectorAll<HTMLElement>('[data-chip]') ?? [])].map((chip) => [chip.dataset.chip ?? '', { width: chip.offsetWidth, height: chip.offsetHeight }])),
    };
    place();
  });

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
          pixelRatio: Math.min(window.devicePixelRatio || 1, pixels),
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
          // A press on one of the app's own markers, chips or links is its own: each has its handler.
          if ((event.originalEvent.target as Element | null)?.closest?.('[data-on-map]')) return;
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

        // What lies on the map moves into the element MapLibre listens on, so a drag or a pinch that
        // begins on a marker, a chip or the credit reaches the map. Being moved would play the
        // markers' switching-on again: it has been played.
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
      live.setStyle({ ...style, sources: { ...style.sources, [AREA_SOURCE]: { type: 'geojson', data: area?.data ?? NO_AREA }, [ROUTE_SOURCE]: { type: 'geojson', data: routeData(latest.current.route) } } });
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
      // A map taken away before the data has settled is nothing to report.
      source.setData(data as never).catch(() => undefined);
      if (root.current) root.current.dataset.area = String(data.features.length);
    };
    give();
  }, [areaKey, mode]);

  // The route line: given to the map when it comes, taken away when another pharmacy is selected.
  const routeId = route ? routeTo?.id : undefined;
  useEffect(() => {
    const live = map.current;
    if (mode !== 'live' || !live) return;
    const give = () => {
      if (map.current !== live) return;
      const source = live.getSource(ROUTE_SOURCE) as GeoJSONSource | undefined;
      if (!source) return void live.once('style.load', give);
      source.setData(routeData(latest.current.route) as never).catch(() => undefined);
      if (root.current) root.current.dataset.route = latest.current.route ? (routeId ?? '') : '';
    };
    give();
  }, [route, routeId, mode]);

  /**
   * Where the camera has to go for the selected pharmacy to be in view in the part of the map
   * that the bar and the sheet leave free: nowhere when it already is, otherwise far enough to
   * show it together with the dot. Worked out for the frame as it is now, sheet included.
   */
  const showSelected = useCallback((): Camera | undefined => {
    const { all, here, frame, camera, selectedId } = latest.current;
    const target = all.find((pharmacy) => pharmacy.id === selectedId);
    if (!target || !frame) return undefined;
    const live = map.current;
    // The camera as it is, under the frame's own padding: the real map may still be easing to that padding.
    const centre = live?.getCenter();
    const zoom = live ? live.getZoom() : camera.zoom;
    const now: Camera = centre ? { lat: centre.lat, lon: centre.lng, zoom } : camera;
    const point = projector(now, frame, cameraPadding(frame))(target.lat, target.lon);
    const box = boxOf(frame, chipInsets(frame));
    if (point.x >= box.left && point.x <= box.right && point.y >= box.top && point.y <= box.bottom) return undefined;
    return fit([here, target], frame, { ...chipInsets(frame), bottom: Math.max(chipInsets(frame).bottom, frame.pad) }, { maxZoom: zoom });
  }, []);

  // The sheet opened or closed, or the layout changed: keep the camera's centre in the part of the
  // map that shows. With a pharmacy's details open, its marker stays in view above the sheet too.
  const pad = frame?.pad;
  useEffect(() => {
    const { frame, framing, keepSelected } = latest.current;
    if (!frame) return;
    const next = keepSelected ? showSelected() : undefined;
    if (mode === 'live') map.current?.easeTo({ ...(next ? { center: [next.lon, next.lat], zoom: next.zoom } : {}), padding: cameraPadding(frame), duration: next ? 300 : 200 });
    else if (next) setMoved({ framing, camera: next });
  }, [pad, desktop, mode, showSelected]);

  // A pharmacy picked in the list comes into view on the map, together with the dot.
  const picked = useRef(selectedId);
  useEffect(() => {
    if (picked.current === selectedId) return;
    picked.current = selectedId;
    const { frame, framing } = latest.current;
    const next = showSelected();
    if (!next || !frame) return;
    if (map.current) map.current.easeTo({ center: [next.lon, next.lat], zoom: next.zoom, padding: cameraPadding(frame), duration: 400 });
    else setMoved({ framing, camera: next });
  }, [selectedId, showSelected]);

  const zoomBy = (step: number) => {
    if (map.current) map.current.easeTo({ zoom: map.current.getZoom() + step, duration: 200 }, { byHand: true });
    else setMoved({ framing, camera: { ...camera, zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, camera.zoom + step)) } });
  };
  const recentre = () => {
    const zoom = cameraOf(view).zoom;
    if (map.current && frame) map.current.easeTo({ center: [here.lon, here.lat], zoom: Math.max(map.current.getZoom(), zoom), padding: cameraPadding(frame), duration: 400 }, { byHand: true });
    else setMoved({ framing, camera: { lat: here.lat, lon: here.lon, zoom } });
  };

  // The keyboard reaches every marker, wherever the map has been moved to. One that takes its
  // focus where it can't be seen, under the bar, the sheet, a chip or a control, or beyond the
  // map's edge, is brought to the middle of what shows: nothing focused is out of sight
  // (PLAN.md section 9). Only the keyboard's focus does this, and only then is anything
  // measured: a press selects the marker, and a selected one is framed already.
  const focusIntoView = (focused: Element) => {
    const id = focused.closest<HTMLElement>('[data-pin]')?.dataset.pin;
    if (id === undefined || !focused.matches(':focus-visible')) return;
    const { all, frame, camera, framing } = latest.current;
    const target = all.find((pharmacy) => pharmacy.id === id);
    if (!target || !frame) return;
    const at = focused.getBoundingClientRect();
    const hit = document.elementFromPoint(at.left + at.width / 2, at.top + at.height / 2);
    if (hit && focused.contains(hit)) return;
    const live = map.current;
    if (live) live.easeTo({ center: [target.lon, target.lat], padding: cameraPadding(frame), duration: 300 });
    else setMoved({ framing, camera: { lat: target.lat, lon: target.lon, zoom: camera.zoom } });
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
    <div ref={root} className={styles.map} data-map="pending" data-basemap={mode} data-reveal={reveal || undefined} style={ground} onFocus={(event) => focusIntoView(event.target)}>
      <span ref={padProbe} aria-hidden="true" className={styles.padProbe} />
      <span ref={themeProbe} aria-hidden="true" className={styles.themeProbe} />
      <span ref={colourProbe} aria-hidden="true" className={styles.colourProbe} />
      {/* Phone: the map's ground colour at the screen's upper edge, for the strip behind the status bar (see DuskScene). */}
      <span aria-hidden="true" className={styles.edge8} />
      {basemap && <div ref={base} className={styles.base} />}

      <div
        ref={pins}
        data-on-map
        className={styles.pins}
        // A drag that begins on a marker moves the map and ends on the same marker: the click that
        // follows is not a press on it. Only that click: one from the keyboard or a screen reader comes
        // without a drag before it, and one long after a drag is its own.
        onPointerDownCapture={(event) => {
          pressed.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUpCapture={(event) => {
          const from = pressed.current;
          pressed.current = null;
          const far = event.pointerType === 'mouse' ? DRAG_FROM_PX.mouse : DRAG_FROM_PX.finger;
          dragEnded.current = from && Math.hypot(event.clientX - from.x, event.clientY - from.y) > far ? event.timeStamp : null;
        }}
        onPointerCancelCapture={() => {
          pressed.current = null;
          dragEnded.current = null;
        }}
        onClickCapture={(event) => {
          const ended = dragEnded.current;
          dragEnded.current = null;
          if (ended === null || event.timeStamp - ended >= CLICK_AFTER_DRAG_MS) return;
          // Neither the marker's press nor the credit's link is followed.
          event.preventDefault();
          event.stopPropagation();
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

        {/* An open pharmacy the map does not show gets a chip on the edge, on the line towards it. */}
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

        {/* The credit lies on the map like a marker: a finger that lands on it can still move the map. */}
        <p data-credit className={styles.attribution}>
          {live && MAP_CREDITS.map((credit) => (
            <a key={credit.url} href={credit.url} draggable={false}>
              {credit.label}
            </a>
          ))}
          <a href={OSM_COPYRIGHT_URL} draggable={false}>{t.map.attribution}</a>
        </p>
      </div>

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

      <div data-controls className={styles.controls}>
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

    </div>
  );
}
