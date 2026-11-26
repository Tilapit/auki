import { get } from 'node:http';
import { gzipSync } from 'node:zlib';
import { expect, test } from '@playwright/test';
import { GENERATED, KAMPPI, WEEK_FROM, WEEK_UNTIL, daily, indexOf } from '@/lib/fixtures/tiles';
import { INDEX_PATH, encodeTile, tileOf, tilePath } from '@/lib/tiles';
import type { TilePharmacy } from '@/lib/tiles';
import { WALKING_PATH, WALKING_WAIT_MS } from '@/lib/walking';
import { fakeLocation, fakeMapTiles, gridWalk, type WalkingAsked } from './helpers';

/**
 * Time to first result (PLAN.md section 12): from navigation to the first rendered result,
 * in Chromium on Lighthouse's phone profile (slow 4G, 4× slower CPU), with location already
 * allowed and a cold cache.
 *
 * The tiles are answered by the test, so each answer is held back for as long as the same
 * profile would take to deliver it: one round trip, plus its gzipped size at 1.6 Mbit/s.
 * The tile is as heavy as the heaviest real one, central Barcelona on 23 Nov 2026: 1,272
 * pharmacies and 56 KB gzipped. The invented rows here compress better than real ones, so
 * the delay is worked out from the real weight, not from theirs.
 *
 * From M5 the first result waits for the walking times too (PLAN.md 7.1, step 5), so the
 * walking request is part of the measurement. It is answered by the test after one round
 * trip of the profile and the time our server and openrouteservice take together.
 * That time is an assumption, 400 ms: on 24 Nov 2026 there was no key to measure it with.
 * The second number is the worst case by design: a walking service that never answers, where
 * the list goes on without it after a second and a half.
 */

const RTT_MS = 150;
const DOWN_BYTES_PER_S = (1.6 * 1024 * 1024) / 8;
const UP_BYTES_PER_S = (750 * 1024) / 8;
const HEAVIEST_TILE_GZIP_BYTES = 56 * 1024;
const RUNS = 5;
/** Our server asking openrouteservice for one row of twenty: assumed until it is measured with a key. */
const WALKING_SERVICE_MS = 400;
/**
 * Fails above this. Set from the first measurements, on 23 Nov 2026: a median of 3.2 s in
 * CI (3.0 to 3.3 s over five runs) and 2.3 s on the Mac it was written on. The limit is
 * CI's median and a half, rounded up: room for a slow runner, and still under what a
 * regression would cost, such as a tile search that waits for something it doesn't need.
 */
const LIMIT_MS = 5000;

function heavyTile(): TilePharmacy[] {
  const schedules = Array.from({ length: 145 }, (_, index) => daily(`0${7 + (index % 3)}:${index % 2 ? '30' : '00'}`, `${17 + (index % 6)}:${index % 4 ? '00' : '30'}`));
  return Array.from({ length: 1272 }, (_, index) => ({
    id: `n${1000000 + index}`,
    lat: Math.round((KAMPPI.lat + ((index % 40) - 20) * 0.002) * 1e5) / 1e5,
    lon: Math.round((KAMPPI.lon + (Math.floor(index / 40) - 16) * 0.004) * 1e5) / 1e5,
    name: `Farmàcia ${['Sant Antoni', 'del Mercat', 'Gran Via', 'Eixample', 'de la Plaça'][index % 5]} ${index}`,
    street: `Carrer de ${['Provença', 'Mallorca', 'València', 'Aragó'][index % 4]} ${index % 300}`,
    city: ['Barcelona', "L'Hospitalet de Llobregat", 'Badalona'][index % 3],
    country: 'FI',
    zone: 'Europe/Helsinki',
    generated: GENERATED,
    windowFrom: WEEK_FROM,
    windowUntil: WEEK_UNTIL,
    hours: index % 5 === 0 ? { kind: 'missing' as const } : schedules[index % schedules.length],
    ...(index % 3 === 0 ? { phone: `+34 93 ${100000 + index}` } : {}),
    ...(index % 7 === 0 ? { website: `https://farmacia-${index}.example/` } : {}),
  }));
}

