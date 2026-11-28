import type { Page } from '@playwright/test';
import { KAMPPI, MONDAY_EVENING, beyond, farOpen, kamppi } from '@/lib/fixtures/tiles';
import { WAKE_REQUEST, carriesPosition } from '@/lib/requests';
import type { TilePharmacy } from '@/lib/tiles';
import { expect, test } from './fixtures';
import { HERE, fakeLocation, fakePlaces, fakeTiles, fakeWalking, gridWalk, hasWebGL, locateButton, open, searchingStatus, settle, start, walkTo, world, type WalkingAsked } from './helpers';

/**
 * M5: walking times, ehditkö and the route line (PLAN.md 7.1, steps 4, 5, 7 and 10). The
 * walking request is answered by the test: a walk is three tenths longer than the straight
 * line unless a test says otherwise. The page's clock is the test's: Monday 23 November
 * 2026 at 20:41 in Helsinki.
 */

const rows = (page: Page) => page.locator('ol > li h3');
const card = (page: Page) => page.locator('section', { has: page.getByRole('heading', { name: 'Lähin auki nyt' }) }).last();
const isAt = (place: { lat: number; lon: number }, pharmacy: TilePharmacy) => Math.abs(place.lat - pharmacy.lat) < 1e-5 && Math.abs(place.lon - pharmacy.lon) < 1e-5;
const [kampin, yliopiston] = kamppi;

test('the list is in walking order, with minutes, and the walking request is made once', async ({ page }) => {
  // The nearest by straight line, 134 m away, is across the tracks: sixteen minutes on foot.
  const asked = await fakeWalking(page, (_from, to) => (isAt(to, kampin) ? { meters: 1300, seconds: 936 } : undefined));
  await start(page, world(kamppi));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');

  // The card leads with the nearest open one on foot.
  await expect(card(page).getByRole('heading', { level: 3 })).toHaveText('Yliopiston apteekki');
  await expect(card(page)).toContainText('5 min');
  await expect(card(page)).toContainText('410 m kävellen');
  await expect(card(page)).toContainText('Auki klo 24 asti');
  // The others by walking time: the one across the tracks has dropped to where it belongs.
  await expect(rows(page)).toHaveText(['Hietalahden apteekki', 'Apteekki Runeberginkatu 6', 'Töölön apteekki', 'Kampin apteekki', 'Kruununhaan apteekki']);
  const row = page.locator('ol > li', { hasText: 'Kampin apteekki' });
  await expect(row).toContainText('16 min');
  await expect(row).toContainText('1,3 km');
  // And the results say what the distances are.
  await expect(page.getByText('Kävelymatkan mukaan')).toBeVisible();
  await expect(page.getByText('Etäisyydet ovat kävelyreittejä.')).toBeVisible();
  await expect(page.getByText('linnuntietä')).toHaveCount(0);

  // One request for the times: the position and the six pharmacies, nothing else.
  const times = asked.filter((request) => !request.route);
  expect(times).toHaveLength(1);
  expect(times[0].from).toEqual(HERE);
  expect(times[0].to).toHaveLength(6);
  expect(Object.keys(times[0]).sort()).toEqual(['from', 'to']);
});

test('walking times for the twenty nearest, the list shows the first ten of that order', async ({ page }) => {
  const twentyFour = [...kamppi, ...beyond, ...beyond.map((pharmacy, index): TilePharmacy => ({ ...pharmacy, id: `n5${index}`, name: `Apteekki ${index}`, lat: pharmacy.lat + 0.0101, lon: pharmacy.lon + 0.0203 })), farOpen];
  const asked = await fakeWalking(page);
  await start(page, world(twentyFour));
  await expect(page.getByRole('heading', { level: 1 })).toContainText('auki juuri nyt');
  expect(asked.filter((request) => !request.route)[0].to).toHaveLength(20);
  // Ten results: the one in the card and nine rows.
  await expect(rows(page)).toHaveCount(9);
});

