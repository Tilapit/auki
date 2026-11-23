'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { canLocate, locateOnce, locationPermission, WAITING_AFTER_MS, wallClock } from '@/lib/geolocation';
import type { Locale } from '@/lib/i18n';
import { initialState, reducer, type State } from '@/lib/state';

interface PlaceAnswer {
  place: { lat: number; lon: number; label: string } | null;
}

export interface PharmacySearch {
  state: State;
  /** Asks the device for its position. Only ever called from a button press, or when permission is already given. */
  locate: () => void;
  openSearch: () => void;
  /** Looks a typed place name up through our server. */
  search: (query: string) => void;
  back: () => void;
}

/**
 * Owns the reducer and the two ways to a position: the device's location and a place name.
 * From M3 on it also fetches the tiles, and from M5 the walking times.
 */
export function usePharmacySearch(locale: Locale): PharmacySearch {
  const [state, dispatch] = useReducer(reducer, initialState);
  const attempt = useRef(0);
  const lookup = useRef<AbortController | null>(null);

  const locate = useCallback(() => {
    if (!canLocate()) {
      dispatch({ type: 'unsupported' });
      return;
    }
    const id = ++attempt.current;
    dispatch({ type: 'locate', attempt: id });
    // An ignored permission prompt never calls back: say that we are waiting.
    const timer = window.setTimeout(() => dispatch({ type: 'waiting', attempt: id }), WAITING_AFTER_MS);
    void locateOnce().then((outcome) => {
      window.clearTimeout(timer);
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
      fetch(`/api/geocode?q=${encodeURIComponent(query)}&lang=${locale}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error(String(response.status));
          const { place } = (await response.json()) as PlaceAnswer;
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

  // On arrival: without the API or HTTPS, straight to place search. With permission
  // already given, straight to the map. Otherwise wait for the button.
  useEffect(() => {
    if (!canLocate()) {
      dispatch({ type: 'unsupported' });
      return;
    }
    let live = true;
    void locationPermission().then((permission) => {
      if (live && permission === 'granted') locate();
    });
    return () => {
      live = false;
    };
  }, [locate]);

  // The browser's back button steps through the views: results, the search box, the first window.
  const popped = useRef(false);
  const previous = useRef(state.view);
  useEffect(() => {
    const from = previous.current;
    previous.current = state.view;
    if (popped.current) {
      popped.current = false;
      return;
    }
    if (state.view === from) return;
    const forward = state.view === 'searching' || (state.view === 'search' && state.problem !== 'unsupported');
    // A retry lands on the entry it started from: no second copy of it.
    if (forward && window.history.state?.view !== state.view) window.history.pushState({ view: state.view }, '');
  }, [state]);

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
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

  return { state, locate, openSearch, search, back };
}
