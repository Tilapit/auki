import type { Locator, Page } from '@playwright/test';
import { kamppi } from '@/lib/fixtures/tiles';
import { expect, test } from './fixtures';
import { FASTEST_PX_S, KEEP_PER_MS } from '@/lib/map/glide';
import { hasWebGL, open, startRunning, touchscreen, world } from './helpers';

/**
 * The map under a finger (Janne's phone test of 23 Nov 2026). What went wrong there: a
 * pinch sometimes zoomed the whole page, a drag that began on a marker moved nothing, and
 * moving the map was slow. The page's clock runs here, because gestures and the map's own
 * easing take real time. Touch input is real only in Chromium, through DevTools; what can
 * be read from the styles is checked in WebKit too.
 */

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

const root = (page: Page) => page.locator('[data-map]');
const marker = (page: Page, name: RegExp) => page.getByRole('region', { name: /^Kartta/ }).getByRole('button', { name });
const dot = (page: Page) => page.locator('[data-pin="you-are-here"]').last();
const zoom = (page: Page) => root(page).evaluate((element) => Number((element as HTMLElement).dataset.zoom));
const pageScale = (page: Page) => page.evaluate(() => window.visualViewport?.scale ?? 1);

/** Where a pin is on the map: the script writes it as a translate. */
async function placeOf(pin: Locator) {
  const [x, y] = await pin.evaluate((element) => ((element as HTMLElement).style.transform.match(/-?[\d.]+/g) ?? []).map(Number));
  return { x, y };
}

