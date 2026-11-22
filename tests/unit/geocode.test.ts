import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BRAND } from '@/lib/brand';
import { cleanQuery, geocode, labelFor, resetGeocode, userAgent, type Deps } from '@/lib/server/geocode';

const kamppi = {
  lat: '60.1689',
  lon: '24.9325',
  name: 'Kamppi',
  display_name: 'Kamppi, Eteläinen suurpiiri, Helsinki, Uusimaa, Suomi',
  address: { suburb: 'Kamppi', city: 'Helsinki', country_code: 'fi' },
};

/** A fake clock and a fake Nominatim: no test here touches the network or the time. */
function setup(hits: unknown = [kamppi], ok = true) {
  let time = 1_000_000;
  const fetch = vi.fn(async () => ({ ok, json: async () => hits }) as Response);
  const sleep = vi.fn(async (ms: number) => {
    time += ms;
  });
  const deps: Partial<Deps> = { fetch: fetch as unknown as typeof globalThis.fetch, now: () => time, sleep, contact: 'contact@example.org' };
  return { deps, fetch, sleep, advance: (ms: number) => (time += ms) };
}

beforeEach(() => resetGeocode());

describe('geocode', () => {
  it('asks Nominatim for one place, in the UI language, and names itself', async () => {
    const { deps, fetch } = setup();
    await expect(geocode('  Kamppi ', 'fi', deps)).resolves.toEqual({
      status: 'found',
      place: { lat: 60.1689, lon: 24.9325, label: 'Kamppi, Helsinki', country: 'FI' },
    });
    const [url, init] = fetch.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.origin + url.pathname).toBe('https://nominatim.openstreetmap.org/search');
    expect(Object.fromEntries(url.searchParams)).toEqual({ q: 'Kamppi', format: 'jsonv2', limit: '1', addressdetails: '1', 'accept-language': 'fi' });
    expect((init.headers as Record<string, string>)['User-Agent']).toBe(userAgent('contact@example.org'));
    expect(userAgent('contact@example.org')).toContain(BRAND.toLowerCase());
  });

  it('does not call Nominatim without a contact address to identify itself with', async () => {
    const { deps, fetch } = setup();
    await expect(geocode('Kamppi', 'fi', { ...deps, contact: undefined })).resolves.toEqual({ status: 'unavailable', reason: 'not-configured' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refuses names that are too short or too long without calling anyone', async () => {
    const { deps, fetch } = setup();
    await expect(geocode('a', 'fi', deps)).resolves.toEqual({ status: 'invalid' });
    await expect(geocode('x'.repeat(81), 'fi', deps)).resolves.toEqual({ status: 'invalid' });
    await expect(geocode(null, 'fi', deps)).resolves.toEqual({ status: 'invalid' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('says none when nothing matches', async () => {
    const { deps } = setup([]);
    await expect(geocode('Kampi keskus', 'fi', deps)).resolves.toEqual({ status: 'none' });
  });

  it('says unavailable when Nominatim fails, and does not remember the failure', async () => {
    const failing = setup([], false);
    await expect(geocode('Kamppi', 'fi', failing.deps)).resolves.toEqual({ status: 'unavailable', reason: 'upstream' });
    const working = setup();
    await expect(geocode('Kamppi', 'fi', working.deps)).resolves.toMatchObject({ status: 'found' });
    expect(working.fetch).toHaveBeenCalledTimes(1);
  });

  it('keeps at least a second between calls to Nominatim', async () => {
    const { deps, fetch, sleep } = setup();
    await Promise.all([geocode('Kamppi', 'fi', deps), geocode('Töölö', 'fi', deps), geocode('Kallio', 'fi', deps)]);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([1000, 1000]);
  });

  it('answers the same name from memory for a day', async () => {
    const { deps, fetch, advance } = setup();
    await geocode('Kamppi', 'fi', deps);
    await geocode('kamppi', 'fi', deps);
    expect(fetch).toHaveBeenCalledTimes(1);
    await geocode('Kamppi', 'en', deps);
    expect(fetch).toHaveBeenCalledTimes(2);
    advance(24 * 60 * 60 * 1000 + 1);
    await geocode('Kamppi', 'fi', deps);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});

describe('labelFor', () => {
  it('names the place and its town, once', () => {
    expect(labelFor(kamppi)).toBe('Kamppi, Helsinki');
    expect(labelFor({ lat: '0', lon: '0', name: 'Rīga', address: { city: 'Rīga' } })).toBe('Rīga');
    expect(labelFor({ lat: '0', lon: '0', display_name: 'Urho Kekkosen katu 1, Kamppi, Helsinki', address: { town: 'Helsinki' } })).toBe(
      'Urho Kekkosen katu 1, Helsinki',
    );
    expect(labelFor({ lat: '0', lon: '0' })).toBe('');
  });
});

describe('cleanQuery', () => {
  it('trims and collapses whitespace', () => {
    expect(cleanQuery('  Kampin   keskus ')).toBe('Kampin keskus');
    expect(cleanQuery(' a ')).toBeUndefined();
  });
});
