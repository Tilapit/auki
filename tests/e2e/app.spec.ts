import { expect, test } from './fixtures';

/**
 * Behaviour that isn't a screenshot or a flow: language routing, the sky picked before first
 * paint, the device theme, and that opening the pages talks to no one but our own origin.
 * Time is always set with page.clock; no test reads the real clock.
 */

test('"/" redirects by Accept-Language', async ({ request }) => {
  const fi = await request.get('/', { headers: { 'accept-language': 'fi-FI,fi;q=0.9,en;q=0.8' }, maxRedirects: 0 });
  expect(fi.status()).toBe(307);
  expect(fi.headers().location).toMatch(/\/fi$/);
  const de = await request.get('/', { headers: { 'accept-language': 'de-DE,de;q=0.9' }, maxRedirects: 0 });
  expect(de.headers().location).toMatch(/\/en$/);
  expect((await request.get('/sv')).status()).toBe(404);
});

test('first visit has one h1, the two actions and the footer line, in both languages', async ({ page }) => {
  await page.goto('/fi');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fi');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Löydä lähin auki oleva apteekki');
  await expect(page.getByRole('button', { name: 'Näytä apteekit lähelläni' })).toBeVisible();
  await expect(page.getByRole('contentinfo')).toContainText('Ei Treat Healthin palvelu.');
  await page.getByRole('link', { name: 'In English' }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find the nearest open pharmacy');
  await expect(page.getByRole('contentinfo')).toContainText('Not affiliated with Treat Health.');
});

for (const [name, time, top] of [
  ['night on a November evening', '2026-11-19T18:41:00Z', '#040b1c'],
  ['day at midsummer noon', '2026-06-21T10:20:00Z', '#1b4f9e'],
] as const) {
  test(`the sky is picked before first paint: ${name}`, async ({ page }) => {
    await page.clock.install({ time: new Date(time) });
    // Stop before hydration, so only the inline script in <head> can have set the sky.
    await page.route('**/_next/static/**/*.js', (route) => route.abort());
    await page.goto('/fi', { waitUntil: 'commit' });
    await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--sky-1'))).toBe(top);
  });
}

test('results follow the device theme when nothing overrides it', async ({ browser }) => {
  for (const [scheme, paper] of [
    ['light', 'rgb(244, 248, 252)'],
    ['dark', 'rgb(7, 20, 39)'],
  ] as const) {
    const context = await browser.newContext({ colorScheme: scheme, viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto('/fi/dev/states/helsinki');
    await expect(page.locator('body')).toHaveCSS('background-color', paper);
    await context.close();
  }
});

test('opening the pages calls nothing outside our own origin', async ({ page }) => {
  const outside: string[] = [];
  page.on('request', (request) => {
    const { hostname } = new URL(request.url());
    if (hostname !== 'localhost') outside.push(request.url());
  });
  for (const path of ['/fi', '/fi/dev/states/helsinki', '/fi/dev/states/riga', '/fi/dev/states/place-search']) {
    await page.goto(path, { waitUntil: 'networkidle' });
  }
  expect(outside).toEqual([]);
});