test('walking times that take too long: after a second and a half the list is by straight line, and a late answer changes nothing', async ({ page }) => {
  let release: (() => Promise<void>) | undefined;
  await page.route('**/api/walking', async (route) => {
    if (route.request().method() === WAKE_REQUEST.method) return route.fallback();
    const body = route.request().postDataJSON() as { to: unknown[] };
    // Held, and answered only when the test says so: long after the list is on screen.
    release = () => route.fulfill({ json: { walks: body.to.map((_, index) => ({ meters: 5000 - index * 100, seconds: 3600 - index * 60 })) } }).catch(() => undefined);
  });
  await page.clock.install({ time: new Date((MONDAY_EVENING - 60) * 1000) });
  await fakeLocation(page, 'allow');
  await fakeTiles(page, world(kamppi));
  await open(page, '/fi');
  await page.clock.pauseAt(new Date(MONDAY_EVENING * 1000));
  await locateButton(page).click();
  // The request is out, and the page's clock has not moved since: the wait starts here.
  await expect.poll(() => release !== undefined).toBe(true);

  // 1.4 s in: still waiting for the walking times, with the searching view on screen.
  await page.clock.runFor(1400);
  await expect(searchingStatus(page)).toBeVisible();
  await expect(rows(page)).toHaveCount(0);
  // 1.5 s: the list goes on without them, in straight-line order, and says so.
  await page.clock.runFor(200);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  await expect(card(page).getByRole('heading', { level: 3 })).toHaveText('Kampin apteekki');
  await expect(card(page)).toContainText('linnuntietä');
  await expect(page.getByText('Etäisyydet ovat linnuntietä.')).toBeVisible();
  const order = await rows(page).allTextContents();

  // The answer comes after all, and would turn the order upside down: nothing moves.
  await release!();
  await page.clock.runFor(5000);
  expect(await rows(page).allTextContents()).toEqual(order);
  await expect(card(page).getByRole('heading', { level: 3 })).toHaveText('Kampin apteekki');
  await expect(page.getByText('Etäisyydet ovat linnuntietä.')).toBeVisible();
});

test('a walking service that says no: the list is there at once, by straight line', async ({ page, walkingAsked }) => {
  // The default of these tests: our server without a key answers 503.
  await start(page, world(kamppi));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  await expect(card(page)).toContainText('130 m');
  await expect(card(page)).toContainText('linnuntietä');
  await expect(page.getByText('Linnuntietä', { exact: true })).toBeVisible();
  await expect(page.getByText('Etäisyydet ovat linnuntietä.')).toBeVisible();
  // It was asked once and not again: no retry, and no route line without walking times.
  await settle(page);
  expect(walkingAsked).toHaveLength(1);
});

test('one pharmacy without a walking route stays in the list, after the others, with its straight line', async ({ page }) => {
  await fakeWalking(page, (_from, to) => (isAt(to, kampin) ? null : undefined));
  await start(page, world(kamppi));
  await expect(card(page).getByRole('heading', { level: 3 })).toHaveText('Yliopiston apteekki');
  await expect(rows(page).last()).toHaveText('Kampin apteekki');
  const row = page.locator('ol > li', { hasText: 'Kampin apteekki' });
  await expect(row).toContainText('130 m');
  await expect(row).not.toContainText('min');
});

