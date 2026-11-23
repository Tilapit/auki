import { expect, test, type Page } from '@playwright/test';
import { ALWAYS, GENERATED, KAMPPI, MONDAY_EVENING, farOpen, indexOf, kamppi, kamppiClosed } from '@/lib/fixtures/tiles';
import { carriesPosition, isAllowedUrl, POSITION_REQUEST } from '@/lib/requests';
import { INDEX_PATH, encodeTile, tileKey, tileOf, tilePath } from '@/lib/tiles';
import type { TilePharmacy } from '@/lib/tiles';
import { HERE, fakeLocation, fakePlaces, fakeTiles, locateButton, open } from './helpers';

/**
 * M3: what the tiles say about a position (PLAN.md 7.1, 7.3, 7.4, 7.7). The tiles are
 * answered by the test from fixture data, and the page's clock is the test's: Monday
 * 23 November 2026 at 20:41 in Helsinki unless a test says otherwise.
 */

/** The files of a small world: an index, and one tile per square that has pharmacies. */
function world(pharmacies: TilePharmacy[], outside = false): Record<string, unknown> {
  const squares = new Map<string, TilePharmacy[]>();
  for (const pharmacy of pharmacies) {
    const key = tileKey(tileOf(pharmacy));
    squares.set(key, [...(squares.get(key) ?? []), pharmacy]);
  }
  const tiles = [...squares].map(([key, list]) => {
    const [x, y] = key.split('/').map(Number);
    return { x, y, pharmacies: list };
  });
  return {
    [INDEX_PATH]: indexOf(tiles, outside ? [tileOf(KAMPPI)] : []),
    ...Object.fromEntries(tiles.map((tile) => [tilePath(tile.x, tile.y), encodeTile(tile)])),
  };
}

async function start(page: Page, files: Record<string, unknown> | number, now = MONDAY_EVENING) {
  await page.clock.install({ time: new Date((now - 60) * 1000) });
  await fakeLocation(page, 'allow');
  const asked = await fakeTiles(page, files);
  await open(page, '/fi');
  // From here on the page's clock moves only when the test moves it.
  await page.clock.pauseAt(new Date(now * 1000));
  await locateButton(page).click();
  await settle(page);
  return asked;
}

/**
 * The map views arrive as a chunk of their own, and React holds a view that was waiting
 * for one back for a moment, on a timer. With the clock paused that moment has to be given.
 */
async function settle(page: Page) {
  await page.clock.fastForward(1000);
}

const rows = (page: Page) => page.locator('ol > li h3');

test('real pharmacies from the tiles, nearest first, each with its status', async ({ page }) => {
  await start(page, world(kamppi));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  // The nearest open one leads: it closes at 21, so at 20:41 it closes soon.
  const card = page.locator('section', { has: page.getByRole('heading', { name: 'Lähin auki nyt' }) }).last();
  await expect(card.getByRole('heading', { level: 3 })).toHaveText('Kampin apteekki');
  await expect(card).toContainText('Sulkeutuu pian, klo 21');
  await expect(card).toContainText('linnuntietä');
  // The others in distance order, whatever their status.
  await expect(rows(page)).toHaveText(['Yliopiston apteekki', 'Hietalahden apteekki', 'Apteekki Runeberginkatu 6', 'Töölön apteekki', 'Kruununhaan apteekki']);
  const list = page.locator('ol').first();
  await expect(list).toContainText('Auki klo 24 asti');
  await expect(list).toContainText('Kiinni, avautuu huomenna klo 9');
  await expect(list).toContainText('Aukioloaikoja ei ole merkitty');
  await expect(list).toContainText('Aukioloajat epäselvät: ”soita ensin”');
  // The footer says when the data was fetched, and leads to the data page.
  await expect(page.getByText('Tiedot: OpenStreetMap, haettu 23.11.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tietoa aineistosta' })).toHaveAttribute('href', '/fi/data');
});

