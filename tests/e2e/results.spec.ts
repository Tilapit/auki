import type { Page } from '@playwright/test';
import { ALWAYS, GENERATED, MONDAY_EVENING, farOpen, kamppi, kamppiClosed } from '@/lib/fixtures/tiles';
import { carriesPosition, isAllowedUrl, MAP_TILE_HOST, POSITION_REQUEST } from '@/lib/requests';
import { INDEX_PATH } from '@/lib/tiles';
import type { TilePharmacy } from '@/lib/tiles';
import { expect, test } from './fixtures';
import { HERE, fakeLocation, fakePlaces, fakeTiles, fakeWalking, hasWebGL, locateButton, open, settle, start, world } from './helpers';

/**
 * M3: what the tiles say about a position (PLAN.md 7.1, 7.3, 7.4, 7.7). The tiles are
 * answered by the test from fixture data, and the page's clock is the test's: Monday
 * 23 November 2026 at 20:41 in Helsinki unless a test says otherwise.
 */

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
  // runFor, not fastForward: every minute's tick fires on the way, as it does on a real clock.
  await page.clock.runFor(6 * 60_000); // 20:31
  await expect(card).toContainText('Sulkeutuu pian, klo 21');
  await page.clock.runFor(30 * 60_000); // 21:01: it has closed, and the next open one leads
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
  // Two of the six nearer ones have hours that can't be read: the card says so, it doesn't guess.
  await expect(card).toContainText('Lähempänä on 2 apteekkia, joiden aukioloaikoja ei tiedetä.');
  // It took the square to the north as well as our own.
  expect(new Set(asked).size).toBeGreaterThanOrEqual(3);
});

