import type { Page } from '@playwright/test';
import { KAMPPI, MONDAY_EVENING, kamppi } from '@/lib/fixtures/tiles';
import { POSITION_REQUEST, carriesPosition } from '@/lib/requests';
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
// The halo and the dot are two pins on the same place: the dot is the last of them.
const dot = (page: Page) => page.locator('[data-pin="you-are-here"]').last();
const card = (page: Page) => page.locator('section', { has: page.getByRole('heading', { name: 'Lähin auki nyt' }) }).last();
const place = (north: number, east: number) => ({ lat: KAMPPI.lat + north / 111_320, lon: KAMPPI.lon + east / 55_400 });

test('the map and the list agree: the same pharmacies, named and lit the same way', async ({ page }) => {
  await start(page, world(kamppi));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  // Six pharmacies: the one in the card and the five rows. Each has one marker, named like its row.
  await expect(markers(page)).toHaveCount(6);
  await expect(marker(page, /^Kampin apteekki, sulkeutuu pian, klo 21, 130 m linnuntietä$/)).toBeVisible();
  await expect(marker(page, /^Yliopiston apteekki, auki klo 24 asti, /)).toBeVisible();
  await expect(marker(page, /^Hietalahden apteekki, kiinni, avautuu huomenna klo 9$/)).toBeVisible();
  // Two of the rows' pharmacies lie beyond the map's upper edge as the results frame it. What
  // the map does not show is no button on it: neither a press nor the keyboard is offered it.
  await expect(marker(page, /^Apteekki, Runeberginkatu 6/)).toBeHidden();
  await expect(marker(page, /^Töölön apteekki/)).toBeHidden();
  // Lit markers carry the distance, like the open rows; unlit ones don't.
  await expect(map(page).locator('button[aria-pressed]', { hasText: /\d/ })).toHaveCount(2);
  // The card's pharmacy is the one that stands out on the map.
  await expect(marker(page, /^Kampin apteekki/)).toHaveAttribute('aria-pressed', 'true');
  await expect(map(page).locator('button[aria-pressed="true"]')).toHaveCount(1);
  // One step out the map shows those two as well, named like their rows.
  await page.getByRole('button', { name: 'Loitonna' }).click();
  await page.clock.runFor(400);
  await expect(marker(page, /^Apteekki, Runeberginkatu 6, aukioloaikoja ei ole merkitty$/)).toBeVisible();
  await expect(marker(page, /^Töölön apteekki, aukioloajat epäselvät/)).toBeVisible();

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
  // The details take the list's place in the panel: the card and the rows are not under them.
  await expect(card(page)).toBeHidden();
  await expect(page.locator('ol > li').first()).toBeHidden();
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
  // The map is there while searching too: wait for the results, which bring the rows and the markers.
  await expect(page.locator('ol > li h3')).toHaveCount(5);
  await expect(markers(page)).toHaveCount(6);
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

test('the dot follows a walk, the list is ranked again after 300 metres, and the position goes out in the walking request alone', async ({ page }) => {
  const seen: { walking: boolean; text: string }[] = [];
  page.context().on('request', (request) =>
    seen.push({
      walking: request.method() === POSITION_REQUEST.method && new URL(request.url()).pathname === POSITION_REQUEST.path,
      text: [request.url(), JSON.stringify(request.headers()), request.postData() ?? ''].join('\n'),
    }),
  );
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

  // To the door of the pharmacy on Mannerheimintie, 320 metres from where the list was ranked,
  // more than two minutes after it was: the list is not ranked again sooner than that.
  const far = place(-262, 182);
  await page.clock.runFor(121_000);
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

  // Not the first position and not a later one: no request carried any of them, but the one for
  // walking times. That one went out twice: for the search, and when the list was ranked again.
  await settle(page);
  expect(seen.length).toBeGreaterThan(5);
  for (const { text } of seen.filter((request) => !request.walking)) {
    for (const position of [KAMPPI, near, far]) expect(carriesPosition(text, position), text.split('\n')[0]).toBe(false);
  }
  const walking = seen.filter((request) => request.walking);
  expect(walking).toHaveLength(2);
  expect(carriesPosition(walking[0].text, KAMPPI)).toBe(true);
  expect(carriesPosition(walking[1].text, far)).toBe(true);
  // From where the list was ranked, each time: a fix that ranked nothing went nowhere.
  const from = walking.map(({ text }) => (JSON.parse(text.split('\n').pop() ?? '{}') as { from: { lat: number; lon: number } }).from);
  const rounded = (value: number) => Math.round(value * 1e5) / 1e5;
  expect(from).toEqual([KAMPPI, { lat: rounded(far.lat), lon: rounded(far.lon) }]);
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
  const chip = map(page).getByRole('button', { name: /^Seuraava auki: Yliopiston apteekki, .* kartan ulkopuolella/ });
  // On the map it is its marker, and has no chip: never both.
  await expect(marker(page, /^Yliopiston apteekki/)).toBeVisible();
  await expect(chip).toBeHidden();
  // Zoom in on the dot until the open pharmacy 320 metres away is outside the view.
  const zoomIn = page.getByRole('button', { name: 'Lähennä' });
  for (let step = 0; step < 4; step++) {
    await zoomIn.click();
    await page.clock.runFor(400);
  }
  await expect(chip).toBeVisible();
  await expect(marker(page, /^Yliopiston apteekki/)).toBeHidden();
  await chip.click();
  await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toHaveText('Yliopiston apteekki');
});

// Janne's iPhone, 25 Nov 2026: from afar six or seven capsules lay on top of each other and on
// the dot, and at country zoom the nearest one still sat large over southern Finland.
test('from afar the markers do not pile up: one stays in full, clear of the dot, and the rest are the map’s small signs', async ({ page }) => {
  await start(page, world(kamppi));
  const pins = page.locator('[data-pin]:not([data-pin="you-are-here"])');
  const signs = page.locator('[data-pin][data-small]');
  const zoomOut = page.getByRole('button', { name: 'Loitonna' });
  const zoomIn = page.getByRole('button', { name: 'Lähennä' });
  const step = async (button: typeof zoomOut) => {
    await button.click();
    await page.clock.runFor(400);
  };
  /** Whether two of the things on the map lie on top of each other, by what is drawn of them. */
  const overlapping = () =>
    page.evaluate(() => {
      const boxes = [...document.querySelectorAll<HTMLElement>('[data-pin]:not([data-small]) [data-full], [data-pin="you-are-here"] span span')]
        .filter((element) => getComputedStyle(element).opacity === '1')
        .map((element) => element.getBoundingClientRect());
      return boxes.some((a, i) => boxes.some((b, j) => i < j && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top));
    });

  // As the results frame it, every marker is in full.
  await expect(pins).toHaveCount(6);
  await expect(signs).toHaveCount(0);
  expect(await overlapping()).toBe(false);

  // The map itself arrives after the results, on the page's clock. The zoom buttons are pressed
  // once it is there (or has failed to come): pressed before, on a slow runner, the map that then
  // arrives starts from the results' own framing again.
  await expect
    .poll(async () => {
      await page.clock.runFor(100);
      return page.locator('[data-map]').getAttribute('data-basemap');
    })
    .not.toBe('plain');

  // Three levels out the neighbourhood is a thumb wide.
  for (let presses = 0; presses < 3; presses++) await step(zoomOut);
  await expect.poll(async () => signs.count()).toBeGreaterThan(2);
  // The card's pharmacy is still in full, with its distance, and nothing in full lies on anything else in full or on the dot.
  const first = marker(page, /^Kampin apteekki/);
  await expect(first.locator('[data-full]')).toBeVisible();
  await expect(first).toContainText(/\d/);
  expect(await overlapping()).toBe(false);
  // A sign is still a button with the pharmacy's name, and opens it. (One that nothing in full lies over.)
  const free = await page.evaluate(() => {
    const pin = [...document.querySelectorAll<HTMLElement>('[data-pin][data-small]')].find((element) => {
      const box = element.querySelector('button')!.getBoundingClientRect();
      return element.contains(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2));
    });
    return pin?.dataset.pin;
  });
  expect(free).toBeDefined();
  const sign = page.locator(`[data-pin="${free}"]`).getByRole('button');
  await expect(sign.locator('[data-full]')).toBeHidden();
  await expect(sign).toHaveAccessibleName(/apteekki/i);
  await sign.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();

  // Where the map shows a region, every marker is a sign: no time sits over a whole town.
  let out = 3;
  while ((await signs.count()) < 6 && out < 10) {
    await step(zoomOut);
    out++;
  }
  await expect(signs).toHaveCount(6);
  // And closer again they come back.
  for (; out > 0; out--) await step(zoomIn);
  await expect(signs).toHaveCount(0);
  expect(await overlapping()).toBe(false);
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

// axe's `target-size`, 25 and 26 Nov 2026: markers with a strip of 44 by 1 px left under the
// phone's sheet, half a marker under the bar with its own chip lying on it, signs four pixels
// apart. A marker is offered as a button only where a finger has room for it (lib/map/declutter.ts).
test.describe('a marker without room to press', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  const open = async (page: Page, view: string) => {
    await page.goto(`/fi/dev/states/${view}`);
    await page.waitForFunction(() => !document.querySelector('[data-map]:not([data-map="ready"])'));
  };
  const pin = (page: Page, id: string) => page.locator(`[data-pin="${id}"]`);
  const chip = (page: Page, id: string) => page.locator(`[data-chip="${id}"]`);

  test('under the phone’s bar it is taken off the map, and an open pharmacy is on its chip instead: never both', async ({ page }) => {
    // Riga: the one open pharmacy lies half under the bar.
    await open(page, 'riga-peek');
    await expect(chip(page, 'meness-brivibas')).toBeVisible();
    await expect(pin(page, 'meness-brivibas').getByRole('button', { includeHidden: true })).toBeHidden();
    await expect(page.getByRole('button', { name: /^Mēness aptieka, .*auki ympäri vuorokauden/ })).toHaveCount(0);
    // Helsinki, the sheet at its lowest: the nearest one stands whole above it. It is its marker, and has no chip.
    await open(page, 'helsinki-peek');
    await expect(pin(page, 'toolon').getByRole('button')).toBeVisible();
    await expect(chip(page, 'toolon')).toHaveCount(0);
    // With the sheet at the card, which the medicine row made taller (26 Nov 2026), the sheet's edge
    // runs through that marker: then it is the other way round, the chip and no marker.
    await open(page, 'helsinki-half');
    await expect(chip(page, 'toolon')).toBeVisible();
    await expect(pin(page, 'toolon').getByRole('button', { includeHidden: true })).toBeHidden();
  });

  test('half under the sheet it is taken off the map, and is back when the sheet is lower', async ({ page }) => {
    // The same pharmacies with the sheet at the card and at its lowest: the sheet's edge runs through one marker.
    await open(page, 'riga-half');
    await expect(pin(page, 'benu-grecinieku').getByRole('button', { includeHidden: true })).toBeHidden();
    await expect(pin(page, 'apotheka-valnu').getByRole('button')).toBeVisible();
    await open(page, 'riga-peek');
    await expect(pin(page, 'apotheka-valnu').getByRole('button')).toBeVisible();
    // Every marker that is a button has at least 24 by 24 px inside what the bar and the sheet leave of the map.
    const rooms = await page.evaluate(() => {
      const sheet = document.querySelector('[data-grab]')!.getBoundingClientRect().top;
      return [...document.querySelectorAll<HTMLElement>('[data-pin]:not([data-away]):not([inert]) button')].map((button) => {
        const box = button.getBoundingClientRect();
        return { width: Math.min(box.right, innerWidth) - Math.max(box.left, 0), height: Math.min(box.bottom, sheet) - Math.max(box.top, 64) };
      });
    });
    expect(rooms.length).toBeGreaterThan(5);
    for (const room of rooms) {
      expect(room.width).toBeGreaterThanOrEqual(24);
      expect(room.height).toBeGreaterThanOrEqual(24);
    }
  });

  test('in a pile of signs it is still drawn and is no button: the keyboard goes to the signs that have room, and to no other', async ({ page }) => {
    // Riga from afar: nine signs within seventy pixels.
    await open(page, 'sheet-far');
    const drawn = page.locator('[data-pin][data-small]:not([data-away])');
    const still = page.locator('[data-pin][data-small][inert]');
    await expect(drawn).toHaveCount(9);
    await expect.poll(async () => still.count()).toBeGreaterThan(3);
    // Still drawn, each in its place.
    await expect(still.first().locator('button')).toBeVisible();
    // Which of the nine take the focus: the ones that are buttons, and at least the first of the pile.
    const takes = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-pin][data-small]')].map((sign) => {
        const button = sign.querySelector('button')!;
        button.focus();
        return { still: sign.inert, focused: document.activeElement === button };
      }),
    );
    expect(takes.filter((sign) => !sign.still).length).toBeGreaterThan(0);
    for (const sign of takes) expect(sign.focused).toBe(!sign.still);
  });
});

// The first drawing of the markers. Reduced motion used to give every element a transition a
// hundredth of a millisecond long: a change of an inherited property then went down the page a
// level a frame, and a marker's disc stood a few frames without its cross (app/globals.css).
// The visual comparison, which asks for reduced motion, drew `sheet-far` in two ways for it.
test('whoever has asked for less motion sees a marker whole at once, not its disc first and its cross a few frames later', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/fi/dev/states/sheet-far');
  await page.waitForFunction(() => !document.querySelector('[data-map]:not([data-map="ready"])'));
  const cross = await page.evaluate(() => {
    const pin = document.querySelector<HTMLElement>('[data-pin][data-small]:not([data-away])')!;
    const glyph = pin.querySelector('button > span:last-child svg')!;
    // Hidden and shown again, and read each time before a frame is drawn: what the pin is, its cross is.
    pin.style.visibility = 'hidden';
    const hidden = getComputedStyle(glyph).visibility;
    pin.style.visibility = '';
    return { hidden, shown: getComputedStyle(glyph).visibility };
  });
  expect(cross).toEqual({ hidden: 'hidden', shown: 'visible' });
});
