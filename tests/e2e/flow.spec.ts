import { expect, test } from './fixtures';
import { HERE, fakeLocation, fakePlaces, fakeTiles, locateButton, open, searchingStatus } from './helpers';

/**
 * M1: every way from the first window to a position, and every way it can fail (PLAN.md 7.3).
 * The browser's geolocation is replaced by a script, so each case behaves the same in Chromium
 * and WebKit, and the place lookup is answered by the test. Nothing here reaches Nominatim.
 */

// These tests are about getting to a position. The tiles never answer here, so the view
// that follows stays as it is: what the tiles then say is tested in results.spec.ts.
test.beforeEach(async ({ page }) => {
  await fakeTiles(page, 'hold');
});

test.describe('location from the device', () => {
  test('allow: the button leads to the map view, and no request carries the position', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(`${request.url()} ${request.postData() ?? ''}`));
    await fakeLocation(page, 'allow');
    await open(page, '/fi');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Löydä lähin auki oleva apteekki');

    await locateButton(page).click();
    await expect(searchingStatus(page)).toBeVisible();
    const title = page.getByRole('heading', { level: 1, name: 'Apteekit lähelläsi' });
    await expect(title).toBeFocused();

    // Verifiable privacy starts here: the position stays on the device.
    await page.waitForLoadState('networkidle');
    const latitude = String(HERE.lat).slice(0, 6);
    const longitude = String(HERE.lon).slice(0, 6);
    expect(requests.filter((request) => request.includes(latitude) || request.includes(longitude))).toEqual([]);
    expect(requests.filter((request) => new URL(request.split(' ')[0]).hostname !== 'localhost')).toEqual([]);
  });

  test('permission already given: straight to the map view, without the button', async ({ page }) => {
    await fakeLocation(page, 'allow', 'granted');
    await open(page, '/fi');
    await expect(searchingStatus(page)).toBeVisible();
  });

  test('the real permission, granted in the browser, works too', async ({ browser, browserName }) => {
    test.skip(browserName !== 'chromium', 'Granting geolocation through the browser context is checked in Chromium.');
    const context = await browser.newContext({ permissions: ['geolocation'], geolocation: { latitude: HERE.lat, longitude: HERE.lon }, locale: 'fi-FI' });
    const page = await context.newPage();
    await fakeTiles(page, 'hold');
    await open(page, '/fi');
    await expect(searchingStatus(page)).toBeVisible();
    await context.close();
  });

  test('approximate position: says so and offers place search', async ({ page }) => {
    await fakeLocation(page, 'approximate');
    await open(page, '/fi');
    await locateButton(page).click();
    await expect(page.getByRole('heading', { name: 'Sijaintisi on likimääräinen' })).toBeVisible();
    await page.getByRole('button', { name: 'Hae paikan nimellä' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Hae paikan nimellä' })).toBeVisible();
  });

  test('deny: place search with what happened and how to allow it, focus on the note', async ({ page }) => {
    await fakeLocation(page, 'deny');
    await open(page, '/fi');
    await locateButton(page).click();
    const note = page.getByRole('heading', { name: 'Sijainti on estetty tältä sivulta' });
    await expect(note).toBeFocused();
    await expect(page.getByRole('searchbox', { name: 'Paikka' })).toBeVisible();
    const how = page.getByRole('button', { name: 'Näin sallit sijainnin' });
    await expect(how).toHaveAttribute('aria-expanded', 'false');
    await how.click();
    await expect(page.getByText('Lataa sivu sen jälkeen uudelleen.')).toBeVisible();
  });

  test('deny, in English', async ({ page }) => {
    await fakeLocation(page, 'deny');
    await open(page, '/en');
    await page.getByRole('button', { name: 'Show pharmacies near me' }).click();
    await expect(page.getByRole('heading', { name: 'Location access is off for this site' })).toBeFocused();
  });

  test('position unavailable: says so, with a retry', async ({ page }) => {
    await fakeLocation(page, 'unavailable');
    await open(page, '/fi');
    await locateButton(page).click();
    await expect(page.getByRole('heading', { name: 'Laitteesi ei löytänyt sijaintiasi' })).toBeFocused();
    await expect(page.getByRole('button', { name: 'Yritä uudelleen' })).toBeVisible();
  });

  test('timeout: says so, and the retry gets through', async ({ page }) => {
    await fakeLocation(page, 'timeout-then-allow');
    await open(page, '/fi');
    await locateButton(page).click();
    await expect(page.getByRole('heading', { name: 'Sijainnin haku kestää liian kauan' })).toBeFocused();
    await page.getByRole('button', { name: 'Yritä uudelleen' }).click();
    await expect(searchingStatus(page)).toBeVisible();
  });

  test('ignored prompt: after eight seconds it says it is waiting, and place search is one tap away', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-19T18:41:00Z') });
    await fakeLocation(page, 'ignore');
    await open(page, '/fi');
    // From here on the page's clock moves only when the test moves it. Left running, a slow
    // runner used up the eight seconds by itself and the first message was gone before we looked.
    await page.clock.pauseAt(new Date('2026-11-19T18:42:00Z'));
    await locateButton(page).click();
    await expect(page.getByRole('status')).toContainText('Haetaan sijaintiasi…');
    // The status line took the button's place, and the keyboard with it.
    await expect(page.getByRole('status')).toBeFocused();

    await page.clock.fastForward(7_900);
    await expect(page.getByRole('status')).toContainText('Haetaan sijaintiasi…');
    await page.clock.fastForward(200);
    await expect(page.getByRole('status')).toContainText('Odotetaan sijaintilupaa');
    await expect(page.getByRole('status')).toContainText('Salli sijainti selaimen kysymyksessä.');

    await page.getByRole('button', { name: 'Hae paikan nimellä' }).click();
    await expect(page.getByRole('searchbox', { name: 'Paikka' })).toBeFocused();
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(0);
  });

  test('no geolocation in the browser: opens straight to place search', async ({ page }) => {
    await fakeLocation(page, 'unsupported');
    await open(page, '/fi');
    await expect(page.getByRole('heading', { level: 1, name: 'Hae paikan nimellä' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tämä selain ei anna sijaintia tälle sivulle' })).toBeVisible();
    // Nowhere to go back to: the wordmark stands where the back arrow would be.
    await expect(page.getByRole('link', { name: 'Takaisin' })).toHaveCount(0);
  });
});

test.describe('location from a place name', () => {
  test('found: the map view names the place, and back steps through the views', async ({ page }) => {
    await fakeLocation(page, 'ignore');
    const asked = await fakePlaces(page, { place: { lat: 60.1689, lon: 24.9325, label: 'Kamppi, Helsinki' } });
    await open(page, '/fi');
    await page.getByRole('button', { name: 'Hae paikan nimellä' }).click();
    const field = page.getByRole('searchbox', { name: 'Paikka' });
    await expect(field).toBeFocused();
    await field.fill('Kamppi');
    await field.press('Enter');

    await expect(searchingStatus(page)).toBeVisible();
    await expect(page.locator('p:visible', { hasText: 'Kamppi, Helsinki' }).first()).toBeVisible();
    // The request carried the typed name and the language, nothing else.
    expect(asked).toEqual(['?q=Kamppi&lang=fi']);

    await page.goBack();
    await expect(page.getByRole('heading', { level: 1, name: 'Hae paikan nimellä' })).toBeVisible();
    await page.goBack();
    await expect(locateButton(page)).toBeVisible();
    await expect(page).toHaveURL(/\/fi$/);
  });

  test('the back arrow returns to the first window without loading the page again', async ({ page }) => {
    await fakeLocation(page, 'ignore');
    await open(page, '/fi');
    await page.evaluate(() => ((window as unknown as { kept: boolean }).kept = true));
    await page.getByRole('button', { name: 'Hae paikan nimellä' }).click();
    await page.getByRole('link', { name: 'Takaisin' }).click();
    await expect(locateButton(page)).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { kept?: boolean }).kept)).toBe(true);
  });

  test('not found: says which name, keeps it in the field, focus on the note', async ({ page }) => {
    await fakeLocation(page, 'ignore');
    await fakePlaces(page, { place: null });
    await open(page, '/fi');
    await page.getByRole('button', { name: 'Hae paikan nimellä' }).click();
    const field = page.getByRole('searchbox', { name: 'Paikka' });
    await field.fill('Kampi keskus');
    await page.getByRole('button', { name: 'Hae', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Paikkaa ”Kampi keskus” ei löytynyt' })).toBeFocused();
    await expect(field).toHaveValue('Kampi keskus');
  });

  test('the lookup fails: says so and stays on the search', async ({ page }) => {
    await fakeLocation(page, 'ignore');
    await fakePlaces(page, 503);
    await open(page, '/fi');
    await page.getByRole('button', { name: 'Hae paikan nimellä' }).click();
    await page.getByRole('searchbox', { name: 'Paikka' }).fill('Kamppi');
    await page.getByRole('button', { name: 'Hae', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Paikan haku ei onnistunut juuri nyt' })).toBeFocused();
  });

  test('after a denied prompt the search still gets the user to the map view', async ({ page }) => {
    await fakeLocation(page, 'deny');
    await fakePlaces(page, { place: { lat: 56.9496, lon: 24.1052, label: 'Rīga' } });
    await open(page, '/fi');
    await locateButton(page).click();
    await page.getByRole('searchbox', { name: 'Paikka' }).fill('Riika');
    await page.getByRole('button', { name: 'Hae', exact: true }).click();
    await expect(searchingStatus(page)).toBeVisible();
  });
});

test('our own geocode route refuses a name it should not pass on', async ({ request }) => {
  // Too short: answered by our server without calling Nominatim.
  const response = await request.get('/api/geocode?q=a&lang=fi');
  expect(response.status()).toBe(400);
  expect(response.headers()['cache-control']).toBe('no-store');
});
