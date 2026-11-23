import type { Page } from '@playwright/test';
import { KAMPPI, MONDAY_EVENING, kamppi } from '@/lib/fixtures/tiles';
import { carriesPosition } from '@/lib/requests';
import { expect, test } from './fixtures';
import { fakeMapTiles, hasWebGL, settle, start, walkTo, world } from './helpers';

/**
 * M4: the map (PLAN.md section 5 and section 11). The pharmacies come from fixture tiles,
 * the map tile host is answered by the test with empty tiles, and the page's clock is the
 * test's. What is checked is everything the app itself puts on the map: the markers, the
 * dot, the edge chips, and that they always say what the list says.
 */

const map = (page: Page) => page.getByRole('region', { name: 'Kartta: sijaintisi ja lähimmät apteekit' });
const markers = (page: Page) => map(page).locator('button[aria-pressed]');
const marker = (page: Page, name: string | RegExp) => map(page).getByRole('button', { name });
const dot = (page: Page) => page.locator('[data-pin="you-are-here"]');
const card = (page: Page) => page.locator('section', { has: page.getByRole('heading', { name: 'Lähin auki nyt' }) }).last();
const place = (north: number, east: number) => ({ lat: KAMPPI.lat + north / 111_320, lon: KAMPPI.lon + east / 55_400 });

test('the map and the list agree: the same pharmacies, named and lit the same way', async ({ page }) => {
  await start(page, world(kamppi));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  // Six pharmacies: the one in the card and the five rows. Each has one marker, named like its row.
  await expect(markers(page)).toHaveCount(6);
  await expect(marker(page, /^Kampin apteekki, sulkeutuu pian, klo 21, 130 metriä linnuntietä$/)).toBeVisible();
  await expect(marker(page, /^Yliopiston apteekki, auki klo 24 asti, /)).toBeVisible();
  await expect(marker(page, /^Hietalahden apteekki, kiinni, avautuu huomenna klo 9$/)).toBeVisible();
  await expect(marker(page, /^Apteekki, Runeberginkatu 6, aukioloaikoja ei ole merkitty$/)).toBeVisible();
  await expect(marker(page, /^Töölön apteekki, aukioloajat epäselvät/)).toBeVisible();
  // Lit markers carry the distance, like the open rows; unlit ones don't.
  await expect(map(page).locator('button[aria-pressed]', { hasText: /\d/ })).toHaveCount(2);
  // The card's pharmacy is the one that stands out on the map.
  await expect(marker(page, /^Kampin apteekki/)).toHaveAttribute('aria-pressed', 'true');
  await expect(map(page).locator('button[aria-pressed="true"]')).toHaveCount(1);

  // A minute's tick changes both at once: at 21:01 the nearest one has closed, on the map as in the card.
  await page.clock.runFor(21 * 60_000);
  await expect(card(page).getByRole('heading', { level: 3 })).toHaveText('Yliopiston apteekki');
  await expect(marker(page, /^Kampin apteekki, kiinni, avautuu huomenna klo 8$/)).toBeVisible();
  await expect(marker(page, /^Yliopiston apteekki/)).toHaveAttribute('aria-pressed', 'true');
  await expect(map(page).locator('button[aria-pressed]', { hasText: /\d/ })).toHaveCount(1);
});

test('a marker opens the same pharmacy as its row, and a row marks its marker', async ({ page }) => {
  await start(page, world(kamppi));
  await marker(page, /^Yliopiston apteekki/).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByRole('heading', { level: 2 })).toHaveText('Yliopiston apteekki');
  await expect(marker(page, /^Yliopiston apteekki/)).toHaveAttribute('aria-pressed', 'true');
  await expect(marker(page, /^Kampin apteekki/)).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(marker(page, /^Kampin apteekki/)).toHaveAttribute('aria-pressed', 'true');

  // From the list: the row's pharmacy becomes the marked one.
  await page.getByRole('button', { name: 'Hietalahden apteekki', exact: true }).click();
  await expect(sheet.getByRole('heading', { level: 2 })).toHaveText('Hietalahden apteekki');
  await expect(marker(page, /^Hietalahden apteekki/)).toHaveAttribute('aria-pressed', 'true');
  await expect(map(page).locator('button[aria-pressed="true"]')).toHaveCount(1);
});