test('most nearby pharmacies without hours: the nearest leads with the call first, and nobody is sent past them', async ({ page }) => {
  // Hours coverage (provisional). Around Kamppi nothing has opening hours; the one pharmacy known to be open is 14 km away.
  const unlisted = kamppi.map((pharmacy): TilePharmacy => ({ ...pharmacy, hours: { kind: 'missing' } }));
  await start(page, world([...unlisted, farOpen]));
  // The heading counts nothing as open or closed.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lähimpien apteekkien aukioloaikoja ei tiedetä');
  await expect(page.getByRole('heading', { name: 'Lähin auki nyt' })).toHaveCount(0);
  const card = page.locator('section', { has: page.getByRole('heading', { name: 'Lähin apteekki', exact: true }) }).last();
  await expect(card.getByRole('heading', { level: 3 })).toHaveText('Kampin apteekki');
  await expect(card).toContainText('Aukioloaikoja ei ole merkitty');
  await expect(card).toContainText('Lähistöllä on 6 apteekkia, joiden aukioloaikoja ei tiedetä. Osa niistä voi olla auki. Soita ennen kuin lähdet.');
  // The call is the first action, the route the second. (The name above them is a button too: it opens the details.)
  const actions = card.locator('a[href^="tel:"], button:not(h3 button)');
  await expect(actions.first()).toHaveAttribute('href', 'tel:+35891234501');
  await expect(actions.first()).toHaveAccessibleName('Soita: Kampin apteekki');
  await expect(actions.nth(1)).toHaveAccessibleName('Reitti kävellen: Kampin apteekki');
  // The one known to be open is kept, as a line; and the card says how well the country's hours are covered.
  await expect(card).toContainText('Lähin, jonka tiedetään olevan auki Jumbon apteekki, 14,0 km, auki ympäri vuorokauden');
  await expect(card).toContainText('Suomi: aukioloajat on merkitty 79 %:lle apteekeista.');
  await expect(card.getByRole('link', { name: 'Tietoa aineistosta' })).toHaveAttribute('href', '/fi/data');
  // The others stay in the list in distance order; the two in the card are not repeated.
  await expect(rows(page)).toHaveText(['Yliopiston apteekki', 'Hietalahden apteekki', 'Apteekki Runeberginkatu 6', 'Töölön apteekki', 'Kruununhaan apteekki']);
  await card.getByRole('button', { name: /^Lähin, jonka tiedetään olevan auki Jumbon apteekki/ }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Jumbon apteekki' })).toBeVisible();
});

test('no pharmacy known to be open and most hours missing: says so, without claiming that all are closed', async ({ page }) => {
  const unlisted = kamppi.map((pharmacy): TilePharmacy => ({ ...pharmacy, phone: undefined, hours: { kind: 'missing' } }));
  await start(page, world(unlisted));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lähimpien apteekkien aukioloaikoja ei tiedetä');
  await expect(page.getByText('Lähistöllä ei ole yhtään apteekkia auki')).toHaveCount(0);
  const card = page.locator('section', { has: page.getByRole('heading', { name: 'Lähin apteekki', exact: true }) }).last();
  // Without a phone number the route leads, and the text says why.
  await expect(card).toContainText('Lähimmän puhelinnumeroa ei ole merkitty, joten sen aukiolo selviää vain paikan päällä.');
  await expect(card.locator('a[href^="tel:"]', { hasText: 'Soita' })).toHaveCount(0);
  await expect(card.getByRole('button', { name: 'Reitti kävellen: Kampin apteekki' })).toBeVisible();
  await expect(card.getByRole('link', { name: '112' })).toBeVisible();
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
  await expect(google).toHaveAttribute('target', '_blank');
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
 * but POST /api/walking, and the page talks to no host but ours and the map tile host. The
 * whole flow: locate, results with walking times, a pharmacy's details and its route line,
 * place search.
 */
test('privacy: the position is in the walking request and in no other, and no request leaves the allowed hosts', async ({ page, baseURL }) => {
  const seen: { method: string; url: string; text: string }[] = [];
  // On the context, so that what the map's worker asks for is seen too.
  page.context().on('request', (request) => {
    seen.push({ method: request.method(), url: request.url(), text: [request.url(), JSON.stringify(request.headers()), request.postData() ?? ''].join('\n') });
  });
  const walking = await fakeWalking(page);
  await start(page, world([...kamppi, farOpen]));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  // The map draws itself once the results are there. (A browser that can't draw it never asks its host for anything.)
  const draws = await hasWebGL(page);
  if (draws) {
    await expect(page.locator('[data-map]')).toHaveAttribute('data-basemap', 'live');
    await settle(page);
  }
  await page.getByRole('button', { name: 'Yliopiston apteekki', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  // Its route line is asked for, where there is a map to draw it on.
  await settle(page);
  if (draws) await expect(page.locator('[data-map]')).toHaveAttribute('data-route', 'n102');
  await page.keyboard.press('Escape');
  await fakePlaces(page, { place: { lat: 60.1689, lon: 24.9325, label: 'Kamppi, Helsinki' } });
  await page.getByRole('button', { name: /Hae toinen paikka/ }).first().click();
  await page.getByRole('searchbox', { name: 'Paikka' }).fill('Kamppi');
  await page.getByRole('button', { name: 'Hae', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');

  expect(seen.length).toBeGreaterThan(5);
  const origin = new URL(baseURL!).origin;
  const carriers: string[] = [];
  for (const request of seen) {
    expect(isAllowedUrl(request.url, origin), request.url).toBe(true);
    const mayCarryIt = request.method === POSITION_REQUEST.method && new URL(request.url).pathname === POSITION_REQUEST.path;
    if (!mayCarryIt) expect(carriesPosition(request.text, HERE), `${request.method} ${request.url}`).toBe(false);
    else if (carriesPosition(request.text, HERE)) carriers.push(request.text);
  }
  // The one request that does carry it was really made: for the walking times, and for the route
  // line. It has the position in its body, and neither in its address nor in a header.
  expect(carriers.length).toBe(draws ? 3 : 1);
  expect(walking.filter((request) => !request.route)).toHaveLength(2);
  for (const text of carriers) {
    const [url, headers, body] = text.split('\n');
    expect(new URL(url).search).toBe('');
    expect(carriesPosition(url + headers, HERE)).toBe(false);
    expect(carriesPosition(body, HERE)).toBe(true);
  }
  // The tile requests name squares, and nothing but squares.
  const tiles = seen.filter((request) => new URL(request.url).origin === origin && new URL(request.url).pathname.startsWith('/tiles/'));
  expect(tiles.length).toBeGreaterThanOrEqual(2);
  for (const request of tiles) expect(new URL(request.url).pathname).toMatch(/^\/tiles\/v1\/(index|10\/\d+\/\d+)\.json$/);
  // The map tile host is the one third party, and it is asked for map squares and nothing else.
  if (draws) expect(seen.filter((request) => new URL(request.url).origin === MAP_TILE_HOST).length).toBeGreaterThan(0);
  const thirdParties = new Set(seen.map((request) => new URL(request.url).origin).filter((other) => other !== origin));
  expect([...thirdParties].every((other) => other === MAP_TILE_HOST)).toBe(true);
  for (const request of seen.filter((request) => new URL(request.url).origin === MAP_TILE_HOST)) {
    expect(new URL(request.url).pathname).toMatch(/^\/planet(\/|$)/);
    expect(new URL(request.url).search).toBe('');
  }
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
  // Each country's last successful fetch, with its time, on the device's clock.
  await expect(finland).toContainText('23.11. klo 3.17');
  // When the last run was, and which countries it could not refresh.
  await expect(page.getByText('Viimeisin haku: 23.11. klo 3.33')).toBeVisible();
  await expect(page.getByText('Ei päivittynyt viimeisimmässä haussa: Latvia.')).toBeVisible();
  const latvia = page.getByRole('row', { name: /Latvia/ });
  await expect(latvia).toContainText('21.11. klo 3.25');
  await expect(latvia).toContainText('aiempi haku');
  await expect(page.getByRole('row', { name: /Kreikka/ })).toContainText('7,3 %');
  await expect(page.getByText('Missä osuus on pieni, useimmat apteekit näkyvät tuloksissa merkinnällä')).toBeVisible();
  await expect(page.getByRole('row')).toHaveCount(23);
  await expect(page.getByRole('link', { name: 'Takaisin apteekkihakuun' }).last()).toHaveAttribute('href', '/fi');
});

test('the data table fits the page on a phone and on a desktop, in both languages', async ({ page }, testInfo) => {
  // The browsers of CI have no Finnish hyphenation dictionary: the table may not count on one to fit.
  await fakeTiles(page, world(kamppi));
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    for (const locale of ['fi', 'en']) {
      await page.goto(`/${locale}/data`);
      const table = page.getByRole('table');
      await expect(table.getByRole('row')).toHaveCount(23);
      const { needed, room } = await table.evaluate((element) => {
        const box = element.parentElement as HTMLElement;
        const room = box.clientWidth;
        // The narrowest the table can be: every heading broken where it may break, no number broken.
        (element as HTMLElement).style.width = '1px';
        const needed = (element as HTMLElement).offsetWidth;
        (element as HTMLElement).style.width = '';
        return { needed, room };
      });
      testInfo.annotations.push({ type: 'data table', description: `${locale} at ${viewport.width} px: needs ${needed} px, has ${room} px` });
      expect(needed, `${locale} at ${viewport.width} px`).toBeLessThanOrEqual(room);
      // And the time of the last fetch is on screen once at either size: under the name, or in its own column.
      // Latvia's, because no other country shares its minute.
      await expect(page.locator('time', { hasText: locale === 'fi' ? '21.11. klo 3.25' : '21 Nov, 03:25' }).locator('visible=true')).toHaveCount(1);
    }
  }
});

test('the data page says so when the numbers do not load', async ({ page }) => {
  await fakeTiles(page, 503);
  await page.goto('/en/data');
  await expect(page.getByText("Couldn't load the numbers right now.")).toBeVisible();
});


test('offline: says so, and searches again by itself when the connection returns', async ({ page }) => {
  // The connection drops after the page has loaded: the tiles fail, and the browser says it is offline.
  let offline = true;
  await page.addInitScript(() => {
    const state = window as unknown as { offline: boolean };
    state.offline = true;
    Object.defineProperty(Navigator.prototype, 'onLine', { get: () => !state.offline, configurable: true });
  });
  await fakeLocation(page, 'allow');
  const files = world(kamppi);
  await page.route('**/tiles/v1/**', async (route) => {
    const { pathname } = new URL(route.request().url());
    if (offline) await route.abort('internetdisconnected');
    else if (pathname in files) await route.fulfill({ json: files[pathname] });
    else await route.fulfill({ status: 404, body: '' });
  });
  await open(page, '/fi');
  await locateButton(page).click();
  await expect(page.getByRole('heading', { name: 'Ei verkkoyhteyttä' })).toBeVisible();

  offline = false;
  await page.evaluate(() => {
    (window as unknown as { offline: boolean }).offline = false;
    window.dispatchEvent(new Event('online'));
  });
  await expect(page.getByRole('heading', { name: 'Ei verkkoyhteyttä' })).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/auki|Apteekit lähelläsi/);
});
