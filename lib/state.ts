/**
 * The app's states and the pure reducer that moves between them (PLAN.md 7.3): finding a
 * position, from the device or from a place name, and what the tiles then say about it.
 */

import type { SearchResult } from './live';

export type LocationProblem = 'denied' | 'unavailable' | 'timeout' | 'unsupported';

export interface DevicePosition {
  source: 'device';
  lat: number;
  lon: number;
  /** Radius in metres, as the device reports it. */
  accuracy: number;
  /** Worse than about a kilometre: the results say so and offer place search. */
  approximate: boolean;
}

export interface SearchedPosition {
  source: 'search';
  lat: number;
  lon: number;
  /** The place as the search named it. */
  label: string;
}

export type Position = DevicePosition | SearchedPosition;

/** The place-name lookup behind the search box. */
export type Lookup =
  | { status: 'idle' }
  | { status: 'pending'; query: string }
  | { status: 'notFound'; query: string }
  | { status: 'failed'; query: string; offline: boolean };

export type State =
  | { view: 'ready' }
  /** attempt tells this request from an earlier one whose answer may still arrive. */
  | { view: 'locating'; attempt: number; waiting: boolean }
  | { view: 'search'; problem?: LocationProblem; lookup: Lookup }
  /** The position is known. at: local wall-clock time it was fixed, "HH:mm". */
  | { view: 'searching'; position: Position; at: string }
  | { view: 'results'; position: Position; at: string; result: SearchResult }
  /** A covered country, and no pharmacy within 50 km. */
  | { view: 'none'; position: Position; at: string }
  /** Outside the covered countries (PLAN.md 7.7). country: its ISO code, where it is known. */
  | { view: 'notCovered'; position: Position; at: string; country?: string }
  /** The tiles didn't load. offline: the device says it has no connection. */
  | { view: 'failed'; position: Position; at: string; offline: boolean };

/** The views that show the map: one step of the browser's history together. */
export type MapView = Extract<State, { position: Position }>;
export const isMapView = (state: State): state is MapView => 'position' in state;

export type Action =
  | { type: 'unsupported' }
  | { type: 'locate'; attempt: number }
  | { type: 'waiting'; attempt: number }
  | { type: 'located'; attempt: number; lat: number; lon: number; accuracy: number; at: string }
  | { type: 'locationFailed'; attempt: number; problem: Exclude<LocationProblem, 'unsupported'> }
  | { type: 'openSearch' }
  | { type: 'lookup'; query: string }
  | { type: 'placeFound'; query: string; lat: number; lon: number; label: string; at: string }
  | { type: 'placeNotFound'; query: string }
  | { type: 'lookupFailed'; query: string; offline: boolean }
  /** What the tiles said. `position` is the one the search was for: an answer for another is dropped. */
  | { type: 'found'; position: Position; result: SearchResult }
  | { type: 'noneFound'; position: Position }
  | { type: 'notCovered'; position: Position; country?: string }
  | { type: 'searchFailed'; position: Position; offline: boolean }
  /** The far open pharmacy, found or gone, once the search is done. */
  | { type: 'farOpen'; position: Position; farOpen: SearchResult['farOpen'] }
  /** Search the same position again: after a failure, or when the connection returns. */
  | { type: 'retry' }
  | { type: 'back'; to: 'ready' | 'search' };

export const initialState: State = { view: 'ready' };

/** Accuracy worse than this is called approximate (PLAN.md 7.1). */
export const APPROXIMATE_OVER_METERS = 1000;

const idle: Lookup = { status: 'idle' };

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'unsupported':
      return { view: 'search', problem: 'unsupported', lookup: idle };

    case 'locate':
      return { view: 'locating', attempt: action.attempt, waiting: false };

    case 'waiting':
      return current(state, action.attempt) ? { ...state, waiting: true } : state;

    case 'located':
      if (!current(state, action.attempt)) return state;
      return {
        view: 'searching',
        at: action.at,
        position: {
          source: 'device',
          lat: action.lat,
          lon: action.lon,
          accuracy: action.accuracy,
          approximate: action.accuracy > APPROXIMATE_OVER_METERS,
        },
      };

    case 'locationFailed':
      return current(state, action.attempt) ? { view: 'search', problem: action.problem, lookup: idle } : state;

    case 'openSearch':
      // Leaving a location request for the search box drops its answer, if one still comes.
      return { view: 'search', lookup: idle };

    case 'lookup':
      return state.view === 'search' ? { ...state, lookup: { status: 'pending', query: action.query } } : state;

    case 'placeFound':
      if (!pending(state, action.query)) return state;
      return { view: 'searching', at: action.at, position: { source: 'search', lat: action.lat, lon: action.lon, label: action.label } };

    case 'placeNotFound':
      return pending(state, action.query) ? { ...state, lookup: { status: 'notFound', query: action.query } } : state;

    case 'lookupFailed':
      return pending(state, action.query) ? { ...state, lookup: { status: 'failed', query: action.query, offline: action.offline } } : state;

    case 'found':
      return searchingFor(state, action.position) ? { view: 'results', position: state.position, at: state.at, result: action.result } : state;

    case 'noneFound':
      return searchingFor(state, action.position) ? { view: 'none', position: state.position, at: state.at } : state;

    case 'notCovered':
      return searchingFor(state, action.position) ? { view: 'notCovered', position: state.position, at: state.at, country: action.country } : state;

    case 'searchFailed':
      return searchingFor(state, action.position) ? { view: 'failed', position: state.position, at: state.at, offline: action.offline } : state;

    case 'farOpen':
      if (state.view !== 'results' || state.position !== action.position) return state;
      // The same answer as before changes nothing, so nothing renders again.
      if (state.result.farOpen?.pharmacy.id === action.farOpen?.pharmacy.id) return state;
      return { ...state, result: { ...state.result, farOpen: action.farOpen } };

    case 'retry':
      // A new position object: the search that watches it starts again.
      return state.view === 'failed' ? { view: 'searching', position: { ...state.position }, at: state.at } : state;

    case 'back':
      return action.to === 'search' ? { view: 'search', lookup: idle } : initialState;
  }
}

function current(state: State, attempt: number): state is Extract<State, { view: 'locating' }> {
  return state.view === 'locating' && state.attempt === attempt;
}

function searchingFor(state: State, position: Position): state is Extract<State, { view: 'searching' }> {
  return state.view === 'searching' && state.position === position;
}

function pending(state: State, query: string): state is Extract<State, { view: 'search' }> {
  return state.view === 'search' && state.lookup.status === 'pending' && state.lookup.query === query;
}