test('the list comes before the map in the tab order, and the map has a name', async ({ page }) => {
  await start(page, world(kamppi));
  await expect(map(page)).toBeVisible();
  const order = await page.evaluate(() => {
    const first = document.querySelector('ol li h3 button');
    const pin = document.querySelector('[data-map] button[aria-pressed]');
    return first && pin ? first.compareDocumentPosition(pin) & Node.DOCUMENT_POSITION_FOLLOWING : 0;
  });
  expect(order).toBeTruthy();
});

test('the list and the markers work when the map cannot start', async ({ page }) => {
  // No WebGL in this browser: MapLibre can't draw.
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type.startsWith('webgl')) return null;
      return (original as (...args: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof original;
  });
  await start(page, world(kamppi));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  await expect(page.getByText('Karttapohja ei latautunut. Lista ja merkit toimivat ilman sitä.')).toBeVisible();
  await expect(page.locator('[data-map]')).toHaveAttribute('data-basemap', 'failed');
  // Everything the app itself draws is still there, and still works.
  await expect(page.locator('ol > li h3')).toHaveCount(5);
  await expect(markers(page)).toHaveCount(6);
  await marker(page, /^Yliopiston apteekki/).click();
  await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toHaveText('Yliopiston apteekki');
});

test('map tiles that never arrive: the map says so, and the rest is as it was', async ({ page }) => {
  await fakeMapTiles(page, 'down');
  await start(page, world(kamppi));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  // The map's code arrives after the results, and works on the page's clock.
  await expect(page.locator('[data-map]')).not.toHaveAttribute('data-basemap', 'plain');
  await settle(page);
  await expect(page.getByText('Karttapohja ei latautunut. Lista ja merkit toimivat ilman sitä.')).toBeVisible();
  await expect(page.locator('ol > li h3')).toHaveCount(5);
  await expect(markers(page)).toHaveCount(6);
});

