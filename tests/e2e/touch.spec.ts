import type { Locator, Page } from '@playwright/test';
import { kamppi } from '@/lib/fixtures/tiles';
import { expect, test } from './fixtures';
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