test.describe('ehditkö', () => {
  test('closing within the hour: arrival, closing and the slack, as three numbers that add up', async ({ page }) => {
    await fakeWalking(page);
    await start(page, world(kamppi));
    // 134 m by straight line, 170 m and three minutes on foot; it closes at 21.
    await expect(card(page).getByRole('heading', { level: 3 })).toHaveText('Kampin apteekki');
    await expect(card(page)).toContainText('3 min');
    await expect(card(page)).toContainText('Perillä 20.44. Sulkeutuu 21.00. 16 minuuttia pelivaraa.');
    await expect(card(page)).toContainText('16 min pelivaraa');
    // The clock moves, the walk doesn't: a minute later there is a minute less.
    await page.clock.runFor(60_000);
    await expect(card(page)).toContainText('Perillä 20.45. Sulkeutuu 21.00. 15 minuuttia pelivaraa.');
  });

  test('the timeline starts at 60 minutes before closing, not at 61', async ({ page }) => {
    await fakeWalking(page);
    // 19.59: Kampin apteekki closes in 61 minutes.
    await start(page, world(kamppi), MONDAY_EVENING - 42 * 60);
    await expect(card(page).getByRole('heading', { level: 3 })).toHaveText('Kampin apteekki');
    await expect(card(page)).toContainText('Auki klo 21 asti');
    await expect(card(page)).not.toContainText('pelivaraa');
    await page.clock.runFor(60_000);
    await expect(card(page)).toContainText('Perillä 20.03. Sulkeutuu 21.00. 57 minuuttia pelivaraa.');
  });

  test('too late: the card says so, keeps the call, and puts the next open one forward with its route', async ({ page }) => {
    await fakeWalking(page);
    // 20.57: three minutes on foot is 21.00, which is closing time.
    await start(page, world(kamppi), MONDAY_EVENING + 16 * 60);
    await expect(card(page).getByRole('heading', { level: 3 }).first()).toHaveText('Kampin apteekki');
    await expect(card(page)).toContainText('Et ehdi ennen sulkemista');
    await expect(card(page)).toContainText('Sulkeutuu klo 21, olisit perillä 21.00.');
    await expect(card(page).getByRole('link', { name: 'Soita: Kampin apteekki' })).toBeVisible();
    await expect(card(page)).toContainText('Seuraava auki');
    await expect(card(page).getByRole('heading', { level: 3 }).nth(1)).toHaveText('Yliopiston apteekki');
    await card(page).getByRole('button', { name: 'Reitti kävellen: Yliopiston apteekki' }).click();
    await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toHaveText('Yliopiston apteekki');
  });

  test('a minute earlier there is a minute to spare, and it is amber', async ({ page }) => {
    await fakeWalking(page);
    await start(page, world(kamppi), MONDAY_EVENING + 15 * 60);
    await expect(card(page)).toContainText('Perillä 20.59. Sulkeutuu 21.00. 1 minuutti pelivaraa.');
    await expect(card(page)).not.toContainText('Et ehdi');
  });

  test('when the only open pharmacy nearby closes before a walk there ends, a farther open one is offered', async ({ page }) => {
    await fakeWalking(page);
    // Only Kampin apteekki is open nearby, until 21; Jumbon apteekki, 14 km away, never closes.
    const others = kamppi.slice(1).map((pharmacy): TilePharmacy => (pharmacy.hours.kind === 'parsed' ? { ...pharmacy, hours: kamppi[2].hours } : pharmacy));
    await start(page, world([kampin, ...others, farOpen]), MONDAY_EVENING + 17 * 60);
    await expect(card(page)).toContainText('Et ehdi ennen sulkemista');
    await expect(card(page)).toContainText('Seuraava auki');
    await expect(card(page).getByRole('heading', { level: 3 }).nth(1)).toHaveText('Jumbon apteekki');
    // Fourteen kilometres is not a walk: the button promises a route, not a walking route.
    await expect(card(page).getByRole('button', { name: 'Reitti: Jumbon apteekki' })).toBeVisible();
  });
});

test('the pharmacy sheet: the walk, the hand-off, the website, the email, and the note form at the pharmacy', async ({ page }) => {
  await fakeWalking(page);
  const withContacts: TilePharmacy[] = [{ ...kampin, email: 'kamppi@apteekki.example; toinen@apteekki.example', website: 'https://www.kampinapteekki.example/yhteystiedot' }, ...kamppi.slice(1)];
  await start(page, world(withContacts));
  await card(page).getByRole('button', { name: 'Reitti kävellen: Kampin apteekki' }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByRole('heading', { level: 2 })).toHaveText('Kampin apteekki');
  await expect(sheet).toContainText('3 min');
  await expect(sheet).toContainText('170 m kävellen');
  // The coming seven days from the tile's intervals, equal days as one line.
  await expect(sheet).toContainText('Joka päivä 8.00–21.00');
  // The hand-off carries the pharmacy's position, and nothing of the user's.
  const google = sheet.getByRole('link', { name: 'Reitti Google Mapsissa' });
  await expect(google).toHaveAttribute('href', `https://www.google.com/maps/dir/?api=1&destination=${kampin.lat},${kampin.lon}&travelmode=walking`);
  await expect(sheet.getByRole('link', { name: 'Reitti Apple Kartoissa' })).toHaveAttribute('href', `https://maps.apple.com/?daddr=${kampin.lat},${kampin.lon}&dirflg=w`);
  // Its own website by host name, and the first address of the email tag.
  await expect(sheet.getByRole('link', { name: 'kampinapteekki.example' })).toHaveAttribute('href', 'https://www.kampinapteekki.example/yhteystiedot');
  await expect(sheet.getByRole('link', { name: 'kamppi@apteekki.example' })).toHaveAttribute('href', 'mailto:kamppi@apteekki.example');
  // The note link opens OpenStreetMap's form with its marker on the pharmacy.
  const fix = sheet.getByRole('link', { name: 'Korjaa OpenStreetMapissa: Kampin apteekki' });
  await expect(fix).toHaveAttribute('href', `https://www.openstreetmap.org/note/new?lat=${kampin.lat}&lon=${kampin.lon}#map=19/${kampin.lat}/${kampin.lon}`);
  await expect(sheet).toContainText('Väärät tiedot? Korjaa OpenStreetMapissa.');
  let leaving = 0;
  for (const link of await sheet.getByRole('link').all()) {
    const href = (await link.getAttribute('href')) ?? '';
    expect(carriesPosition(href, HERE), href).toBe(false);
    // A link that leaves the app opens in a tab of its own, so the results stay as they were, and
    // says so to a screen reader. The new tab gets no referrer and no way back to this one.
    if (!href.startsWith('http')) continue;
    leaving++;
    await expect(link, href).toHaveAttribute('target', '_blank');
    await expect(link, href).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link, href).toHaveAccessibleName(/\(avautuu uuteen välilehteen\)$/);
  }
  // The two map apps, the pharmacy's own website and the note form.
  expect(leaving).toBe(4);

  // Where the hours are missing, the same link sits under the line that says so.
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Apteekki Runeberginkatu 6' }).click();
  await expect(sheet).toContainText('Aukioloaikoja ei ole merkitty');
  await expect(sheet.getByRole('link', { name: 'Korjaa OpenStreetMapissa: Apteekki' })).toHaveCount(2);
});

