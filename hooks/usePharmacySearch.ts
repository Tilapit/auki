'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { canLocate, locateOnce, locatedBefore, locatesOnArrival, locationPermission, rememberLocated, WAITING_AFTER_MS, wallClock } from '@/lib/geolocation';
import { loadGuidance } from '@/lib/guidance';
import { placeFor } from '@/lib/handoff';
import { deviceHandoff } from './useHandoff';
import { deviceHome } from '@/lib/home';
import type { Locale } from '@/lib/i18n';
import { RERANK_GAP_SECONDS, movedEnough } from '@/lib/live';
import type { Bounds } from '@/lib/map/area';
import { Tiles, findFarOpen, findPharmacies, shownIds, type AskWalks } from '@/lib/search';
import { forgetLastSearch, readLastSearch, saveLastSearch, type LastSearch } from '@/lib/session';
import { APPROXIMATE_OVER_METERS, initialState, isMapView, reducer, type DevicePosition, type Position, type State } from '@/lib/state';
import type { TilePharmacy } from '@/lib/tiles';
import { WAKE_METHOD, WALKING_PATH, WALKING_WAIT_MS, readWalks, wakesNow, walkingBody } from '@/lib/walking';

/** A tile that takes longer than this counts as not loaded. */
const TILE_TIMEOUT_MS = 10_000;

/** Loads one of our own JSON files. The path names a square; no position is in it (PLAN.md 7.6). */
function loader(signal: AbortSignal) {
  return async (path: string): Promise<unknown> => {
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal.addEventListener('abort', abort);
    const timer = window.setTimeout(abort, TILE_TIMEOUT_MS);
    try {
      const response = await fetch(path, { signal: controller.signal });
      if (!response.ok) throw new Error(String(response.status));
      return await response.json();
    } finally {
      window.clearTimeout(timer);
      signal.removeEventListener('abort', abort);
    }
  };
}

/**
 * Walking times to the candidates: the one request that carries the position (PLAN.md 7.6).
 * It has a second and a half. If they haven't come by then, or the service says it can't
 * give them, the answer is undefined, the list is shown by straight line and says so, and
 * an answer that comes later is dropped: the list is never reordered (PLAN.md 7.1, step 5).
 */
function walksFrom(position: { lat: number; lon: number }, signal: AbortSignal): AskWalks {
  return async (candidates) => {
    // Without a connection there is nothing to wait for.
    if (navigator.onLine === false) return undefined;
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal.addEventListener('abort', abort);
    const timer = window.setTimeout(abort, WALKING_WAIT_MS);
    try {
      const response = await fetch(WALKING_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: walkingBody(position, candidates.map((found) => found.pharmacy)),
        signal: controller.signal,
      });
      if (!response.ok) return undefined;
      return readWalks(await response.json(), candidates);
    } catch {
      return undefined;
    } finally {
      window.clearTimeout(timer);
      signal.removeEventListener('abort', abort);
    }
  };
}

/**
 * Wakes the function that will be asked for walking times (PLAN.md 7.1, step 4), when the app
 * starts looking for a position. The request carries nothing: no position (there is none yet),
 * no query, no body. Its answer is empty and nobody waits for it; if it fails, the walking
 * request finds out for itself. Not sent again within a minute (lib/walking.ts).
 */
let wokenAt: number | undefined;
function wakeWalking(): void {
  if (navigator.onLine === false) return;
  const now = Date.now();
  if (!wakesNow(wokenAt, now)) return;
  wokenAt = now;
  void fetch(WALKING_PATH, { method: WAKE_METHOD, cache: 'no-store' }).catch(() => undefined);
}

const nowSeconds = (): number => Math.floor(Date.now() / 1000);

const NOTHING: readonly TilePharmacy[] = [];

interface FoundPlace {
  lat: number;
  lon: number;
  label: string;
  country?: string;
}

/** `places`: what the name can mean, best first. `place`: the first of them, which is all an older answer has. */
interface PlaceAnswer {
  place: FoundPlace | null;
  places?: FoundPlace[];
}

