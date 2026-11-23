import type { Page } from '@playwright/test';
import { KAMPPI, beyond, farEast, kamppi } from '@/lib/fixtures/tiles';
import { carriesPosition } from '@/lib/requests';
import { tileOf, tilePath } from '@/lib/tiles';
import { expect, test } from './fixtures';
import { hasWebGL, startRunning, world } from './helpers';

/**
 * Every pharmacy on the map, not only the list's ten (Janne's phone test of 23 Nov 2026).
 * The ten keep their markers; the rest are signs the map draws itself, from the tiles the
 * device holds. Moved by hand to a new area, the map asks for that area's squares.
 *
 * The page's clock runs on from the test's moment: the map's own zooming takes real time.
 */

const everything = [...kamppi, ...beyond, ...farEast];
const root = (page: Page) => page.locator('[data-map]');
const region = (page: Page) => page.getByRole('region', { name: 'Kartta: sijaintisi ja lähimmät apteekit' });
const markers = (page: Page) => region(page).locator('button[aria-pressed]');
const signs = (page: Page) => root(page).evaluate((element) => Number((element as HTMLElement).dataset.area ?? 0));
const zoom = (page: Page) => root(page).evaluate((element) => Number((element as HTMLElement).dataset.zoom));
const squareOf = (pharmacy: { lat: number; lon: number }) => {
  const square = tileOf(pharmacy);
  return tilePath(square.x, square.y);
};

/** The pixel of a place: from where the dot is drawn, and the map's own scale at this latitude. */
async function pixelOf(page: Page, place: { lat: number; lon: number }) {
  const dot = (await page.locator('[data-pin="you-are-here"]').last().boundingBox())!;
  const metersPerPixel = (40075016.686 * Math.cos((KAMPPI.lat * Math.PI) / 180)) / (512 * 2 ** (await zoom(page)));
  const east = (place.lon - KAMPPI.lon) * 111_320 * Math.cos((KAMPPI.lat * Math.PI) / 180);
  const north = (place.lat - KAMPPI.lat) * 110_574;
  return { x: dot.x + east / metersPerPixel, y: dot.y - north / metersPerPixel };
}

async function live(page: Page) {
  const asked = await startRunning(page, world(everything));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('3 apteekkia auki juuri nyt');
  test.skip(!(await hasWebGL(page)), 'This browser has no WebGL: the signs are the map’s own drawing.');
  await expect(root(page)).toHaveAttribute('data-basemap', 'live');
  await expect(root(page).locator('canvas')).toBeVisible();
  return asked;
}

const zoomOut = async (page: Page, steps: number) => {
  for (let step = 0; step < steps; step++) {
    const before = await zoom(page);
    await page.getByRole('button', { name: 'Loitonna' }).click();
    await expect.poll(() => zoom(page)).toBeCloseTo(before - 1, 1);
  }
};

test('the list’s ten have markers, and every other pharmacy on the device is a sign on the map', async ({ page }) => {
  const asked = await live(page);
  // Fourteen pharmacies within reach of the search: ten in the list, four more on the map.
  await expect(page.locator('ol > li h3')).toHaveCount(9);
  await expect(markers(page)).toHaveCount(10);
  await expect.poll(() => signs(page)).toBe(4);
  // Twenty kilometres east is not on the device, and framing the results asked for nothing.
  expect(asked).not.toContain(squareOf(farEast[0]));
});

test('a sign opens its pharmacy like a row does, and it becomes the marked one', async ({ page }) => {
  await live(page);
  await zoomOut(page, 3);
  const meilahti = beyond.find((pharmacy) => pharmacy.name === 'Meilahden apteekki')!;
  const at = await pixelOf(page, meilahti);
  // A finger is not that exact: a few pixels beside the sign still count.
  await page.mouse.click(at.x + 6, at.y - 5);
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByRole('heading', { level: 2 })).toHaveText('Meilahden apteekki');
  await expect(sheet).toContainText('Auki klo 22 asti');
  await expect(sheet).toContainText('Mannerheimintie 96');
  // It has a marker of its own now, named like the list's, and it is the one that is marked.
  await expect(markers(page)).toHaveCount(11);
  await expect(region(page).getByRole('button', { name: /^Meilahden apteekki, auki klo 22 asti/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(region(page).locator('button[aria-pressed="true"]')).toHaveCount(1);

  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(markers(page)).toHaveCount(10);
  // A press on empty ground picks nothing.
  await page.mouse.click(at.x - 60, at.y - 80);
  await expect(sheet).toBeHidden();
});

test('moved by hand to a new area, the map asks for that area’s squares, and for nothing that says where the user is', async ({ page }) => {
  const seen: string[] = [];
  page.context().on('request', (request) => seen.push([request.url(), JSON.stringify(request.headers()), request.postData() ?? ''].join('\n')));
  const asked = await live(page);
  await expect.poll(() => signs(page)).toBe(4);
  const before = asked.length;

  // Out to the whole region, and then the map is dragged west: Sipoo comes into view.
  await zoomOut(page, 5);
  const box = (await root(page).boundingBox())!;
  const from = { x: box.x + box.width * 0.7, y: box.y + box.height / 2 };
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let step = 1; step <= 10; step++) await page.mouse.move(from.x - step * 40, from.y, { steps: 2 });
  await page.mouse.up();

  await expect.poll(() => asked).toContain(squareOf(farEast[0]));
  await expect.poll(() => signs(page)).toBe(6);
  // Squares only: every new request is a tile by its number.
  for (const path of asked.slice(before)) expect(path).toMatch(/^\/tiles\/v1\/10\/\d+\/\d+\.json$/);
  // The list is still the search's ten: the map looking elsewhere changes no answer.
  await expect(markers(page)).toHaveCount(10);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('3 apteekkia auki juuri nyt');
  for (const text of seen) expect(carriesPosition(text, KAMPPI), text.split('\n')[0]).toBe(false);
});