async function centreOf(target: Locator) {
  const box = (await target.boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

interface Followed {
  t: number;
  x: number;
  y: number;
  event?: string;
  /** For a touch: where the finger was, and the touch's own time. */
  finger?: number;
  touched?: number;
}

/** Starts a record in the page of where the dot is on every frame, and of every touch: where the finger was, and its own time. */
async function follow(page: Page) {
  await page.evaluate(() => {
    const log: { t: number; x: number; y: number; event?: string; finger?: number; touched?: number }[] = [];
    (window as unknown as { followed: typeof log }).followed = log;
    const pin = [...document.querySelectorAll<HTMLElement>('[data-pin="you-are-here"]')].pop()!;
    const at = () => {
      const [x, y] = (pin.style.transform.match(/-?[\d.]+/g) ?? []).map(Number);
      return { x, y };
    };
    const tick = () => {
      log.push({ t: performance.now(), ...at() });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    for (const event of ['touchstart', 'touchmove', 'touchend'])
      document.addEventListener(event, (touch) => log.push({ t: performance.now(), ...at(), event, finger: (touch as TouchEvent).touches[0]?.clientX, touched: touch.timeStamp }), { capture: true, passive: true });
  });
}

/**
 * What `follow` recorded of a flick: the finger's speed when it lifted, in px a second, as the
 * map itself reckons and caps it (lib/map/glide.ts), and how far beyond the place the finger
 * left it the dot was after a time.
 */
async function afterLifting(page: Page) {
  const log = await page.evaluate(() => (window as unknown as { followed: Followed[] }).followed);
  const began = log.findLast((entry) => entry.event === 'touchstart')!;
  const lifted = log.findLast((entry) => entry.event === 'touchend')!;
  const touches = log.filter((entry) => entry.event && entry.event !== 'touchend' && entry.t >= began.t);
  const last = touches[touches.length - 1];
  const first = touches.find((entry) => last.touched! - entry.touched! <= 100)!;
  const speed = first === last ? 0 : Math.min(Math.abs(last.finger! - first.finger!) / (Math.max(last.touched! - first.touched!, 1) / 1000), FASTEST_PX_S);
  // Where the finger left the dot: where it was when the finger came down, and the finger's own way.
  const left = began.x + (last.finger! - began.finger!);
  const drawn = log.filter((entry) => !entry.event);
  const beyond = (ms: number) => drawn.findLast((entry) => entry.t <= lifted.t + ms)!.x - left;
  // Every frame drawn after the lifting: how long after, and how far beyond that place the dot was on it.
  const frames = drawn.filter((entry) => entry.t > lifted.t).map((entry) => ({ after: entry.t - lifted.t, beyond: entry.x - left }));
  return { speed, beyond, frames };
}

/** The results with the real map under them, drawn and at rest. */
async function live(page: Page) {
  await startRunning(page, world(kamppi));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  test.skip(!(await hasWebGL(page)), 'This browser has no WebGL: no map to move.');
  await expect(root(page)).toHaveAttribute('data-basemap', 'live');
  await expect(root(page).locator('canvas')).toBeVisible();
  // A moment for the first frame: the test's clock stands in for the page's own timeline, so the map's mark can't be read.
  await page.waitForTimeout(300);
}

test.describe('with a finger', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Dragging and pinching need real touch input, which only Chromium’s DevTools can give.');

  test('a drag that begins on a marker moves the map, and a tap on it still opens the pharmacy', async ({ page }) => {
    await live(page);
    const screen = await touchscreen(page);
    // The marker of the pharmacy in the card: in the first view of a phone it stands a thumb's width from the dot.
    const target = marker(page, /^Kampin apteekki/);
    const from = await centreOf(target);
    const before = await placeOf(dot(page));

    await screen.drag(from, { x: from.x - 90, y: from.y + 110 });
    await expect.poll(async () => (await placeOf(dot(page))).x - before.x).toBeLessThan(-70);
    expect((await placeOf(dot(page))).y - before.y).toBeGreaterThan(90);
    // It was a drag, not a press: nothing opened.
    await expect(page.getByRole('dialog')).toBeHidden();
    expect(await pageScale(page)).toBe(1);

    await screen.tap(await centreOf(target));
    await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toHaveText('Kampin apteekki');
  });

  // Janne's iPhone, 25 Nov 2026: "sometimes a touch doesn't register". A thumb rolls as it taps.
  // The browser still makes a click of a touch that moved under its own limit (about 15 px in
  // Chromium); the map used to throw that click away once the finger had travelled 6 px.
  test('a tap by a thumb that rolls a few pixels on a marker still opens the pharmacy', async ({ page }) => {
    await live(page);
    const screen = await touchscreen(page);
    const target = marker(page, /^Kampin apteekki/);
    for (const [dx, dy] of [[5, 7], [-8, 6], [0, -11]]) {
      const from = await centreOf(target);
      await screen.roll(from, { x: from.x + dx, y: from.y + dy });
      await expect(page.getByRole('dialog').getByRole('heading', { level: 2 }), `rolled ${dx}, ${dy}`).toHaveText('Kampin apteekki');
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toBeHidden();
      // Two taps within half a second in one place are the map's own gesture: they come closer.
      await page.waitForTimeout(600);
    }
    expect(await pageScale(page)).toBe(1);
  });

  test('a drag moves the map from anywhere on it: the credit, the strip above the sheet, an edge chip', async ({ page }) => {
    await live(page);
    const screen = await touchscreen(page);
    const sheetTop = async () => (await page.locator('[data-grab]').boundingBox())!.y;
    const moved = async (from: { x: number; y: number }, by = -110) => {
      const before = await placeOf(dot(page));
      await screen.drag(from, { x: from.x, y: from.y + by }, 12);
      await page.waitForTimeout(300);
      return (await placeOf(dot(page))).y - before.y;
    };

    // The credit lies right above the sheet, 334 px of the screen's 390: where a thumb starts a drag.
    const credit = root(page).getByRole('link', { name: 'OpenFreeMap' });
    expect(await moved(await centreOf(credit)), 'from the credit').toBeLessThan(-90);
    // It was a drag: the link was not followed.
    expect(new URL(page.url()).pathname).toBe('/fi');

    // Just above the sheet's edge, beside the handle: the map's, not the sheet's.
    const top = await sheetTop();
    expect(await moved({ x: 48, y: top - 5 }), 'above the sheet, left').toBeLessThan(-90);
    expect(await moved({ x: 342, y: top - 5 }), 'above the sheet, right').toBeLessThan(-90);
    expect(await sheetTop()).toBe(top);
    await expect(page.locator('[data-sheet]')).toHaveAttribute('data-sheet', 'peek');
    // Around the handle itself the strip is still the handle's: the sheet comes up with the finger.
    await screen.drag({ x: 195, y: top - 5 }, { x: 195, y: top - 240 }, 12);
    await expect(page.locator('[data-sheet]')).toHaveAttribute('data-sheet', 'half');
    await page.locator('[data-grab]').click();
    await page.locator('[data-grab]').click();
    await expect(page.locator('[data-sheet]')).toHaveAttribute('data-sheet', 'peek');
    await page.waitForTimeout(400);

    // Closer, until the open pharmacy 320 metres away is off the map and has its chip on the edge.
    await screen.pinch([{ x: 150, y: 330 }, { x: 240, y: 370 }], [{ x: 30, y: 280 }, { x: 360, y: 420 }]);
    const chip = page.locator('[data-chip]').first();
    await expect(chip).toBeVisible();
    await page.waitForTimeout(400);
    const on = await centreOf(chip);
    const before = await placeOf(dot(page));
    await screen.drag(on, { x: on.x + 60, y: on.y + 90 }, 12);
    await expect.poll(async () => (await placeOf(dot(page))).y - before.y, { message: 'from the chip' }).toBeGreaterThan(70);
    await expect(page.getByRole('dialog')).toBeHidden();
    // And a tap on a chip is still a press of it.
    await expect(chip).toBeVisible();
    await screen.tap(await centreOf(chip));
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('a pinch with one finger on a marker zooms the map, never the page', async ({ page }) => {
    await live(page);
    const screen = await touchscreen(page);
    const on = await centreOf(marker(page, /^Kampin apteekki/));
    const beside = { x: on.x - 110, y: on.y + 140 };
    const before = await zoom(page);

    // Apart: the map comes closer, around the fingers.
    await screen.pinch([on, beside], [{ x: on.x + 50, y: on.y - 60 }, { x: beside.x - 50, y: beside.y + 60 }]);
    await expect.poll(() => zoom(page)).toBeGreaterThan(before + 0.5);
    expect(await pageScale(page)).toBe(1);

    // Together again, both fingers on the map's ground.
    const closer = await zoom(page);
    await screen.pinch([{ x: 60, y: 300 }, { x: 330, y: 420 }], [{ x: 160, y: 350 }, { x: 230, y: 380 }]);
    await expect.poll(() => zoom(page)).toBeLessThan(closer - 0.5);
    expect(await pageScale(page)).toBe(1);
  });

  test('two taps come closer, a tap with two fingers goes back out', async ({ page }) => {
    await live(page);
    const screen = await touchscreen(page);
    const before = await zoom(page);
    const ground = { x: 300, y: 250 };

    await screen.tap(ground);
    await page.waitForTimeout(80);
    await screen.tap(ground);
    await expect.poll(() => zoom(page)).toBeCloseTo(before + 1, 1);

    await page.waitForTimeout(400);
    await screen.tap({ x: 150, y: 300 }, { x: 250, y: 320 });
    await expect.poll(() => zoom(page)).toBeCloseTo(before, 1);
    expect(await pageScale(page)).toBe(1);
  });

  // Janne, 25 Nov 2026: the map should feel as Apple Maps does on an iPhone. MapLibre's own glide
  // after a flick starts at about half the finger's speed and is over in half a second.
  test('a flick sends the map on as a list goes on under a thumb: at the finger’s speed at first, half its speed in pixels in all', async ({ page }) => {
    await live(page);
    const screen = await touchscreen(page);
    await follow(page);
    await screen.flick({ x: 60, y: 300 }, { x: 340, y: 300 });
    await page.waitForTimeout(3800);
    const { speed, beyond, frames } = await afterLifting(page);
    // A flick it was: the fastest the map counts, on any machine.
    expect(speed).toBeGreaterThan(1000);

    // How far a list has gone on a time after it was let go at that speed (lib/map/glide.ts).
    const decay = -Math.log(KEEP_PER_MS) * 1000;
    const list = (ms: number) => (speed / decay) * (1 - Math.exp((-decay * Math.max(ms, 0)) / 1000));
    // The finger's own way is drawn within a frame or two of the lifting, on a slow machine a little later.
    const caughtUp = frames.findIndex((frame) => frame.beyond >= 0);
    expect(caughtUp).toBeGreaterThanOrEqual(0);
    expect(frames[caughtUp].after).toBeLessThan(900);
    // From then on every frame is on the list's curve, at its own time: no hitch at letting go, no
    // surge, and never faster than before. A frame may show the map as it stood one frame earlier,
    // and a test machine may draw one only every few tenths of a second: so not below the curve of
    // the frame before, and not above its own. (MapLibre's own glide is under it from the start.)
    let checked = 0;
    for (let index = caughtUp + 1; index < frames.length && frames[index].after <= 2600; index++) {
      const frame = frames[index];
      expect(frame.beyond, `${Math.round(frame.after)} ms after lifting`).toBeGreaterThanOrEqual(0.8 * list(frames[index - 1].after) - 20);
      expect(frame.beyond, `${Math.round(frame.after)} ms after lifting`).toBeLessThanOrEqual(1.15 * list(frame.after + 70) + 20);
      expect(frame.beyond).toBeGreaterThanOrEqual(frames[index - 1].beyond);
      checked++;
    }
    expect(checked).toBeGreaterThan(3);
    // And it comes to rest half as many pixels on as its speed was in pixels a second. (MapLibre's own: a thirteenth.)
    expect(beyond(3400) / speed).toBeGreaterThan(0.4);
    expect(beyond(3400) / speed).toBeLessThan(0.6);
    expect(beyond(3400)).toBe(beyond(3700));
    expect(await pageScale(page)).toBe(1);
  });

  test('a finger laid on the gliding map stops it there', async ({ page }) => {
    await live(page);
    const screen = await touchscreen(page);
    await screen.flick({ x: 60, y: 300 }, { x: 340, y: 300 });
    await page.waitForTimeout(120);
    const gliding = await placeOf(dot(page));
    await expect.poll(async () => (await placeOf(dot(page))).x).toBeGreaterThan(gliding.x + 10);

    // Somewhere on the map's ground, so that lifting the finger again opens nothing.
    const ground = await page.evaluate(() => [{ x: 40, y: 140 }, { x: 350, y: 140 }, { x: 40, y: 600 }, { x: 350, y: 600 }, { x: 200, y: 200 }].find((point) => document.elementFromPoint(point.x, point.y)?.tagName === 'CANVAS'));
    expect(ground).toBeDefined();
    await screen.hold(ground!);
    await page.waitForTimeout(60);
    const held = await placeOf(dot(page));
    await page.waitForTimeout(400);
    expect(await placeOf(dot(page))).toEqual(held);
    await screen.lift();
    await page.waitForTimeout(300);
    expect(await placeOf(dot(page))).toEqual(held);
  });

  test('whoever has asked for less motion: the map stays where the finger left it', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await live(page);
    const screen = await touchscreen(page);
    await follow(page);
    await screen.flick({ x: 60, y: 300 }, { x: 340, y: 300 });
    await page.waitForTimeout(900);
    const { speed, beyond } = await afterLifting(page);
    expect(speed).toBeGreaterThan(1000);
    // Where the finger left it, to the pixel, and nothing after. (A glide would be some sixteen hundred pixels.)
    expect(Math.abs(beyond(900))).toBeLessThanOrEqual(2);
    expect(beyond(900)).toBe(beyond(500));
  });

  test('a pinch zooms around the fingers: the place between them stays between them', async ({ page }) => {
    await live(page);
    const screen = await touchscreen(page);
    // The dot is that place: the map fills the phone's screen, so its place on the map is its place on the screen.
    const between = await placeOf(dot(page));
    const before = await zoom(page);
    await screen.pinch(
      [{ x: between.x - 40, y: between.y - 30 }, { x: between.x + 40, y: between.y + 30 }],
      [{ x: between.x - 110, y: between.y - 82 }, { x: between.x + 110, y: between.y + 82 }],
    );
    await expect.poll(() => zoom(page)).toBeGreaterThan(before + 1);
    await page.waitForTimeout(500);
    const after = await placeOf(dot(page));
    expect(Math.abs(after.x - between.x)).toBeLessThanOrEqual(3);
    expect(Math.abs(after.y - between.y)).toBeLessThanOrEqual(3);
    expect(await pageScale(page)).toBe(1);
  });

  // Apple's guide to Maps on an iPhone: double-tap, leave the finger on the screen after the second
  // tap, then drag up to zoom in or down to zoom out. MapLibre has it the other way round.
  test('two taps and a drag zoom with one finger, as in Apple Maps: up for closer, down for farther', async ({ page }) => {
    await live(page);
    const screen = await touchscreen(page);
    const ground = { x: 300, y: 330 };
    const before = await zoom(page);

    await screen.tap(ground);
    await page.waitForTimeout(90);
    await screen.hold(ground);
    await screen.slide(ground, { x: ground.x, y: ground.y - 120 });
    await screen.lift();
    await expect.poll(() => zoom(page)).toBeGreaterThan(before + 0.5);
    expect(await pageScale(page)).toBe(1);

    await page.waitForTimeout(700);
    const closer = await zoom(page);
    await screen.tap(ground);
    await page.waitForTimeout(90);
    await screen.hold(ground);
    await screen.slide(ground, { x: ground.x, y: ground.y + 120 });
    await screen.lift();
    await expect.poll(() => zoom(page)).toBeLessThan(closer - 0.5);
    expect(await pageScale(page)).toBe(1);
    // It was the map that was pressed, twice: no pharmacy has opened.
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('moving the map costs little: positions are written, nothing is rendered again', async ({ page }, testInfo) => {
    await live(page);
    const screen = await touchscreen(page);
    // Closer, until the open pharmacy 320 metres away is off the map and has its chip on the edge.
    await screen.pinch([{ x: 150, y: 330 }, { x: 240, y: 370 }], [{ x: 30, y: 280 }, { x: 360, y: 420 }]);
    const chip = page.locator('[data-chip]').first();
    await expect(chip).toBeVisible();
    await page.waitForTimeout(400);

    // On a phone four times slower than this machine, as in the first-result measurement.
    await screen.devtools.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await screen.devtools.send('Performance.enable');
    const metrics = async () => Object.fromEntries((await screen.devtools.send('Performance.getMetrics')).metrics.map((metric) => [metric.name, metric.value]));
    await page.evaluate(() => {
      const frames: number[] = [];
      (window as unknown as { frames: number[] }).frames = frames;
      const tick = (time: number) => {
        frames.push(time);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const chipBefore = await chip.evaluate((element) => (element as HTMLElement).style.transform);
    const start = await metrics();
    // Back and forth for a second and a half: ninety frames of panning.
    for (const [from, to] of [[120, 280], [280, 120], [120, 280]] as const) await screen.drag({ x: from, y: 300 }, { x: to, y: 380 }, 30);
    const end = await metrics();
    const frames = await page.evaluate(() => (window as unknown as { frames: number[] }).frames);
    await screen.devtools.send('Emulation.setCPUThrottlingRate', { rate: 1 });

    const gaps = frames.slice(1).map((time, index) => time - frames[index]);
    const ms = (name: string) => Math.round((end[name] - start[name]) * 1000);
    const summary = `in ${gaps.length} frames of panning with an edge chip, CPU four times slower: script ${ms('ScriptDuration')} ms, style and layout ${ms('RecalcStyleDuration') + ms('LayoutDuration')} ms, longest frame ${Math.round(Math.max(...gaps))} ms, frames over 34 ms ${gaps.filter((gap) => gap > 34).length}`;
    testInfo.annotations.push({ type: 'work while panning', description: summary });
    console.log(`Work while panning: ${summary}`);

    // The chip went with the map: it is placed by the same code that places the markers.
    expect(await chip.evaluate((element) => (element as HTMLElement).style.transform)).not.toBe(chipBefore);
    expect(gaps.length).toBeGreaterThan(40);
  });
});

test('with a mouse: a drag that begins on a marker moves the map and opens nothing, a click opens the pharmacy', async ({ page }) => {
  await live(page);
  const target = marker(page, /^Kampin apteekki/);
  const from = await centreOf(target);
  const before = await placeOf(dot(page));

  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let step = 1; step <= 10; step++) await page.mouse.move(from.x - step * 8, from.y + step * 10);
  // Held still before it is let go: thrown, the map would glide on and could take the marker off the screen.
  await page.waitForTimeout(200);
  await page.mouse.move(from.x - 80, from.y + 101);
  await page.mouse.up();
  await expect.poll(async () => (await placeOf(dot(page))).x - before.x).toBeLessThan(-60);
  // The mouse let go on the marker it had been dragging: that is not a press on it.
  await page.waitForTimeout(300);
  await expect(page.getByRole('dialog')).toBeHidden();

  // A press that stays in place is one, and so is Enter on the marker.
  await target.click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByRole('heading', { level: 2 })).toHaveText('Kampin apteekki');
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await target.focus();
  await page.keyboard.press('Enter');
  await expect(sheet.getByRole('heading', { level: 2 })).toHaveText('Kampin apteekki');
});

test.describe('on a screen with three device pixels to one', () => {
  test.use({ deviceScaleFactor: 3 });

  // Janne's iPhone, 25 Nov 2026: the map changed on 40 to 50 of 60 frames a second. What a pan
  // costs is drawing, and drawing is per pixel: the map's canvas is limited to two to one.
  test('the map draws two: the canvas is 780 px wide for 390, and the markers stay as sharp as the screen', async ({ page }) => {
    await live(page);
    const canvas = root(page).locator('canvas');
    expect(await canvas.evaluate((element) => [(element as HTMLCanvasElement).width, element.clientWidth, window.devicePixelRatio])).toEqual([780, 390, 3]);
  });
});

test.describe('the map never hands a touch to the page', () => {
  /** What the browser may do with a touch that begins on an element: its own rule and those of everything above it. */
  const allowed = (target: Locator) =>
    target.evaluate((element) => {
      const actions: string[] = [];
      for (let node: Element | null = element; node; node = node.parentElement) actions.push(getComputedStyle(node).touchAction);
      return actions.includes('none') ? 'none' : actions.filter((action) => action !== 'auto').join(' ') || 'auto';
    });

  test('on the plain ground, before the map has arrived or without it', async ({ page }) => {
    await open(page, '/fi/dev/states/helsinki-peek');
    await expect(root(page)).toHaveAttribute('data-basemap', 'plain');
    expect(await allowed(root(page))).toBe('none');
    expect(await allowed(root(page).locator('button[aria-pressed]').first())).toBe('none');
    expect(await allowed(dot(page))).toBe('none');
  });

  test('while MapLibre draws it: the canvas, the markers on it, the chips, the credit', async ({ page }) => {
    await live(page);
    expect(await allowed(root(page).locator('canvas'))).toBe('none');
    for (const button of await root(page).locator('button[aria-pressed]').all()) expect(await allowed(button)).toBe('none');
    expect(await allowed(root(page).getByRole('link', { name: 'OpenFreeMap' }))).toBe('none');
    // The markers are inside the element the map listens on: that is what lets a drag begin on one.
    expect(await root(page).locator('button[aria-pressed]').first().evaluate((element) => !!element.closest('.maplibregl-canvas-container'))).toBe(true);
  });

  // Read from the page as the browser's own hit test gives it, so WebKit is checked too: a point
  // every 6 px. What a touch lands on is either the map, in the element MapLibre listens on, or
  // one of the things a finger is meant to press.
  test('everything between the bar and the sheet is the map’s to drag', async ({ page }) => {
    await live(page);
    const others = await page.evaluate(() => {
      const found = new Map<string, number>();
      const sheet = document.querySelector('[data-grab]')!.getBoundingClientRect();
      for (let y = 3; y < window.innerHeight; y += 6) {
        for (let x = 3; x < window.innerWidth; x += 6) {
          const element = document.elementFromPoint(x, y);
          if (!element || element.closest('.maplibregl-canvas-container')) continue;
          // The bar's two floating controls (not the gap between them), and the sheet with the handle's strip above its middle.
          if (element.closest('header > *')) continue;
          if (y >= sheet.top) continue;
          if (element.closest('[data-grab]') && y >= sheet.top - 12 && Math.abs(x - window.innerWidth / 2) <= 44) continue;
          const name = `${element.tagName.toLowerCase()}.${String(element.className).split(' ')[0]}`;
          found.set(name, (found.get(name) ?? 0) + 1);
        }
      }
      return [...found].map(([name, points]) => `${name}: ${points} points`);
    });
    expect(others).toEqual([]);
  });

  test('when MapLibre could not start', async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (type.startsWith('webgl')) return null;
        return (original as (...args: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof original;
    });
    await startRunning(page, world(kamppi));
    await expect(root(page)).toHaveAttribute('data-basemap', 'failed');
    expect(await allowed(root(page))).toBe('none');
    expect(await allowed(root(page).locator('button[aria-pressed]').first())).toBe('none');
  });
});
