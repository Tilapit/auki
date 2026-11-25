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

// Janne's iPhone, 25 Nov 2026: dark bands above and below the first window. The strips behind
// the status bar and behind Safari's own bar are Safari's to colour: from what lies fixed at
// that edge of the page when it is at least 6 px tall, otherwise from the body's background
// (measured in the iOS 27.2 Simulator; before iOS 26 the upper one came from theme-color).
// What a test can hold is that the page offers the scene's own two end colours there.
test.describe('on a phone the scene reaches the edges of the screen', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  const edges = (page: import('@playwright/test').Page) =>
    page.evaluate(() => {
      const colour = (value: string) => {
        const probe = document.createElement('span');
        probe.style.color = value;
        document.body.append(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        return resolved;
      };
      /** The fixed things that lie on an edge of the screen, tall enough for Safari to take their colour. */
      const fixedAt = (edge: 'top' | 'bottom') =>
        [...document.querySelectorAll<HTMLElement>('body *')]
          .filter((element) => {
            const style = getComputedStyle(element);
            const box = element.getBoundingClientRect();
            const onEdge = edge === 'top' ? box.top === 0 : Math.round(box.bottom) === window.innerHeight;
            return style.position === 'fixed' && style.display !== 'none' && onEdge && box.width === window.innerWidth && box.height >= 6 && box.height <= 12;
          })
          .map((element) => getComputedStyle(element).backgroundColor);
      const root = getComputedStyle(document.documentElement);
      return {
        top: fixedAt('top'),
        bottom: fixedAt('bottom'),
        body: getComputedStyle(document.body).backgroundColor,
        themes: [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')].map((meta) => colour(meta.content)),
        sky: colour(root.getPropertyValue('--sky-1')),
        street: colour(root.getPropertyValue('--navy')),
        sheet: colour(root.getPropertyValue('--sheet')),
        overscroll: root.overscrollBehaviorY,
      };
    });

  test('the first window: the sky’s upper colour at the top, the street’s at the bottom and behind the page', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-06-21T10:20:00Z') });
    await page.goto('/fi');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Löydä lähin auki oleva apteekki');
    const at = await edges(page);
    expect(at.top).toEqual([at.sky]);
    expect(at.bottom).toEqual([at.street]);
    expect(at.body).toBe(at.street);
    // By day the sky is not the street's colour: the two ends really are two colours.
    expect(at.sky).not.toBe(at.street);
    // Where the browser still goes by theme-color, it gets the sky's upper colour too, once the page runs.
    await expect.poll(async () => (await edges(page)).themes).toEqual([at.sky, at.sky]);
    // Above the sky there is no more sky: the page is not pulled past its ends.
    expect(at.overscroll).toBe('none');
  });

  test('a map view: the map’s ground at the top, the sheet’s colour behind the page, and theme-color as it was', async ({ page }) => {
    await page.goto('/fi/dev/states/helsinki-peek?theme=light');
    await expect(page.locator('[data-map="ready"]')).toBeVisible();
    const at = await edges(page);
    expect(at.top).toEqual([await page.locator('[data-map]').evaluate((element) => getComputedStyle(element).backgroundColor)]);
    expect(at.body).toBe(at.sheet);
    expect(at.overscroll).toBe('none');
  });
});
