import { describe, expect, it } from 'vitest';
import {
  LAST_DETAIL_KEY,
  LAST_SEARCH_KEY,
  LAST_SEARCH_MAX_AGE_MS,
  forgetLastSearch,
  readLastDetail,
  readLastSearch,
  saveLastDetail,
  saveLastSearch,
  type LastSearch,
} from '@/lib/session';
import { reducer, initialState, type State } from '@/lib/state';

function storage(initial: Record<string, string> = {}) {
  const kept = new Map(Object.entries(initial));
  return {
    kept,
    getItem: (key: string) => kept.get(key) ?? null,
    setItem: (key: string, value: string) => void kept.set(key, value),
    removeItem: (key: string) => void kept.delete(key),
  };
}

const NOW = Date.UTC(2026, 10, 26, 18, 41);
const here: LastSearch = {
  position: { source: 'device', lat: 60.16952, lon: 24.93545, accuracy: 25, approximate: false },
  at: '20:41',
  fixedAt: NOW,
  walks: new Map([
    ['node/1', { meters: 170, seconds: 122 }],
    ['way/2', { meters: 640, seconds: 461 }],
  ]),
};

describe('the last search of a tab', () => {
  it('comes back as it was kept: the position, its time and the walking times', () => {
    const tab = storage();
    saveLastSearch(here, tab);
    expect([...tab.kept.keys()]).toEqual([LAST_SEARCH_KEY]);
    expect(readLastSearch(NOW + 60_000, tab)).toEqual(here);
  });

  it('keeps a searched place by its name, and no walking times where none came', () => {
    const tab = storage();
    const place: LastSearch = { position: { source: 'search', lat: 56.9496, lon: 24.1052, label: 'Riika' }, at: '23:40', fixedAt: NOW };
    saveLastSearch(place, tab);
    expect(readLastSearch(NOW, tab)).toEqual(place);
    expect(readLastSearch(NOW, tab)).not.toHaveProperty('walks');
  });

  it('is not used once it is half an hour old, and is removed then', () => {
    const tab = storage();
    saveLastSearch(here, tab);
    saveLastDetail('node/1', tab);
    expect(readLastSearch(NOW + LAST_SEARCH_MAX_AGE_MS - 1, tab)).toBeDefined();
    expect(readLastSearch(NOW + LAST_SEARCH_MAX_AGE_MS, tab)).toBeUndefined();
    expect(tab.kept.size).toBe(0);
  });

  it('is not used when it claims to be from the future: a clock that was set back', () => {
    const tab = storage();
    saveLastSearch(here, tab);
    expect(readLastSearch(NOW - 1, tab)).toBeUndefined();
  });

  it.each([
    ['not JSON', '{'],
    ['null', 'null'],
    ['no position', JSON.stringify({ at: '20:41', fixedAt: NOW })],
    ['a position off the globe', JSON.stringify({ position: { source: 'device', lat: 160, lon: 24.9, accuracy: 25, approximate: false }, at: '20:41', fixedAt: NOW })],
    ['a source it does not know', JSON.stringify({ position: { source: 'guess', lat: 60.1, lon: 24.9 }, at: '20:41', fixedAt: NOW })],
    ['a searched place without its name', JSON.stringify({ position: { source: 'search', lat: 60.1, lon: 24.9 }, at: '20:41', fixedAt: NOW })],
    ['a time that is not one', JSON.stringify({ position: here.position, at: '<b>', fixedAt: NOW })],
    ['no time of its own', JSON.stringify({ position: here.position, at: '20:41' })],
  ])('reads what is written as untrusted text: %s is no search, and is removed', (_, text) => {
    const tab = storage({ [LAST_SEARCH_KEY]: text });
    expect(readLastSearch(NOW, tab)).toBeUndefined();
    expect(tab.kept.size).toBe(0);
  });

  it('drops walking times of another shape and keeps the search', () => {
    const tab = storage({ [LAST_SEARCH_KEY]: JSON.stringify({ position: here.position, at: '20:41', fixedAt: NOW, walks: [['node/1', -5, 10]] }) });
    expect(readLastSearch(NOW, tab)).toEqual({ position: here.position, at: '20:41', fixedAt: NOW });
  });

  it('forgets the search and the open pharmacy together', () => {
    const tab = storage();
    saveLastSearch(here, tab);
    saveLastDetail('node/1', tab);
    expect(readLastDetail(tab)).toBe('node/1');
    expect([...tab.kept.keys()].sort()).toEqual([LAST_DETAIL_KEY, LAST_SEARCH_KEY]);
    forgetLastSearch(tab);
    expect(tab.kept.size).toBe(0);
    expect(readLastDetail(tab)).toBeUndefined();
  });

  it('closing the details removes their mark', () => {
    const tab = storage();
    saveLastDetail('node/1', tab);
    saveLastDetail(undefined, tab);
    expect(tab.kept.size).toBe(0);
  });

  it('where storage is refused nothing is kept, nothing comes back and nothing throws', () => {
    const refuse = () => {
      throw new DOMException('refused', 'SecurityError');
    };
    const refusing = { getItem: refuse, setItem: refuse, removeItem: refuse };
    expect(() => saveLastSearch(here, refusing)).not.toThrow();
    expect(() => saveLastDetail('node/1', refusing)).not.toThrow();
    expect(() => forgetLastSearch(refusing)).not.toThrow();
    expect(readLastSearch(NOW, refusing)).toBeUndefined();
    expect(readLastDetail(refusing)).toBeUndefined();
    expect(readLastSearch(NOW, undefined)).toBeUndefined();
  });
});

describe('a search that comes back', () => {
  it('goes from the first window straight to the search, with the position object it was given', () => {
    const next = reducer(initialState, { type: 'restore', position: here.position, at: here.at });
    expect(next).toEqual({ view: 'searching', position: here.position, at: '20:41' });
    expect((next as Extract<State, { view: 'searching' }>).position).toBe(here.position);
  });

  it('changes nothing once the page has gone on: it belongs to the arrival', () => {
    const locating: State = { view: 'locating', attempt: 1, waiting: false };
    expect(reducer(locating, { type: 'restore', position: here.position, at: here.at })).toBe(locating);
  });
});
