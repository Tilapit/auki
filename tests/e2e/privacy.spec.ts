import { BRAND } from '@/lib/brand';
import { kamppi } from '@/lib/fixtures/tiles';
import { KEPT } from '@/lib/kept';
import { REQUESTS, addressOf, methodOf } from '@/lib/requests';
import { expect, test } from './fixtures';
import { start, world } from './helpers';

/**
 * "What the app sends" (PLAN.md 5 and 7.6): the page that lists every request, built from
 * lib/requests.ts. What it must show is read from that list here too, so a request that joins
 * the list is expected on the page from the same commit.
 */

test('lists every request of the list with its address, and marks the one that carries the position', async ({ page }) => {
  await page.goto('/fi/privacy');
  await expect(page.getByRole('heading', { level: 1, name: 'Mitä sovellus lähettää' })).toBeVisible();
  await expect(page.getByText('Sijaintisi lähtee laitteeltasi yhdessä pyynnössä')).toBeVisible();

  const rows = page.locator('[data-requests] > li');
  await expect(rows).toHaveCount(REQUESTS.length);
  await expect(rows.locator('code')).toHaveText(REQUESTS.map((request) => `${methodOf(request)} ${addressOf(request)}`));
  // Each answers the same three questions.
  for (const row of await rows.all()) await expect(row.getByRole('term')).toHaveText(['Milloin', 'Mitä siinä kulkee', 'Kuka sen saa']);

  // One request has the position, and the page says which.
  const withPosition = rows.filter({ hasText: 'Ainoa pyyntö, jossa sijaintisi on.' });
  await expect(withPosition).toHaveCount(1);
  await expect(withPosition.getByRole('heading', { level: 3 })).toHaveText('Kävelyajat ja reitti');
  await expect(withPosition.locator('code')).toHaveText('POST /api/walking');
  await expect(withPosition).toContainText('Palvelimemme ei tallenna sijaintia eikä kirjaa sitä lokiin.');

  // The one third party, by the host the list has.
  const map = rows.filter({ has: page.getByRole('heading', { level: 3, name: 'Karttapohja' }) });
  await expect(map).toContainText('Karttapohjan palvelin tiles.openfreemap.org.');
  await expect(map).toContainText('ainoa ulkopuolinen palvelu');

  // What the user opens, and what the device keeps, each key as the code writes it.
  await expect(page.locator('[data-opened] > li').getByRole('heading', { level: 3 })).toHaveText(['Reitti, puhelu ja muut sivustot', 'Lääkkeen saatavuushaku']);
  await expect(page.locator('[data-kept] > li code')).toHaveText(KEPT.map((kept) => kept.key));
  await expect(page.getByText('Evästeitä ei ole.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Takaisin apteekkihakuun' }).last()).toHaveAttribute('href', '/fi');
});

test("shows the policy's line as the browser was given it", async ({ page }) => {
  const response = await page.goto('/fi/privacy');
  const policy = response?.headers()['content-security-policy'] ?? '';
  const sent = policy.split('; ').find((line) => line.startsWith('connect-src ')) ?? '';
  // The dev server adds the sockets of its own reloading: no visitor's browser gets those.
  const forVisitors = sent.split(' ').filter((source) => source !== 'ws:' && source !== 'wss:').join(' ');
  expect(forVisitors).toBe("connect-src 'self' https://tiles.openfreemap.org");
  await expect(page.locator('[data-policy]')).toHaveText(forVisitors);
});

test('asks for nothing but its own files, and leaves nothing on the device', async ({ page, mapTiles, walkingAsked, reportAsked }) => {
  const asked: { method: string; url: URL }[] = [];
  page.on('request', (request) => asked.push({ method: request.method(), url: new URL(request.url()) }));
  await page.goto('/fi/privacy');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.waitForLoadState('networkidle');

  const { origin } = new URL(page.url());
  expect(asked.length).toBeGreaterThan(0);
  for (const { method, url } of asked) {
    expect(`${method} ${url.origin}`, url.href).toBe(`GET ${origin}`);
    expect(url.pathname, url.href).not.toMatch(/^\/(api|tiles)\//);
  }
  expect([mapTiles, walkingAsked, reportAsked]).toEqual([[], [], []]);
  expect(await page.evaluate(() => [{ ...localStorage }, { ...sessionStorage }, document.cookie])).toEqual([{}, {}, '']);
});

test('the same in English, with the way to the Finnish page', async ({ page }) => {
  await page.goto('/en/privacy');
  await expect(page).toHaveTitle(`${BRAND}: what the app sends`);
  await expect(page.getByRole('heading', { level: 1, name: 'What the app sends' })).toBeVisible();
  const rows = page.locator('[data-requests] > li');
  await expect(rows).toHaveCount(REQUESTS.length);
  await expect(rows.filter({ hasText: 'The only request that carries your location.' }).locator('code')).toHaveText('POST /api/walking');
  await expect(page.getByRole('link', { name: 'Suomeksi' })).toHaveAttribute('href', '/fi/privacy');
  await expect(page.getByRole('link', { name: 'Back to the pharmacy search' }).last()).toHaveAttribute('href', '/en');
});

test('the results footer leads to it, after the sentence about the position', async ({ page }) => {
  await start(page, world(kamppi));
  const link = page.getByRole('link', { name: 'Mitä sovellus lähettää' });
  await expect(link).toHaveAttribute('href', '/fi/privacy');
  await expect(page.locator('footer p', { has: link })).toHaveText('Etäisyydet ovat linnuntietä. Sijaintiasi ei tallenneta palvelimelle. Mitä sovellus lähettää');
  await link.click();
  await expect(page).toHaveURL(/\/fi\/privacy$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Mitä sovellus lähettää' })).toBeVisible();
});
