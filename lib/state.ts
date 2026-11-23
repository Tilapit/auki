/**
 * The app's states and the pure reducer that moves between them (PLAN.md 7.3).
 * M1 covers finding a position, from the device or from a place name. What follows once
 * pharmacies are fetched (results, none found, offline, service error) joins in M3.
 */

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
  | { view: 'searching'; position: Position; at: string };

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

    case 'back':
      return action.to === 'search' ? { view: 'search', lookup: idle } : initialState;
  }
}

function current(state: State, attempt: number): state is Extract<State, { view: 'locating' }> {
  return state.view === 'locating' && state.attempt === attempt;
}

function pending(state: State, query: string): state is Extract<State, { view: 'search' }> {
  return state.view === 'search' && state.lookup.status === 'pending' && state.lookup.query === query;
}
