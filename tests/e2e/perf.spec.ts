import { gzipSync } from 'node:zlib';
import { expect, test } from '@playwright/test';
import { GENERATED, KAMPPI, WEEK_FROM, WEEK_UNTIL, daily, indexOf } from '@/lib/fixtures/tiles';
import { INDEX_PATH, encodeTile, tileOf, tilePath } from '@/lib/tiles';
import type { TilePharmacy } from '@/lib/tiles';
import { fakeLocation } from './helpers';

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
 * Fails above this. Set from the first measurements: see the pull request of M3 for the
 * numbers on this machine and in CI. It is there to catch a regression, such as a tile
 * search that waits for something it doesn't need.
 */
const LIMIT_MS = 6000;

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
