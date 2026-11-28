import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeI18n, locales } from '@/lib/i18n';
import { KEPT } from '@/lib/kept';
import { MAP_TILE_HOST, OPENED_BY_USER, POSITION_REQUEST, REQUESTS, addressOf, connectSources, contentSecurityPolicy, methodOf } from '@/lib/requests';

/**
 * The "what the app sends" page (PLAN.md 7.6) is built from the list the policy and the
 * privacy test are built from. These hold the page's side of that: a text for everything on
 * the lists, nothing on the page that the lists don't have, and the device's keys as the code
 * writes them.
 */

type Entry = { name: string; when: string; carries: string; receiver: string };
const shown = (request: (typeof REQUESTS)[number]) => `${methodOf(request)} ${addressOf(request)}`;
const filled = (entry: Record<string, string> | undefined) => !!entry && Object.values(entry).every((text) => text.trim().length > 0);

describe('the page of every request the app makes', () => {
  it('has a text for every request on the list, in both languages, and none for a request that is not on it', () => {
    const listed = new Set<string>(REQUESTS.map((request) => request.id));
    for (const locale of locales) {
      const texts: Record<string, Entry | undefined> = makeI18n(locale).t.privacy.requests;
      for (const request of REQUESTS) {
        expect(Object.keys(texts[request.id] ?? {}).sort(), `${locale}: ${request.id}`).toEqual(['carries', 'name', 'receiver', 'when']);
        expect(filled(texts[request.id]), `${locale}: ${request.id}`).toBe(true);
      }
      // The page shows the list's requests, so a text without one shows nowhere. One may wait for its request: the wake-up of the walking function.
      expect(Object.keys(texts).filter((id) => !listed.has(id) && id !== 'wake'), locale).toEqual([]);
    }
  });

  it('gives each request the address a browser shows for it, and no two the same', () => {
    const addresses = Object.fromEntries(REQUESTS.map((request) => [request.id, shown(request)]));
    expect(addresses).toMatchObject({
      page: 'GET /',
      tiles: 'GET /tiles/',
      geocode: 'GET /api/geocode',
      walking: 'POST /api/walking',
      mapTiles: `GET ${new URL(MAP_TILE_HOST).host}`,
      reports: 'GET /api/report',
      report: 'POST /api/report',
    });
    expect(new Set(Object.values(addresses)).size).toBe(REQUESTS.length);
  });

  it('marks one request as the one with the position, and it is the walking request', () => {
    const withPosition = REQUESTS.filter((request) => request.carries === 'the exact position');
    expect(withPosition.map(shown)).toEqual([`${POSITION_REQUEST.method} ${POSITION_REQUEST.path}`]);
  });

  it('names a host in the text of a request only where the list has a third party, and then it does', () => {
    for (const locale of locales) {
      const texts: Record<string, Entry | undefined> = makeI18n(locale).t.privacy.requests;
      for (const request of REQUESTS) expect(texts[request.id]?.receiver.includes('{host}'), `${locale}: ${request.id}`).toBe(request.origin !== 'self');
    }
  });

  it('has a text for each kind of link the user opens, in both languages', () => {
    for (const locale of locales) {
      const texts: Record<string, Entry | undefined> = makeI18n(locale).t.privacy.opened;
      expect(Object.keys(texts).sort(), locale).toEqual(OPENED_BY_USER.map((link) => link.id).sort());
      for (const link of OPENED_BY_USER) expect(filled(texts[link.id]), `${locale}: ${link.id}`).toBe(true);
    }
  });

  it('quotes the buttons by the names they have in the app', () => {
    for (const locale of locales) {
      const { t } = makeI18n(locale);
      expect(t.privacy.requests.report.when, locale).toContain(t.report.send);
      expect(t.privacy.requests.wake.when, locale).toContain(t.first.locate);
      expect(t.privacy.kept.locatedBefore.text, locale).toContain(t.first.locate);
      expect(t.privacy.opened.medicine.when, locale).toContain(t.medicine.title);
    }
  });

  it("prints the policy's own line: this site and the map tile host", () => {
    expect(connectSources()).toBe("connect-src 'self' https://tiles.openfreemap.org");
    expect(contentSecurityPolicy({ development: false, devRoutes: false }).split('; ')).toContain(connectSources());
  });
});

describe('what the device keeps', () => {
  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? files(join(dir, entry.name)) : /\.(ts|tsx)$/.test(entry.name) ? [join(dir, entry.name)] : []));
  const sources = ['app', 'components', 'hooks', 'lib'].flatMap(files).map((file) => ({ file, text: readFileSync(file, 'utf8') }));

  it('is the keys the code writes under: a new key fails this until the list, and with it the page, has it', () => {
    // Only these touch the browser's storage.
    const storing = sources.filter(({ text }) => /\b(localStorage|sessionStorage)\b/.test(text));
    expect(storing.map(({ file }) => file).sort()).toEqual(['lib/geolocation.ts', 'lib/home.ts', 'lib/reports.ts', 'lib/session.ts'].map((file) => join(...file.split('/'))));
    // And every key they name is on the list, under the store the page says.
    const keys = storing.flatMap(({ text }) => [...text.matchAll(/export const \w+_KEY = '([^']+)'/g)].map((match) => match[1]));
    expect(KEPT.map((kept) => kept.key).sort()).toEqual(keys.sort());
    expect(Object.fromEntries(KEPT.map((kept) => [kept.key, kept.store]))).toEqual({
      'last-search': 'session',
      'last-detail': 'session',
      'located-before': 'local',
      'reports-done': 'local',
      'home-country': 'local',
    });
  });

  it('is nothing else: no cookie, no database in the browser, no cache and no service worker', () => {
    const offenders = sources.filter(({ text }) => /document\.cookie|indexedDB|caches\.(open|match)|serviceWorker/.test(text)).map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it('has a text for each, and for each store, in both languages', () => {
    for (const locale of locales) {
      const { kept, stores } = makeI18n(locale).t.privacy;
      const texts: Record<string, { name: string; text: string } | undefined> = kept;
      expect(Object.keys(texts).sort(), locale).toEqual(KEPT.map((item) => item.id).sort());
      for (const item of KEPT) {
        expect(filled(texts[item.id]), `${locale}: ${item.id}`).toBe(true);
        expect(stores[item.store].length, `${locale}: ${item.store}`).toBeGreaterThan(0);
      }
    }
  });
});