test('time to first result on a throttled phone', async ({ browser, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'The throttling is Chromium DevTools: measured in Chromium only.');
  test.setTimeout(300_000);

  const home = tileOf(KAMPPI);
  const files: Record<string, string> = {
    [INDEX_PATH]: JSON.stringify(indexOf([home])),
    [tilePath(home.x, home.y)]: JSON.stringify(encodeTile({ ...home, pharmacies: heavyTile() })),
  };

  /** Five cold runs. `walking`: answered as a healthy service would, or never. */
  const measure = async (walking: 'answers' | 'never'): Promise<number[]> => {
  const times: number[] = [];
  for (let run = 0; run < RUNS; run++) {
    // A new context each time: nothing cached.
    const context = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true, locale: 'fi-FI', timezoneId: 'Europe/Helsinki' });
    const page = await context.newPage();
    // No test clock here: it would replace the browser's performance timeline as well. The
    // real date only decides whether the fixture's hours read as open or as out of date.
    await fakeLocation(page, 'allow', 'granted');
    // The map loads after the first result. Its host is answered here: no test reaches a real service.
    await fakeMapTiles(context);
    await page.route('**/tiles/v1/**', async (route) => {
      const body = files[new URL(route.request().url()).pathname];
      if (body === undefined) return route.fulfill({ status: 404, body: '' });
      const bytes = route.request().url().endsWith('index.json') ? gzipSync(body).length : HEAVIEST_TILE_GZIP_BYTES;
      await new Promise((resolve) => setTimeout(resolve, RTT_MS + (bytes / DOWN_BYTES_PER_S) * 1000));
      await route.fulfill({ contentType: 'application/json', body });
    });
    // The walking times: twenty walks, a few hundred bytes, after the round trip and the service's own time.
    await page.route(`**${WALKING_PATH}`, async (route) => {
      if (walking === 'never') return;
      const asked = route.request().postDataJSON() as WalkingAsked;
      await new Promise((resolve) => setTimeout(resolve, RTT_MS + WALKING_SERVICE_MS));
      await route.fulfill({ json: { walks: asked.to.map((to) => gridWalk(asked.from, to)) } }).catch(() => undefined);
    });
    const devtools = await context.newCDPSession(page);
    await devtools.send('Network.emulateNetworkConditions', { offline: false, latency: RTT_MS, downloadThroughput: DOWN_BYTES_PER_S, uploadThroughput: UP_BYTES_PER_S });
    await devtools.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    await page.goto('/fi');
    await page.waitForFunction(() => performance.getEntriesByName('first-result').length > 0, undefined, { timeout: 60_000 });
    times.push(await page.evaluate(() => performance.getEntriesByName('first-result')[0].startTime));
    // The results are there: the page's one h1 is theirs. With walking times the list says it is on foot.
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByText(walking === 'answers' ? 'Etäisyydet ovat kävelyreittejä.' : 'Etäisyydet ovat linnuntietä.')).toHaveCount(1);
    await context.close();
  }
  return times.sort((a, b) => a - b);
  };

  const median = (sorted: number[]) => sorted[Math.floor(sorted.length / 2)];
  const list = (sorted: number[]) => sorted.map((time) => Math.round(time)).join(', ');

  const withWalking = await measure('answers');
  const summary = `median ${Math.round(median(withWalking))} ms of ${RUNS} runs (${list(withWalking)}); one tile of 1,272 pharmacies, delivered as ${HEAVIEST_TILE_GZIP_BYTES / 1024} KB, and walking times after ${RTT_MS + WALKING_SERVICE_MS} ms`;
  testInfo.annotations.push({ type: 'time to first result', description: summary });
  console.log(`Time to first result: ${summary}`);

  const without = await measure('never');
  const slow = `median ${Math.round(median(without))} ms of ${RUNS} runs (${list(without)}); walking times never answer, and the list goes on by straight line after ${WALKING_WAIT_MS} ms`;
  testInfo.annotations.push({ type: 'time to first result, walking service down', description: slow });
  console.log(`Time to first result, walking service down: ${slow}`);

  expect(median(withWalking), summary).toBeLessThan(LIMIT_MS);
  // The wait for walking times is a second and a half and no more: a service that never answers costs that, and nothing on top.
  expect(median(without) - median(withWalking), slow).toBeLessThan(WALKING_WAIT_MS);
});

/**
 * The map's own budget (PLAN.md section 12). MapLibre is by far the heaviest thing in the
 * app, so it has a number of its own, apart from the first window's: the JavaScript that is
 * fetched once the results are on screen, its worker included, as it travels (gzipped).
 *
 * Measured against a production build only: the dev server's files are neither minified nor
 * compressed. Set from the first measurement, on 23 Nov 2026: 439 KB with maplibre-gl 6.19 (the library
 * 283 KB, its worker 155 KB). The budget leaves about five per cent of room.
 */
const MAP_JS_BUDGET_BYTES = 460 * 1024;

