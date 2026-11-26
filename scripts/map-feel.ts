/**
 * The map under a finger, measured (DESIGN-LOG.md, 26 Nov 2026): what a flick, a pinch and
 * the one-finger zoom do, how even the frames are meanwhile, and how long the map squares a
 * flick brings into view take to arrive.
 *
 * Chromium as a phone (390 by 844, three device pixels to one, touch), the CPU four times
 * slower, on /dev/map: the results view on the real map tiles. The touches are Chromium's
 * own, made a frame apart (DevTools' synthesizeScrollGesture and synthesizePinchGesture).
 * Its map is drawn by a software renderer here, not by a phone's GPU: the numbers show where
 * the cost is and compare one build with another; what a phone does, a phone has to say.
 *
 * It needs a build with the /dev pages, and it asks the map tile host for the squares a
 * visitor would see: some sixty requests. Run it for a pull request, not in a loop.
 *
 *   DEV_ROUTES=1 npm run build && DEV_ROUTES=1 npm run start -- -p 3210
 *   node scripts/map-feel.ts [http://localhost:3210] [maplibre]
 *
 * With `maplibre` as the second word the page leaves the map as MapLibre has it
 * (`?touch=maplibre`): its own glide and its own direction for the one-finger zoom.
 */
import { chromium } from '@playwright/test';

const SITE = (process.argv[2] ?? 'http://localhost:3210').replace(/\/$/, '');
const PLAIN = process.argv[3] === 'maplibre';
const VIEW = `${SITE}/fi/dev/map/helsinki-noon${PLAIN ? '?touch=maplibre' : ''}`;
const FLICKS: { name: string; from: { x: number; y: number }; by: { x: number; y: number }; speed: number }[] = [
  { name: 'flick right, 600 px/s', from: { x: 100, y: 330 }, by: { x: 180, y: 0 }, speed: 600 },
  { name: 'flick left, 1200 px/s', from: { x: 300, y: 330 }, by: { x: -200, y: 0 }, speed: 1200 },
  { name: 'flick up, 1200 px/s', from: { x: 200, y: 460 }, by: { x: 0, y: -220 }, speed: 1200 },
  { name: 'flick down, 2400 px/s', from: { x: 200, y: 160 }, by: { x: 0, y: 300 }, speed: 2400 },
];

interface Frame {
  t: number;
  x: number;
  y: number;
  zoom: number;
  event?: string;
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'fi-FI', timezoneId: 'Europe/Helsinki' });
const page = await context.newPage();
const devtools = await context.newCDPSession(page);

// Every request for a map square: when it was asked for and when it had arrived, on the page's own clock.
const squares: { asked: number; arrived?: number }[] = [];
const clock = () => page.evaluate(() => performance.now());
page.on('request', (request) => {
  if (!request.url().endsWith('.pbf')) return;
  const square: { asked: number; arrived?: number } = { asked: NaN };
  squares.push(square);
  void clock().then((now) => (square.asked = now));
  void request.response().then(async () => (square.arrived = await clock()));
});

await page.goto(VIEW);
await page.locator('[data-map][data-basemap="live"]').waitFor({ timeout: 30_000 });
await page.waitForTimeout(4000);
await devtools.send('Emulation.setCPUThrottlingRate', { rate: 4 });