export interface PharmacySearch {
  state: State;
  /** Asks the device for its position. Called from a button press, or on arrival when permission is given or this is a later visit. */
  locate: () => void;
  openSearch: () => void;
  /** Looks a typed place name up through our server. */
  search: (query: string) => void;
  /** The same from a map view: opens the place search and looks the name up. */
  searchFrom: (query: string) => void;
  /** Loads the tiles for the same position again. */
  retry: () => void;
  /** Looks for an open pharmacy farther away, when none of those shown is open at `now`. */
  checkFarOpen: (now: number) => void;
  /** A new fix from the device: after about 300 m the results are ranked again around it. */
  follow: (fix: { lat: number; lon: number; accuracy: number }) => void;
  /** Every pharmacy on the tiles the device holds for this search: the map draws them all. */
  area: readonly TilePharmacy[];
  /** The map was moved by hand: loads the squares that came into view, if they aren't here yet. */
  showArea: (bounds: Bounds) => void;
  back: () => void;
}

/**
 * Owns the reducer, the two ways to a position (the device's location and a place name), the
 * search through the tiles, and the request for walking times that ends it.
 */
export function usePharmacySearch(locale: Locale): PharmacySearch {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [area, setArea] = useState(NOTHING);
  const attempt = useRef(0);
  const lookup = useRef<AbortController | null>(null);
  // The search this tab showed last, read once on arrival: undefined until then, null when there is none.
  const restored = useRef<LastSearch | null | undefined>(undefined);
  // When each position was fixed. A search that came back keeps the time it was made at.
  const fixedAt = useRef(new WeakMap<Position, number>());

  const locate = useCallback(() => {
    if (!canLocate()) {
      dispatch({ type: 'unsupported' });
      return;
    }
    const id = ++attempt.current;
    dispatch({ type: 'locate', attempt: id });
    // The position is on its way: the walking function starts now, and is awake when it is needed.
    wakeWalking();
    // An ignored permission prompt never calls back: say that we are waiting.
    const timer = window.setTimeout(() => dispatch({ type: 'waiting', attempt: id }), WAITING_AFTER_MS);
    void locateOnce().then((outcome) => {
      window.clearTimeout(timer);
      // It worked here: the next visit asks at once, without the first window.
      if (outcome.ok) rememberLocated();
      dispatch(
        outcome.ok
          ? { type: 'located', attempt: id, lat: outcome.lat, lon: outcome.lon, accuracy: outcome.accuracy, at: wallClock(new Date()) }
          : { type: 'locationFailed', attempt: id, problem: outcome.problem },
      );
    });
  }, []);

  const openSearch = useCallback(() => dispatch({ type: 'openSearch' }), []);

  const search = useCallback(
    (query: string) => {
      lookup.current?.abort();
      const controller = new AbortController();
      lookup.current = controller;
      dispatch({ type: 'lookup', query });
      // A place's name is the other way to a position: the walking function has the lookup's time to start in.
      wakeWalking();
      fetch(`/api/geocode?q=${encodeURIComponent(query)}&lang=${locale}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error(String(response.status));
          const answer = (await response.json()) as PlaceAnswer;
          // A hand-off link may have named a country (lib/handoff.ts): the answer there comes first.
          // The choice is made here, from an answer that is the same for everyone: the request
          // above carries the typed name and the language, as it does without a link.
          const places = Array.isArray(answer.places) && answer.places.length > 0 ? answer.places : answer.place ? [answer.place] : [];
          const place = placeFor(places, deviceHandoff().country);
          dispatch(
            place
              ? { type: 'placeFound', query, lat: place.lat, lon: place.lon, label: place.label, at: wallClock(new Date()) }
              : { type: 'placeNotFound', query },
          );
        })
        .catch(() => {
          if (!controller.signal.aborted) dispatch({ type: 'lookupFailed', query, offline: navigator.onLine === false });
        });
    },
    [locale],
  );

  const searchFrom = useCallback(
    (query: string) => {
      dispatch({ type: 'openSearch' });
      search(query);
    },
    [search],
  );

  // The search through the tiles: once for each position, and again for the same one on a retry.
  const tiles = useRef<{ position: Position; store: Tiles; controller: AbortController; ranking?: boolean; tried?: { lat: number; lon: number }; rankedAt: number } | null>(null);
  useEffect(() => {
    if (!isMapView(state)) {
      tiles.current?.controller.abort();
      tiles.current = null;
      return;
    }
    if (state.view !== 'searching' || tiles.current?.position === state.position) return;
    tiles.current?.controller.abort();
    const { position } = state;
    const controller = new AbortController();
    const store = new Tiles(loader(controller.signal));
    // A search that came back from the tab's storage has its walking times with it: the list is
    // in the order it was left in, and the one request that carries the position is not made again.
    const kept = restored.current?.position === position ? restored.current : undefined;
    const times: AskWalks = kept ? async () => kept.walks : walksFrom(position, controller.signal);
    // The pharmacies are known here, a moment before their walking times. Where one of them is in
    // another country than the prescription's, the guidance is asked for now and not when the
    // results appear: the banner then comes with the card and not after it (lib/guidance.ts).
    // At home nothing is asked for.
    const home = deviceHome(locale);
    const walks: AskWalks = (candidates) => {
      if (candidates.some((found) => found.pharmacy.country && found.pharmacy.country !== home)) loadGuidance();
      return times(candidates);
    };
    // Ranked when the position was fixed: a device that has moved since is followed at its first fix.
    tiles.current = { position, store, controller, rankedAt: kept ? kept.fixedAt : Date.now() };
    void findPharmacies(store, position, nowSeconds(), walks).then((outcome) => {
      if (controller.signal.aborted) return;
      if (outcome.kind === 'results') setArea(store.all());
      if (outcome.kind === 'results') dispatch({ type: 'found', position, result: outcome.result });
      else if (outcome.kind === 'none') dispatch({ type: 'noneFound', position });
      else if (outcome.kind === 'notCovered') dispatch({ type: 'notCovered', position, country: outcome.country });
      else dispatch({ type: 'searchFailed', position, offline: navigator.onLine === false });
    });
  }, [state, locale]);

  useEffect(() => () => tiles.current?.controller.abort(), []);

  const retry = useCallback(() => dispatch({ type: 'retry' }), []);

  // Offline: the search continues by itself when the connection returns.
  const waitingForConnection = state.view === 'failed' && state.offline;
  useEffect(() => {
    if (!waitingForConnection) return;
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [waitingForConnection, retry]);

  // What is on screen, for the callbacks below.
  const shown = useRef(state);
  useEffect(() => {
    shown.current = state;
  }, [state]);

  const checkFarOpen = useCallback((now: number) => {
    const current = tiles.current;
    if (!current) return;
    const listed = shown.current.view === 'results' && shown.current.position === current.position ? shownIds(shown.current.result) : undefined;
    void findFarOpen(current.store, current.position, now, listed)
      .catch(() => undefined)
      .then((farOpen) => {
        if (current.controller.signal.aborted) return;
        // The wider search may have brought tiles of its own: the map shows their pharmacies too.
        setArea((shown) => (shown.length === current.store.count() ? shown : current.store.all()));
        dispatch({ type: 'farOpen', position: current.position, farOpen });
      });
  }, []);

  // Following a walk: the same tiles, ranked again around the new position. A tile is fetched
  // only if a new one has come within reach. The new position goes where the first one went:
  // into one request for walking times, and nowhere else.
  const follow = useCallback((fix: { lat: number; lon: number; accuracy: number }) => {
    const current = tiles.current;
    const from = current?.position;
    if (!current || !from || current.ranking || from.source !== 'device') return;
    if (shown.current.view !== 'results' || shown.current.position !== from) return;
    // From the last place tried, not only the last place ranked: a tile that fails is not asked for at every fix.
    if (!movedEnough(current.tried ?? from, fix) || !movedEnough(from, fix)) return;
    // And not more often than the budget for walking times bears.
    if (Date.now() - current.rankedAt < RERANK_GAP_SECONDS * 1000) return;
    current.ranking = true;
    current.rankedAt = Date.now();
    current.tried = { lat: fix.lat, lon: fix.lon };
    current.store.failed.clear();
    const position: DevicePosition = { source: 'device', lat: fix.lat, lon: fix.lon, accuracy: fix.accuracy, approximate: fix.accuracy > APPROXIMATE_OVER_METERS };
    void findPharmacies(current.store, position, nowSeconds(), walksFrom(position, current.controller.signal))
      .catch(() => undefined)
      .then((outcome) => {
        current.ranking = false;
        // Anything but results (a tile that didn't load, the edge of the coverage) leaves the list as it is.
        if (current.controller.signal.aborted || tiles.current !== current || outcome?.kind !== 'results') return;
        current.position = position;
        setArea(current.store.all());
        dispatch({ type: 'moved', from, position, at: wallClock(new Date()), result: outcome.result });
      });
  }, []);

  // The map shows every pharmacy on the tiles the device holds. Moved by hand to a new area, it
  // asks for that area's squares: tile numbers that follow from the map, never from the position.
  const showArea = useCallback((bounds: Bounds) => {
    const current = tiles.current;
    if (!current || shown.current.view !== 'results') return;
    void current.store
      .loadArea(bounds)
      .catch(() => false)
      .then((arrived) => {
        if (arrived && !current.controller.signal.aborted && tiles.current === current) setArea(current.store.all());
      });
  }, []);

  // The tab keeps its last search, so that results left for a map app or another page of ours are
  // there again when the tab is loaded anew (lib/session.ts). Kept while they are on screen.
  useEffect(() => {
    if (state.view !== 'results') return;
    const at = fixedAt.current.get(state.position) ?? Date.now();
    fixedAt.current.set(state.position, at);
    saveLastSearch({ position: state.position, at: state.at, fixedAt: at, walks: state.result.walks });
  }, [state]);

  // On arrival: the search this tab showed last, if it is recent. Otherwise: without the API or
  // HTTPS, straight to place search. With permission already given, or on a later visit after a
  // "show pharmacies near me" that worked, straight to locating and the map. Otherwise, on a
  // first visit, wait for the button.
  useEffect(() => {
    if (restored.current === undefined) restored.current = readLastSearch(Date.now()) ?? null;
    const last = restored.current;
    if (last) {
      fixedAt.current.set(last.position, last.fixedAt);
      dispatch({ type: 'restore', position: last.position, at: last.at });
      return;
    }
    if (!canLocate()) {
      dispatch({ type: 'unsupported' });
      return;
    }
    let live = true;
    const before = locatedBefore();
    void locationPermission().then((permission) => {
      if (live && locatesOnArrival(permission, before)) locate();
    });
    return () => {
      live = false;
    };
  }, [locate]);

  // The browser's back button steps through the views: the map, the search box, the first window.
  // Searching, results and the problems after them are one step: the map view.
  const popped = useRef(false);
  const stage = isMapView(state) ? 'searching' : state.view;
  const previous = useRef(stage);
  useEffect(() => {
    const from = previous.current;
    previous.current = stage;
    // The user has left the results, for the first window, the search box or a new position: the tab forgets them.
    if (from === 'searching' && stage !== 'searching') forgetLastSearch();
    if (popped.current) {
      popped.current = false;
      return;
    }
    if (stage === from) return;
    const forward = stage === 'searching' || (state.view === 'search' && state.problem !== 'unsupported');
    // A retry lands on the entry it started from: no second copy of it.
    if (forward && window.history.state?.view !== stage) window.history.pushState({ view: stage }, '');
  }, [state, stage]);

  useEffect(() => {
    let fragment = window.location.hash;
    const onPop = (event: PopStateEvent) => {
      // A fragment that changes is a step in the browser's history too, and no step between our
      // views: a hand-off link opened in the tab that is already here (PLAN.md 7.8). The view
      // stays. An entry made that way is marked as the view it was made on, so that going back
      // from a later view lands on it as on any other.
      const view: unknown = event.state?.view;
      const moved = window.location.hash !== fragment;
      fragment = window.location.hash;
      if (moved && (view === undefined || view === previous.current)) {
        if (view === undefined && (previous.current === 'searching' || previous.current === 'search')) window.history.replaceState({ view: previous.current }, '');
        return;
      }
      popped.current = true;
      lookup.current?.abort();
      attempt.current++;
      dispatch({ type: 'back', to: event.state?.view === 'search' ? 'search' : 'ready' });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const back = useCallback(() => {
    // With our own entry on top, going back is the browser's job; otherwise just show the first window.
    if (window.history.state?.view) window.history.back();
    else dispatch({ type: 'back', to: 'ready' });
  }, []);

  // The pharmacies of an earlier search are not this one's: the map gets them only with the results they came with.
  return { state, locate, openSearch, search, searchFrom, retry, checkFarOpen, follow, area: state.view === 'results' ? area : NOTHING, showArea, back };
}