test('the map loads after the results, and stays inside its own budget', async ({ browser, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'Transfer sizes are read through Chromium DevTools.');
  const home = tileOf(KAMPPI);
  const files: Record<string, unknown> = {
    [INDEX_PATH]: indexOf([home]),
    [tilePath(home.x, home.y)]: encodeTile({ ...home, pharmacies: heavyTile().slice(0, 40) }),
  };
  const context = await browser.newContext({ viewport: { width: 412, height: 823 }, locale: 'fi-FI', timezoneId: 'Europe/Helsinki' });
  const page = await context.newPage();
  await fakeLocation(page, 'allow', 'granted');
  await fakeMapTiles(context);
  await page.route('**/tiles/v1/**', async (route) => {
    const body = files[new URL(route.request().url()).pathname];
    if (body === undefined) await route.fulfill({ status: 404, body: '' });
    else await route.fulfill({ json: body });
  });
  // No walking times here: the server without a key, answered by the test. No test reaches a real service.
  await page.route(`**${WALKING_PATH}`, (route) => route.fulfill({ status: 503, json: { error: 'not-configured' } }));

  // Every script the page fetches, with the bytes it took on the wire.
  const devtools = await context.newCDPSession(page);
  await devtools.send('Network.enable');
  const scripts = new Map<string, { url: string; bytes: number }>();
  devtools.on('Network.responseReceived', (event) => {
    const { pathname } = new URL(event.response.url);
    if (event.type === 'Script' || pathname.endsWith('.js') || pathname.endsWith('.mjs')) scripts.set(event.requestId, { url: pathname, bytes: 0 });
  });
  devtools.on('Network.loadingFinished', (event) => {
    const script = scripts.get(event.requestId);
    if (script) script.bytes = event.encodedDataLength;
  });

  await page.goto('/fi');
  await page.waitForFunction(() => performance.getEntriesByName('first-result').length > 0, undefined, { timeout: 60_000 });
  await page.waitForFunction(() => performance.getEntriesByName('map-ready').length > 0, undefined, { timeout: 60_000 });
  await page.waitForLoadState('networkidle');

  // Which scripts were asked for before the first result was on screen, by the page's own clock:
  // each file's request and the mark are read from the same timeline. (The order in which the
  // answers reach this test is not that: on 26 Nov 2026 a busy runner heard of the map's two
  // files before it had heard of the mark, and counted them among the first window's.)
  const askedFirst = await page.evaluate(() => {
    const shown = performance.getEntriesByName('first-result')[0].startTime;
    return performance
      .getEntriesByType('resource')
      .filter((entry) => entry.startTime < shown)
      .map((entry) => new URL(entry.name).pathname);
  });
  const mapsOwn = await page.evaluate(() => {
    const shown = performance.getEntriesByName('first-result')[0].startTime;
    return performance
      .getEntriesByType('resource')
      .filter((entry) => entry.startTime >= shown)
      .map((entry) => new URL(entry.name).pathname);
  });

  // The worker is fetched by the browser on the page's behalf, outside what DevTools reports for
  // the page: it is asked for again here, compressed, and its bytes counted as they arrive.
  const worker = page.workers().find((candidate) => candidate.url().endsWith('maplibre-gl-worker.mjs'));
  expect(worker, 'the map runs its worker from our own origin').toBeDefined();
  const workerBytes = await new Promise<number>((resolve, reject) => {
    get(worker!.url(), { headers: { 'accept-encoding': 'gzip' } }, (response) => {
      let bytes = 0;
      response.on('data', (chunk: Buffer) => (bytes += chunk.length));
      response.on('end', () => resolve(bytes));
    }).on('error', reject);
  });

  const all = [...scripts.values()];
  // A script the page's timeline does not list at all counts with the first window's: never in the map's favour.
  const later = all.filter((script) => mapsOwn.includes(script.url) && !askedFirst.includes(script.url));
  const first = all.filter((script) => !later.includes(script));
  const map = [...later, { url: 'maplibre-gl-worker.mjs', bytes: workerBytes }];
  const sum = (list: typeof all) => list.reduce((total, script) => total + script.bytes, 0);
  const kilobytes = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;
  const summary = `until the first result ${kilobytes(sum(first))} in ${first.length} files; the map ${kilobytes(sum(map))} in ${map.length} files (${map.map((script) => `${script.url.split('/').pop()} ${kilobytes(script.bytes)}`).join(', ')})`;
  testInfo.annotations.push({ type: 'map JavaScript', description: summary });
  console.log(`JavaScript as it travels: ${summary}`);

  // The map's code was not asked for before the results were on screen: the list never waits for it.
  expect(sum(first)).toBeLessThan(sum(map));
  // The budget is for a production build.
  if (process.env.CI) expect(sum(map), summary).toBeLessThan(MAP_JS_BUDGET_BYTES);
  await context.close();
});
