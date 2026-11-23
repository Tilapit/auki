import { get } from 'node:http';
import { gzipSync } from 'node:zlib';
import { expect, test } from '@playwright/test';
import { GENERATED, KAMPPI, WEEK_FROM, WEEK_UNTIL, daily, indexOf } from '@/lib/fixtures/tiles';
import { INDEX_PATH, encodeTile, tileOf, tilePath } from '@/lib/tiles';
import type { TilePharmacy } from '@/lib/tiles';
import { fakeLocation, fakeMapTiles } from './helpers';

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
 */

const RTT_MS = 150;
const DOWN_BYTES_PER_S = (1.6 * 1024 * 1024) / 8;
const UP_BYTES_PER_S = (750 * 1024) / 8;
const HEAVIEST_TILE_GZIP_BYTES = 56 * 1024;
const RUNS = 5;
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
  test.setTimeout(180_000);

  const home = tileOf(KAMPPI);
  const files: Record<string, string> = {
    [INDEX_PATH]: JSON.stringify(indexOf([home])),
    [tilePath(home.x, home.y)]: JSON.stringify(encodeTile({ ...home, pharmacies: heavyTile() })),
  };

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
    const devtools = await context.newCDPSession(page);
    await devtools.send('Network.emulateNetworkConditions', { offline: false, latency: RTT_MS, downloadThroughput: DOWN_BYTES_PER_S, uploadThroughput: UP_BYTES_PER_S });
    await devtools.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    await page.goto('/fi');
    await page.waitForFunction(() => performance.getEntriesByName('first-result').length > 0, undefined, { timeout: 60_000 });
    times.push(await page.evaluate(() => performance.getEntriesByName('first-result')[0].startTime));
    // The results are there: the page's one h1 is theirs.
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await context.close();
  }

  const sorted = [...times].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const summary = `median ${Math.round(median)} ms of ${RUNS} runs (${sorted.map((time) => Math.round(time)).join(', ')}); one tile of 1,272 pharmacies, delivered as ${HEAVIEST_TILE_GZIP_BYTES / 1024} KB`;
  testInfo.annotations.push({ type: 'time to first result', description: summary });
  console.log(`Time to first result: ${summary}`);
  expect(median, summary).toBeLessThan(LIMIT_MS);
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

  // Every script the page fetches, with the bytes it took on the wire and when it was asked for.
  const devtools = await context.newCDPSession(page);
  await devtools.send('Network.enable');
  const scripts = new Map<string, { url: string; bytes: number; order: number }>();
  let order = 0;
  devtools.on('Network.responseReceived', (event) => {
    const { pathname } = new URL(event.response.url);
    if (event.type === 'Script' || pathname.endsWith('.js') || pathname.endsWith('.mjs')) scripts.set(event.requestId, { url: pathname, bytes: 0, order: order++ });
  });
  devtools.on('Network.loadingFinished', (event) => {
    const script = scripts.get(event.requestId);
    if (script) script.bytes = event.encodedDataLength;
  });

  await page.goto('/fi');
  await page.waitForFunction(() => performance.getEntriesByName('first-result').length > 0, undefined, { timeout: 60_000 });
  const before = order;
  await page.waitForFunction(() => performance.getEntriesByName('map-ready').length > 0, undefined, { timeout: 60_000 });
  await page.waitForLoadState('networkidle');

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
  const first = all.filter((script) => script.order < before);
  const map = [...all.filter((script) => script.order >= before), { url: 'maplibre-gl-worker.mjs', bytes: workerBytes, order }];
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
