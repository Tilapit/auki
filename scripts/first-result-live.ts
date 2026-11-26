/**
 * Time to first result on the live site (PLAN.md section 12, step 5, and the README's
 * numbers): the measurement of tests/e2e/perf.spec.ts with nothing answered by a test.
 *
 * Chromium on Lighthouse's phone profile (slow 4G, 4× slower CPU), location already allowed,
 * a new browser context for every run so that nothing is cached, from navigation to the
 * app's own `performance.mark('first-result')`. Five runs; the median is the number.
 *
 * The position is an invented one at Kamppi, Helsinki, the same as in the fixtures. The
 * site is used as a visitor uses it, so each run costs the server one request to
 * openrouteservice for walking times, and one for the route line if the map gets that far
 * before the run ends: ten of the day's 500 and 2,000 at the most. Run it for the README,
 * not in a loop.
 *
 *   node scripts/first-result-live.ts [https://auki.vercel.app] [fi]
 */
import { chromium } from '@playwright/test';

const SITE = (process.argv[2] ?? 'https://auki.vercel.app').replace(/\/$/, '');
const LOCALE = process.argv[3] ?? 'fi';
const RUNS = 5;
const KAMPPI = { latitude: 60.16952, longitude: 24.93545 };
const RTT_MS = 150;
const DOWN_BYTES_PER_S = (1.6 * 1024 * 1024) / 8;
const UP_BYTES_PER_S = (750 * 1024) / 8;

const browser = await chromium.launch();
const runs: { ms: number; distances: string; pharmacies: number }[] = [];
for (let run = 0; run < RUNS; run++) {
  const context = await browser.newContext({
    viewport: { width: 412, height: 823 },
    deviceScaleFactor: 1.75,
    isMobile: true,
    hasTouch: true,
    locale: 'fi-FI',
    timezoneId: 'Europe/Helsinki',
    permissions: ['geolocation'],
    geolocation: KAMPPI,
  });
  const page = await context.newPage();
  const devtools = await context.newCDPSession(page);
  await devtools.send('Network.emulateNetworkConditions', { offline: false, latency: RTT_MS, downloadThroughput: DOWN_BYTES_PER_S, uploadThroughput: UP_BYTES_PER_S });
  await devtools.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto(`${SITE}/${LOCALE}`);
  await page.waitForFunction(() => performance.getEntriesByName('first-result').length > 0, undefined, { timeout: 60_000 });
  const ms = await page.evaluate(() => performance.getEntriesByName('first-result')[0].startTime);
  // Whether the walking times came in time decides what the number means: the footer says which it was.
  const distances = (await page.getByText(/kävelyreittejä|walking routes/).count()) > 0 ? 'on foot' : 'straight lines';
  const pharmacies = await page.locator('ol > li').count();
  runs.push({ ms, distances, pharmacies });
  await context.close();
}
await browser.close();

const sorted = runs.map((run) => run.ms).sort((a, b) => a - b);
const median = sorted[Math.floor(sorted.length / 2)];
console.log(`Time to first result on ${SITE}/${LOCALE}, ${new Date().toISOString()}`);
console.log(`median ${Math.round(median)} ms of ${RUNS} runs (${sorted.map((ms) => Math.round(ms)).join(', ')})`);
console.log(`distances: ${runs.map((run) => run.distances).join(', ')}; rows in the list: ${runs.map((run) => run.pharmacies).join(', ')}`);
