import { describe, expect, it } from 'vitest';
import { initialState, reducer, type Action, type State } from '@/lib/state';

const run = (actions: Action[], from: State = initialState) => actions.reduce(reducer, from);
const located = (attempt: number, accuracy = 25): Action => ({ type: 'located', attempt, lat: 60.17, lon: 24.94, accuracy, at: '20:41' });

describe('reducer: the device finds the position', () => {
  it('allow: ready, locating, then searching with the position', () => {
    const state = run([{ type: 'locate', attempt: 1 }, located(1)]);
    expect(state).toEqual({
      view: 'searching',
      at: '20:41',
      position: { source: 'device', lat: 60.17, lon: 24.94, accuracy: 25, approximate: false },
    });
  });

  it('calls a position worse than a kilometre approximate', () => {
    const at = (accuracy: number) => run([{ type: 'locate', attempt: 1 }, located(1, accuracy)]);
    expect(at(1000)).toMatchObject({ position: { approximate: false } });
    expect(at(1001)).toMatchObject({ position: { approximate: true } });
  });

  it('ignored prompt: after the wait it says it is waiting, and an answer still gets through', () => {
    const waiting = run([{ type: 'locate', attempt: 1 }, { type: 'waiting', attempt: 1 }]);
    expect(waiting).toEqual({ view: 'locating', attempt: 1, waiting: true });
    expect(reducer(waiting, located(1)).view).toBe('searching');
  });

  it.each(['denied', 'unavailable', 'timeout'] as const)('%s lands on place search with that note', (problem) => {
    const state = run([{ type: 'locate', attempt: 1 }, { type: 'locationFailed', attempt: 1, problem }]);
    expect(state).toEqual({ view: 'search', problem, lookup: { status: 'idle' } });
  });

  it('unsupported opens straight to place search', () => {
    expect(reducer(initialState, { type: 'unsupported' })).toEqual({ view: 'search', problem: 'unsupported', lookup: { status: 'idle' } });
  });

  it('a retry starts over from locating', () => {
    const denied = run([{ type: 'locate', attempt: 1 }, { type: 'locationFailed', attempt: 1, problem: 'timeout' }]);
    expect(reducer(denied, { type: 'locate', attempt: 2 })).toEqual({ view: 'locating', attempt: 2, waiting: false });
  });
});

describe('reducer: answers that arrive too late change nothing', () => {
  it('drops the answer of an earlier location request', () => {
    const second = run([{ type: 'locate', attempt: 1 }, { type: 'locate', attempt: 2 }]);
    expect(reducer(second, located(1))).toBe(second);
    expect(reducer(second, { type: 'waiting', attempt: 1 })).toBe(second);
    expect(reducer(second, { type: 'locationFailed', attempt: 1, problem: 'denied' })).toBe(second);
  });

  it('drops a position that arrives after the user went to the search box', () => {
    const search = run([{ type: 'locate', attempt: 1 }, { type: 'openSearch' }]);
    expect(reducer(search, located(1))).toBe(search);
  });

  it('drops the answer to a name that is no longer the one being looked up', () => {
    const second = run([{ type: 'openSearch' }, { type: 'lookup', query: 'Kamppi' }, { type: 'lookup', query: 'Riika' }]);
    const late: Action = { type: 'placeFound', query: 'Kamppi', lat: 60.17, lon: 24.93, label: 'Kamppi, Helsinki', at: '20:41' };
    expect(reducer(second, late)).toBe(second);
    expect(reducer(second, { type: 'placeNotFound', query: 'Kamppi' })).toBe(second);
    expect(reducer(initialState, late)).toBe(initialState);
  });
});

describe('reducer: a place name finds the position', () => {
  const pending = run([{ type: 'openSearch' }, { type: 'lookup', query: 'Kamppi' }]);

  it('found: searching at the place, named as the search named it', () => {
    const state = reducer(pending, { type: 'placeFound', query: 'Kamppi', lat: 60.1689, lon: 24.9325, label: 'Kamppi, Helsinki', at: '20:41' });
    expect(state).toEqual({ view: 'searching', at: '20:41', position: { source: 'search', lat: 60.1689, lon: 24.9325, label: 'Kamppi, Helsinki' } });
  });

  it('not found and failed stay on the search box and say so', () => {
    expect(reducer(pending, { type: 'placeNotFound', query: 'Kamppi' })).toMatchObject({ view: 'search', lookup: { status: 'notFound', query: 'Kamppi' } });
    expect(reducer(pending, { type: 'lookupFailed', query: 'Kamppi', offline: true })).toMatchObject({
      view: 'search',
      lookup: { status: 'failed', offline: true },
    });
  });

  it('keeps the location note while a name is looked up after a denied prompt', () => {
    const denied = run([{ type: 'locate', attempt: 1 }, { type: 'locationFailed', attempt: 1, problem: 'denied' }, { type: 'lookup', query: 'Kamppi' }]);
    expect(denied).toMatchObject({ view: 'search', problem: 'denied', lookup: { status: 'pending' } });
  });

  it('a lookup outside the search view does nothing', () => {
    expect(reducer(initialState, { type: 'lookup', query: 'Kamppi' })).toBe(initialState);
  });
});

describe('reducer: back', () => {
  it('returns to the search box or to the first window', () => {
    const searching = run([{ type: 'locate', attempt: 1 }, located(1)]);
    expect(reducer(searching, { type: 'back', to: 'search' })).toEqual({ view: 'search', lookup: { status: 'idle' } });
    expect(reducer(searching, { type: 'back', to: 'ready' })).toEqual(initialState);
  });
});