/**
 * Whose map app the route button opens (Janne, 27 Nov 2026): Apple's on an iPhone, an iPad and
 * a Mac, Google's everywhere else, on foot in both, and the other of the two a row further
 * down. The device is known by the name its browser gives itself, which each case sets here.
 */
const DEVICES = [
  ['an iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1', 'apple'],
  ['an iPad, which calls itself a Mac', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15', 'apple'],
  ['a Mac, in Chrome', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 'apple'],
  ['an Android phone', 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', 'google'],
  ['a Windows computer', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 'google'],
] as const;

for (const [device, userAgent, app] of DEVICES) {
  test.describe(`the route button on ${device}`, () => {
    test.use({ userAgent });
    test(`opens ${app === 'apple' ? 'Apple Maps' : 'Google Maps'}, on foot, and the other map app is a row below it`, async ({ page }) => {
      await fakeWalking(page);
      await start(page, world(kamppi));
      await card(page).getByRole('button', { name: 'Reitti kävellen: Kampin apteekki' }).click();
      const sheet = page.getByRole('dialog');
      const links = {
        apple: { name: 'Reitti Apple Kartoissa (avautuu uuteen välilehteen)', href: `https://maps.apple.com/?daddr=${kampin.lat},${kampin.lon}&dirflg=w` },
        google: { name: 'Reitti Google Mapsissa (avautuu uuteen välilehteen)', href: `https://www.google.com/maps/dir/?api=1&destination=${kampin.lat},${kampin.lon}&travelmode=walking` },
      };
      const other = app === 'apple' ? 'google' : 'apple';
      // The button: "Reitti", with the app's name under it, and a name that says both.
      const button = sheet.locator('a[data-route]');
      await expect(button).toHaveCount(1);
      await expect(button).toHaveAttribute('data-route', app);
      await expect(button).toHaveAccessibleName(links[app].name);
      await expect(button).toHaveAttribute('href', links[app].href);
      await expect(button).toContainText(app === 'apple' ? 'Apple Kartoissa' : 'Google Mapsissa');
      // The other app: one link, further down.
      const row = sheet.getByRole('link', { name: links[other].name });
      await expect(row).toHaveCount(1);
      await expect(row).toHaveAttribute('href', links[other].href);
      expect((await row.boundingBox())!.y).toBeGreaterThan((await button.boundingBox())!.y);
      // Each opens in a tab of its own and tells the map app nothing of where it came from.
      for (const link of [button, row]) {
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      }
    });
  });
}

test('the route line: asked for through the same request, once per pharmacy, and drawn on the map', async ({ page }) => {
  const asked = await fakeWalking(page);
  await start(page, world(kamppi));
  await expect(card(page).getByRole('heading', { level: 3 })).toHaveText('Kampin apteekki');
  test.skip(!(await hasWebGL(page)), 'The route is a layer of the map: without WebGL there is no map to draw it on.');
  const map = page.locator('[data-map]');
  await expect(map).toHaveAttribute('data-basemap', 'live');
  await settle(page);

  // Unasked, the line leads to the card's pharmacy: the nearest open one.
  await expect(map).toHaveAttribute('data-route', 'n101');
  const routes = () => asked.filter((request) => request.route);
  expect(routes()).toHaveLength(1);
  expect(routes()[0]).toEqual({ from: HERE, to: [{ lat: kampin.lat, lon: kampin.lon }], route: true });

  // Another pharmacy selected: its route replaces the first.
  await page.getByRole('button', { name: 'Yliopiston apteekki', exact: true }).click();
  await settle(page);
  await expect(map).toHaveAttribute('data-route', 'n102');
  expect(routes()).toHaveLength(2);
  expect(routes()[1].to).toEqual([{ lat: yliopiston.lat, lon: yliopiston.lon }]);

  // Back to the first: its line is on the device already.
  await page.keyboard.press('Escape');
  await settle(page);
  await expect(map).toHaveAttribute('data-route', 'n101');
  // A closed pharmacy gets its line when it is asked about.
  await page.getByRole('button', { name: 'Hietalahden apteekki', exact: true }).click();
  await settle(page);
  await expect(map).toHaveAttribute('data-route', 'n103');
  expect(routes()).toHaveLength(3);
});

test('no line leads to a closed door unasked', async ({ page }) => {
  const asked = await fakeWalking(page);
  // 22.00: only Yliopiston apteekki is open; make the nearest one the selected by default instead.
  const closed = kamppi.map((pharmacy): TilePharmacy => (pharmacy.hours.kind === 'parsed' ? { ...pharmacy, hours: kamppi[2].hours } : pharmacy));
  await start(page, world(closed));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lähistöllä ei ole yhtään apteekkia auki');
  test.skip(!(await hasWebGL(page)), 'The route is a layer of the map.');
  await expect(page.locator('[data-map]')).toHaveAttribute('data-basemap', 'live');
  await settle(page);
  await settle(page);
  expect(asked.filter((request) => request.route)).toHaveLength(0);
});

test('following a walk asks for walking times again from the new position, and not sooner than two minutes', async ({ page }) => {
  const asked = await fakeWalking(page);
  await start(page, world(kamppi));
  await expect(card(page).getByRole('heading', { level: 3 })).toHaveText('Kampin apteekki');
  const times = () => asked.filter((request) => !request.route);
  expect(times()).toHaveLength(1);

  // To the door of the pharmacy on Mannerheimintie, 320 m away, a minute after the search: too soon to ask again.
  const far = { lat: KAMPPI.lat - 262 / 111_320, lon: KAMPPI.lon + 182 / 55_400 };
  await page.clock.runFor(60_000);
  expect(await walkTo(page, far)).toBe(1);
  await settle(page);
  expect(times()).toHaveLength(1);
  await expect(card(page).getByRole('heading', { level: 3 })).toHaveText('Kampin apteekki');

  // Two minutes after the search the next fix ranks the list again, with walking times from where the device is now.
  await page.clock.runFor(61_000);
  await walkTo(page, far);
  await settle(page);
  expect(times()).toHaveLength(2);
  expect(times()[1].from).toEqual({ lat: Math.round(far.lat * 1e5) / 1e5, lon: Math.round(far.lon * 1e5) / 1e5 });
  await expect(card(page).getByRole('heading', { level: 3 })).toHaveText('Yliopiston apteekki');
  await expect(card(page)).toContainText('1 min');
});

test('a walk during which the walking service goes down: the list is ranked again by straight line, and says so', async ({ page }) => {
  let down = false;
  await page.route('**/api/walking', async (route) => {
    if (route.request().method() === WAKE_REQUEST.method) return route.fallback();
    const asked = route.request().postDataJSON() as WalkingAsked;
    if (down) await route.fulfill({ status: 503, json: { error: 'paused' } });
    else await route.fulfill({ json: { walks: asked.to.map((to) => gridWalk(asked.from, to)) } });
  });
  await start(page, world(kamppi));
  await expect(page.getByText('Etäisyydet ovat kävelyreittejä.')).toBeVisible();
  down = true;
  await page.clock.runFor(121_000);
  await walkTo(page, { lat: KAMPPI.lat - 262 / 111_320, lon: KAMPPI.lon + 182 / 55_400 });
  await settle(page);
  await expect(card(page).getByRole('heading', { level: 3 })).toHaveText('Yliopiston apteekki');
  await expect(page.getByText('Etäisyydet ovat linnuntietä.')).toBeVisible();
  await expect(card(page)).toContainText('linnuntietä');
});

test('a searched place: walking times from the place, and nothing follows the device', async ({ page }) => {
  const asked = await fakeWalking(page);
  await page.clock.install({ time: new Date((MONDAY_EVENING - 60) * 1000) });
  await fakeLocation(page, 'ignore');
  await fakeTiles(page, world(kamppi));
  // A place a little off the fixture's own position, so the two can be told apart.
  const place = { lat: 60.1689, lon: 24.9325 };
  await fakePlaces(page, { place: { ...place, label: 'Kamppi, Helsinki' } });
  await open(page, '/fi');
  await page.clock.pauseAt(new Date(MONDAY_EVENING * 1000));
  await page.getByRole('button', { name: 'Hae paikan nimellä' }).click();
  await page.getByRole('searchbox', { name: 'Paikka' }).fill('Kamppi');
  await page.getByRole('button', { name: 'Hae', exact: true }).click();
  await settle(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  await expect(page.getByText('Etäisyydet ovat kävelyreittejä.')).toBeVisible();
  const times = asked.filter((request) => !request.route);
  expect(times).toHaveLength(1);
  expect(times[0].from).toEqual(place);
  // No watch on the device for a searched place: a fix can't rank anything again.
  await page.clock.runFor(121_000);
  expect(await walkTo(page, { lat: 60.2, lon: 25 })).toBe(0);
  expect(asked.filter((request) => !request.route)).toHaveLength(1);
});

test('pharmacies too far to walk to: minutes in the list, no route line, and a button that promises no walk', async ({ page }) => {
  const asked = await fakeWalking(page);
  // Everything near Kamppi moved five kilometres north.
  const far = kamppi.map((pharmacy): TilePharmacy => ({ ...pharmacy, lat: Math.round((pharmacy.lat + 0.045) * 1e5) / 1e5 }));
  await start(page, world(far));
  // The one that was to the south is now the nearest, an hour and a quarter away.
  await expect(card(page).getByRole('heading', { level: 3 })).toHaveText('Yliopiston apteekki');
  await expect(card(page)).toContainText('km kävellen');
  await expect(card(page).getByRole('button', { name: 'Reitti: Yliopiston apteekki' })).toBeVisible();
  if (await hasWebGL(page)) {
    await expect(page.locator('[data-map]')).toHaveAttribute('data-basemap', 'live');
    await settle(page);
    await settle(page);
  }
  expect(asked.filter((request) => request.route)).toHaveLength(0);
});

test('our own walking route refuses what it should not pass on, and a page of another site', async ({ request }) => {
  // Answered by our server without calling openrouteservice.
  for (const data of [{}, { from: HERE, to: [] }, { from: HERE, to: [{ lat: 61.5, lon: 24.9 }] }, { from: { lat: 95, lon: 0 }, to: [HERE] }]) {
    const response = await request.post('/api/walking', { data });
    expect(response.status(), JSON.stringify(data)).toBe(400);
    expect(response.headers()['cache-control']).toBe('no-store');
    expect(await response.json()).toEqual({ error: 'invalid' });
  }
  const text = await request.post('/api/walking', { data: 'not json', headers: { 'content-type': 'text/plain' } });
  expect(text.status()).toBe(400);
  const elsewhere = await request.post('/api/walking', { data: { from: HERE, to: [HERE] }, headers: { 'sec-fetch-site': 'cross-site' } });
  expect(elsewhere.status()).toBe(403);
  expect(elsewhere.headers()['cache-control']).toBe('no-store');
  // The wake-up (GET): answered with nothing, as an answer of the moment that no cache keeps. No key is
  // needed for it, since it asks nobody.
  for (let time = 0; time < 2; time++) {
    const wake = await request.get('/api/walking');
    expect(wake.status()).toBe(204);
    expect(await wake.text()).toBe('');
    expect(wake.headers()['cache-control']).toBe('no-store');
  }
  // The position is never in an address: a wake-up with anything in its address is refused, as is one from another site.
  expect((await request.get(`/api/walking?lat=${HERE.lat}&lon=${HERE.lon}`)).status()).toBe(400);
  expect((await request.get('/api/walking?wake')).status()).toBe(400);
  expect((await request.get('/api/walking', { headers: { 'sec-fetch-site': 'cross-site' } })).status()).toBe(403);
  // And the route has no other way in.
  expect((await request.put('/api/walking', { data: { from: HERE, to: [HERE] } })).status()).toBe(405);
});

/**
 * The wake-up of the walking function (PLAN.md 7.1, step 4): sent when the app starts looking
 * for a position, with nothing in it. Answered by the default of fixtures.ts, which keeps
 * every one as it was sent.
 */
test('the walking function is woken when the position is asked for: one request with nothing in it, before there is a position', async ({ page, walkingWoken, walkingAsked }) => {
  await page.clock.install({ time: new Date((MONDAY_EVENING - 60) * 1000) });
  // The browser's question is never answered: the device gives no position at all.
  await fakeLocation(page, 'ignore');
  await fakeTiles(page, world(kamppi));
  await open(page, '/fi');
  await page.clock.pauseAt(new Date(MONDAY_EVENING * 1000));
  // The first window asks nothing.
  expect(walkingWoken).toHaveLength(0);

  await locateButton(page).click();
  await expect(page.getByRole('status')).toContainText('Haetaan sijaintiasi…');
  await expect.poll(() => walkingWoken.length).toBe(1);
  const [wake] = walkingWoken;
  const url = new URL(wake.url);
  expect(url.pathname).toBe(WAKE_REQUEST.path);
  expect(url.search).toBe('');
  expect(url.hash).toBe('');
  // No body, and no header that describes one.
  expect(wake.body).toBeNull();
  expect(Object.keys(wake.headers)).not.toContain('content-type');
  expect(carriesPosition([wake.url, JSON.stringify(wake.headers)].join('\n'), HERE)).toBe(false);
  // Nothing follows it while there is no position: no walking times are asked for, and it is not sent again.
  await page.clock.runFor(10_000);
  expect(walkingWoken).toHaveLength(1);
  expect(walkingAsked).toHaveLength(0);
});

test('a place search wakes the walking function too, and not twice within a minute', async ({ page, walkingWoken, walkingAsked }) => {
  await page.clock.install({ time: new Date((MONDAY_EVENING - 60) * 1000) });
  await fakeLocation(page, 'ignore');
  await fakeTiles(page, world(kamppi));
  await fakePlaces(page, { place: { lat: 60.1689, lon: 24.9325, label: 'Kamppi, Helsinki' } });
  await open(page, '/fi');
  await page.clock.pauseAt(new Date(MONDAY_EVENING * 1000));
  const searchFor = async (name: string) => {
    await page.getByRole('searchbox', { name: 'Paikka' }).fill(name);
    await page.getByRole('button', { name: 'Hae', exact: true }).click();
    await settle(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  };

  // Opening the search box asks nothing: the wake-up goes when a name is sent.
  await page.getByRole('button', { name: 'Hae paikan nimellä' }).click();
  await expect(page.getByRole('searchbox', { name: 'Paikka' })).toBeFocused();
  expect(walkingWoken).toHaveLength(0);
  await searchFor('Kamppi');
  expect(walkingWoken).toHaveLength(1);
  expect(new URL(walkingWoken[0].url).search).toBe('');
  expect(walkingWoken[0].body).toBeNull();
  expect(walkingAsked).toHaveLength(1);

  // Half a minute later, another search: a function that was just woken is awake. Walking times are asked for as ever.
  await page.clock.runFor(30_000);
  await page.getByRole('button', { name: /Hae toinen paikka/ }).first().click();
  await searchFor('Kamppi');
  expect(walkingWoken).toHaveLength(1);
  expect(walkingAsked).toHaveLength(2);

  // More than a minute after the wake-up, the next search sends one again.
  await page.clock.runFor(31_000);
  await page.getByRole('button', { name: /Hae toinen paikka/ }).first().click();
  await searchFor('Kamppi');
  expect(walkingWoken).toHaveLength(2);
  expect(walkingAsked).toHaveLength(3);
});