test('the status keeps time: it changes when the minute does, without a request', async ({ page }) => {
  const asked = await start(page, world(kamppi), MONDAY_EVENING - 16 * 60); // 20:25
  const card = page.locator('section', { has: page.getByRole('heading', { name: 'Lähin auki nyt' }) }).last();
  await expect(card).toContainText('Auki klo 21 asti');
  const before = asked.length;
  await page.clock.fastForward(6 * 60_000); // 20:31
  await expect(card).toContainText('Sulkeutuu pian, klo 21');
  await page.clock.fastForward(30 * 60_000); // 21:01: it has closed, and the next open one leads
  await expect(card.getByRole('heading', { level: 3 })).toHaveText('Yliopiston apteekki');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Yksi apteekki auki juuri nyt');
  expect(asked.length).toBe(before);
});

test('with the clock eight days ahead nothing reads open', async ({ page }) => {
  await start(page, world([...kamppi, { ...kamppi[0], id: 'n199', name: 'Yöapteekki', hours: ALWAYS }]), GENERATED + 8 * 86400);
  await expect(page.getByRole('heading', { name: 'Aukiolotiedot ovat vanhentuneet' })).toBeVisible();
  await expect(page.getByText('Tiedot haettiin 23.11. eikä niistä voi enää päätellä')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Apteekit lähelläsi');
  await expect(rows(page)).toHaveCount(7);
  await expect(page.getByText('Aukioloajat voivat olla vanhentuneet')).toHaveCount(7);
  await expect(page.locator('p', { hasText: /^(Auki klo|Auki ympäri|Sulkeutuu pian)/ })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Lähin auki nyt' })).toHaveCount(0);
});

test('nothing nearby open: a farther open pharmacy leads, with the one that opens first below it', async ({ page }) => {
  const asked = await start(page, world([...kamppiClosed, farOpen]));
  const card = page.locator('section', { has: page.getByRole('heading', { name: 'Lähin auki nyt' }) }).last();
  await expect(card.getByRole('heading', { level: 3 }).first()).toHaveText('Jumbon apteekki');
  await expect(card).toContainText('Auki ympäri vuorokauden');
  await expect(card).toContainText('Vantaa');
  await expect(card).toContainText('Avautuu ensimmäisenä');
  // It took the square to the north as well as our own.
  expect(new Set(asked).size).toBeGreaterThanOrEqual(3);
});

test('no pharmacy within 50 km: says so, and a place search from there works', async ({ page }) => {
  await start(page, world([]));
  await expect(page.getByRole('heading', { name: 'OpenStreetMapissa ei ole apteekkeja 50 kilometrin säteellä' })).toBeVisible();
  const places = await fakePlaces(page, { place: { lat: 60.1689, lon: 24.9325, label: 'Kamppi, Helsinki' } });
  await page.getByRole('searchbox', { name: 'Paikka' }).fill('Kamppi');
  await page.getByRole('button', { name: 'Hae', exact: true }).click();
  await expect.poll(() => places.length).toBe(1);
  // The same answer for the place that was searched: still none within 50 km.
  await expect(page.getByRole('heading', { name: 'OpenStreetMapissa ei ole apteekkeja 50 kilometrin säteellä' })).toBeVisible();
});

test('outside the covered countries: says so, and hands off to a map app without a position', async ({ page }) => {
  const asked = await start(page, world(kamppi, true));
  await expect(page.getByRole('heading', { name: /ei vielä kata tätä maata/ })).toBeVisible();
  await expect(page.getByText(/Mukana ovat .*Suomi.* ja /)).toBeVisible();
  const google = page.getByRole('link', { name: 'Google Mapsista' });
  await expect(google).toHaveAttribute('href', 'https://www.google.com/maps/search/?api=1&query=apteekki');
  await expect(page.getByRole('link', { name: '112' })).toBeVisible();
  // The index was enough to know: no tile was asked for.
  expect(asked).toEqual([INDEX_PATH]);
});

test('tiles that fail: says so, and a retry gets through', async ({ page }) => {
  let healthy = false;
  const files = world(kamppi);
  await page.clock.install({ time: new Date((MONDAY_EVENING - 60) * 1000) });
  await fakeLocation(page, 'allow');
  await page.route('**/tiles/v1/**', async (route) => {
    const { pathname } = new URL(route.request().url());
    if (healthy && pathname in files) await route.fulfill({ json: files[pathname] });
    else await route.fulfill({ status: 503, body: '' });
  });
  await open(page, '/fi');
  await page.clock.pauseAt(new Date(MONDAY_EVENING * 1000));
  await locateButton(page).click();
  await settle(page);
  await expect(page.getByRole('heading', { name: 'Apteekkien haku ei onnistunut juuri nyt' })).toBeVisible();
  healthy = true;
  await page.getByRole('button', { name: 'Yritä uudelleen' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
});

test('the place name leads to another place', async ({ page }) => {
  await start(page, world(kamppi));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  await page.getByRole('button', { name: /Hae toinen paikka/ }).first().click();
  await expect(page.getByRole('searchbox', { name: 'Paikka' })).toBeFocused();
  // Back returns to the results' place in the history: the first window is one more step back.
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Löydä lähin auki oleva apteekki' })).toBeVisible();
});

/**
 * The privacy claim of PLAN.md 7.6, checked: the position leaves the device in no request
 * but POST /api/walking (which arrives in M5), and the page talks to no host but ours and
 * the map tile host. The whole flow: locate, results, a pharmacy's details, place search.
 */
test('privacy: no request carries the position, and none leaves the allowed hosts', async ({ page, baseURL }) => {
  const seen: { method: string; url: string; text: string }[] = [];
  page.on('request', (request) => {
    seen.push({ method: request.method(), url: request.url(), text: [request.url(), JSON.stringify(request.headers()), request.postData() ?? ''].join('\n') });
  });
  await start(page, world([...kamppi, farOpen]));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  await page.getByRole('button', { name: 'Yliopiston apteekki', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await fakePlaces(page, { place: { lat: 60.1689, lon: 24.9325, label: 'Kamppi, Helsinki' } });
  await page.getByRole('button', { name: /Hae toinen paikka/ }).first().click();
  await page.getByRole('searchbox', { name: 'Paikka' }).fill('Kamppi');
  await page.getByRole('button', { name: 'Hae', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');

  expect(seen.length).toBeGreaterThan(5);
  const origin = new URL(baseURL!).origin;
  for (const request of seen) {
    expect(isAllowedUrl(request.url, origin), request.url).toBe(true);
    const mayCarryIt = request.method === POSITION_REQUEST.method && new URL(request.url).pathname === POSITION_REQUEST.path;
    if (!mayCarryIt) expect(carriesPosition(request.text, HERE), `${request.method} ${request.url}`).toBe(false);
  }
  // The tile requests name squares, and nothing but squares.
  const tiles = seen.filter((request) => new URL(request.url).pathname.startsWith('/tiles/'));
  expect(tiles.length).toBeGreaterThanOrEqual(2);
  for (const request of tiles) expect(new URL(request.url).pathname).toMatch(/^\/tiles\/v1\/(index|10\/\d+\/\d+)\.json$/);
});

test('the security headers are on every page', async ({ request }) => {
  const response = await request.get('/fi');
  const policy = response.headers()['content-security-policy'];
  expect(policy).toContain("default-src 'self'");
  expect(policy).toContain("connect-src 'self' https://tiles.openfreemap.org");
  expect(response.headers()['referrer-policy']).toBe('no-referrer');
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  expect(response.headers()['permissions-policy']).toContain('geolocation=(self)');
});

test('the data page shows the numbers of the last run', async ({ page }) => {
  await fakeTiles(page, world(kamppi));
  await page.goto('/fi/data');
  await expect(page.getByRole('heading', { level: 1, name: 'Mistä apteekkitiedot tulevat' })).toBeVisible();
  const finland = page.getByRole('row', { name: /Suomi/ });
  await expect(finland).toContainText('787');
  await expect(finland).toContainText('79,3 %');
  await expect(finland).toContainText('100,0 %');
  await expect(finland).toContainText('23.11.');
  await expect(page.getByRole('row', { name: /Latvia/ })).toContainText('aiempi haku');
  await expect(page.getByRole('row')).toHaveCount(23);
  await expect(page.getByRole('link', { name: 'Takaisin apteekkihakuun' }).last()).toHaveAttribute('href', '/fi');
});

test('the data page says so when the numbers do not load', async ({ page }) => {
  await fakeTiles(page, 503);
  await page.goto('/en/data');
  await expect(page.getByText("Couldn't load the numbers right now.")).toBeVisible();
});