// Where the dot is and how close the map is, on every frame, and when a finger touches and lifts.
await page.evaluate(() => {
  const frames: { t: number; x: number; y: number; zoom: number; event?: string }[] = [];
  (window as unknown as { frames: typeof frames }).frames = frames;
  const map = document.querySelector<HTMLElement>('[data-map]')!;
  const pin = [...document.querySelectorAll<HTMLElement>('[data-pin="you-are-here"]')].pop()!;
  const now = () => {
    const [x, y] = (pin.style.transform.match(/-?[\d.]+/g) ?? []).map(Number);
    return { t: performance.now(), x, y, zoom: Number(map.dataset.zoom) };
  };
  const tick = () => {
    frames.push(now());
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  for (const event of ['touchstart', 'touchend']) document.addEventListener(event, () => frames.push({ ...now(), event }), { capture: true, passive: true });
});
const framesSince = async (from: number) => (await page.evaluate(() => (window as unknown as { frames: Frame[] }).frames)).filter((frame) => frame.t >= from);
const zoom = () => page.locator('[data-map]').evaluate((element) => Number((element as HTMLElement).dataset.zoom));

const rows: string[] = [];
const evenness = (frames: Frame[]) => {
  const drawn = frames.filter((frame) => !frame.event);
  const gaps = drawn.slice(1).map((frame, index) => frame.t - drawn[index].t).sort((a, b) => a - b);
  return `${gaps.length} frames, one every ${Math.round(gaps[Math.floor(gaps.length / 2)])} ms (median), ${gaps.filter((gap) => gap > 34).length} over 34 ms, ${gaps.filter((gap) => gap > 50).length} over 50 ms, longest ${Math.round(gaps[gaps.length - 1])} ms`;
};

for (const flick of FLICKS) {
  const from = await clock();
  const asked = squares.length;
  await devtools.send('Input.synthesizeScrollGesture', { x: flick.from.x, y: flick.from.y, xDistance: flick.by.x, yDistance: flick.by.y, speed: flick.speed, gestureSourceType: 'touch', preventFling: false });
  await page.waitForTimeout(3500);
  const frames = await framesSince(from);
  const lifted = frames.findLast((frame) => frame.event === 'touchend')!;
  const along = (frame: Frame) => (flick.by.x !== 0 ? frame.x : frame.y) * Math.sign(flick.by.x || flick.by.y);
  const before = frames.filter((frame) => !frame.event && frame.t < lifted.t && frame.t >= lifted.t - 80);
  const speed = ((along(before[before.length - 1]) - along(before[0])) / (before[before.length - 1].t - before[0].t)) * 1000;
  const within = (ms: number) => Math.round(along(frames.findLast((frame) => frame.t <= lifted.t + ms)!) - along(lifted));
  const atRest = frames.find((frame) => frame.t > lifted.t && along(frame) === along(frames[frames.length - 1]))!;
  const moving = frames.filter((frame) => frame.t <= atRest.t);
  const brought = squares.slice(asked).filter((square) => square.arrived !== undefined);
  const lastSquare = brought.length ? Math.round(Math.max(...brought.map((square) => square.arrived!)) - lifted.t) : undefined;
  rows.push(
    `${flick.name}: finger ${Math.round(speed)} px/s at lifting; the map went on ${within(200)} px in the first 200 ms, ${within(3400)} px in all, at rest after ${Math.round(atRest.t - lifted.t)} ms. ` +
      `While it moved: ${evenness(moving)}. Map squares asked for: ${squares.length - asked}${lastSquare === undefined ? '' : `, the last one there ${lastSquare} ms after lifting`}.`,
  );
}

for (const [name, scaleFactor] of [['pinch apart', 2.2], ['pinch together', 0.45]] as const) {
  const from = await clock();
  const before = await zoom();
  await devtools.send('Input.synthesizePinchGesture', { x: 195, y: 380, scaleFactor, relativeSpeed: 400, gestureSourceType: 'touch' });
  await page.waitForTimeout(1500);
  const frames = await framesSince(from);
  const lifted = frames.findLast((frame) => frame.event === 'touchend')!;
  rows.push(`${name}: zoom ${before.toFixed(2)} to ${(await zoom()).toFixed(2)}. While the fingers were down: ${evenness(frames.filter((frame) => frame.t <= lifted.t))}.`);
}

// Two taps, the second one held, then a drag: which way is closer.
for (const [name, dy] of [['two taps and a drag up', -120], ['two taps and a drag down', 120]] as const) {
  const before = await zoom();
  const at = { x: 300, y: 330 };
  const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', points: { x: number; y: number }[]) => devtools.send('Input.dispatchTouchEvent', { type, touchPoints: points.map((point, id) => ({ ...point, id })) });
  await touch('touchStart', [at]);
  await page.waitForTimeout(30);
  await touch('touchEnd', []);
  await page.waitForTimeout(90);
  await touch('touchStart', [at]);
  for (let step = 1; step <= 12; step++) {
    await touch('touchMove', [{ x: at.x, y: Math.round(at.y + (dy * step) / 12) }]);
    await page.waitForTimeout(16);
  }
  await touch('touchEnd', []);
  await page.waitForTimeout(1200);
  rows.push(`${name}, 120 px: zoom ${before.toFixed(2)} to ${(await zoom()).toFixed(2)}.`);
}

const scale = await page.evaluate(() => window.visualViewport?.scale ?? 1);
await browser.close();

console.log(`The map under a finger on ${VIEW}, ${new Date().toISOString()}`);
console.log(`Chromium, 390 by 844 at three device pixels to one, CPU four times slower, software renderer.${PLAIN ? ' As MapLibre has it.' : ''}`);
for (const row of rows) console.log(`- ${row}`);
console.log(`- The page itself was never zoomed: its scale is ${scale}.`);