test('the dot follows a walk, the list is ranked again after 300 metres, and none of it leaves the device', async ({ page }) => {
  const seen: string[] = [];
  page.context().on('request', (request) => seen.push([request.url(), JSON.stringify(request.headers()), request.postData() ?? ''].join('\n')));
  const asked = await start(page, world(kamppi));
  await expect(card(page).getByRole('heading', { level: 3 })).toHaveText('Kampin apteekki');
  const transform = () => dot(page).evaluate((element) => (element as HTMLElement).style.transform);
  const before = await transform();
  const tilesBefore = asked.length;

  // A hundred metres north: the dot moves, the list stays as it is.
  const near = place(100, 0);
  expect(await walkTo(page, near)).toBe(1);
  await expect.poll(transform).not.toBe(before);
  await expect(card(page).getByRole('heading', { level: 3 })).toHaveText('Kampin apteekki');
  await expect(card(page)).toContainText('130 m');

  // To the door of the pharmacy on Mannerheimintie, 320 metres from where the list was ranked.
  const far = place(-262, 182);
  await walkTo(page, far);
  await expect(card(page).getByRole('heading', { level: 3 })).toHaveText('Yliopiston apteekki');
  await expect(page.locator('ol > li h3').first()).toHaveText('Kampin apteekki');
  // The tiles were on the device already: ranking again asked for nothing.
  expect(asked.length).toBe(tilesBefore);

  // While the page is hidden nothing listens; it starts again when the page returns.
  const visibility = (state: string) =>
    page.evaluate((value) => {
      Object.defineProperty(document, 'visibilityState', { get: () => value, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    }, state);
  await visibility('hidden');
  expect(await walkTo(page, place(-600, 0))).toBe(0);
  await expect(card(page).getByRole('heading', { level: 3 })).toHaveText('Yliopiston apteekki');
  await visibility('visible');
  expect(await walkTo(page, far)).toBe(1);

  // Not the first position and not a later one: no request carried any of them.
  await settle(page);
  expect(seen.length).toBeGreaterThan(5);
  for (const text of seen) {
    for (const position of [KAMPPI, near, far]) expect(carriesPosition(text, position), text.split('\n')[0]).toBe(false);
  }
});

test('a searched place is not followed: no watch on the device', async ({ page }) => {
  await start(page, world(kamppi));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  expect(await walkTo(page, place(10, 0))).toBe(1);
  await page.route('**/api/geocode**', (route) => route.fulfill({ json: { place: { lat: 60.1689, lon: 24.9325, label: 'Kamppi, Helsinki' } } }));
  await page.getByRole('button', { name: /Hae toinen paikka/ }).first().click();
  await page.getByRole('searchbox', { name: 'Paikka' }).fill('Kamppi');
  await page.getByRole('button', { name: 'Hae', exact: true }).click();
  await settle(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  expect(await walkTo(page, place(500, 0))).toBe(0);
});

test('an open pharmacy off the map gets a chip on the edge, and the chip brings it into view', async ({ page }) => {
  await start(page, world(kamppi));
  // Zoom in on the dot until the open pharmacy 320 metres away is outside the view.
  const zoomIn = page.getByRole('button', { name: 'Lähennä' });
  for (let step = 0; step < 4; step++) {
    await zoomIn.click();
    await page.clock.runFor(400);
  }
  const chip = map(page).getByRole('button', { name: /^Seuraava auki: Yliopiston apteekki, .* kartan ulkopuolella/ });
  await expect(chip).toBeVisible();
  await chip.click();
  await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toHaveText('Yliopiston apteekki');
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the sheet opens and closes by dragging, and a tap on its handle still works', async ({ page }) => {
    await start(page, world(kamppi));
    const open = page.getByRole('button', { name: 'Näytä lista' });
    const close = page.getByRole('button', { name: 'Pienennä lista' });
    await expect(open).toBeVisible();
    const rows = page.locator('ol > li h3');
    await expect(rows.first()).toBeHidden();

    const drag = async (from: { x: number; y: number }, by: number) => {
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      for (let step = 1; step <= 8; step++) await page.mouse.move(from.x, from.y + (by * step) / 8);
      await page.mouse.up();
    };
    const centre = async (target: typeof open) => {
      const box = (await target.boundingBox())!;
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    };

    // Up by most of the way: it opens, and the list is there.
    await drag(await centre(open), -360);
    await expect(close).toBeVisible();
    await expect(rows.first()).toBeVisible();
    // A short drag doesn't count: it settles back where it was.
    await drag(await centre(close), 60);
    await expect(close).toBeVisible();
    // Down again: collapsed.
    await drag(await centre(close), 360);
    await expect(open).toBeVisible();
    await expect(rows.first()).toBeHidden();
    // Collapsed, the whole sheet is the handle: dragging the answer itself opens it too.
    await drag(await centre(page.getByRole('heading', { name: 'Kampin apteekki' }).first()), -360);
    await expect(close).toBeVisible();
    // And the handle is still a button.
    await close.click();
    await expect(open).toBeVisible();
    await open.click();
    await expect(close).toBeVisible();
  });
});

test('the map draws itself only after the results, on real code and a faked host', async ({ page, mapTiles }) => {
  await start(page, world(kamppi), MONDAY_EVENING);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  test.skip(!(await hasWebGL(page)), 'This browser has no WebGL: the plain map is checked in its own test.');
  await expect(page.locator('[data-map]')).toHaveAttribute('data-basemap', 'live');
  await settle(page);
  await expect.poll(() => mapTiles.length).toBeGreaterThan(0);
  expect(mapTiles[0]).toBe('/planet');
  // The credit names the tile host and the data, next to OpenStreetMap's own.
  await expect(map(page).getByRole('link', { name: 'OpenFreeMap' })).toHaveAttribute('href', 'https://openfreemap.org');
  await expect(map(page).getByRole('link', { name: '© OpenMapTiles' })).toBeVisible();
  await expect(map(page).getByRole('link', { name: '© OpenStreetMapin tekijät' })).toBeVisible();
});
