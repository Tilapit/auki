import type { Page } from '@playwright/test';
import { dutyFor } from '@/data/countries/duty';
import { kamppiClosed } from '@/lib/fixtures/tiles';
import { carriesPosition, isAllowedUrl } from '@/lib/requests';
import { expect, test } from './fixtures';
import { HERE, start, world } from './helpers';

/**
 * The duty pharmacy (PLAN.md section 5). Where pharmacies take turns out of hours, the
 * country's own lookup leads the card when nothing nearby is open, and is one row under our
 * answer otherwise. Where the same pharmacies have long hours, nothing of it is shown.
 *
 * The lookup is a link the user opens and nothing else: no test reaches it, and the page
 * asks it for nothing.
 */

const germany = dutyFor('DE')!;
const LOOKUP = germany.lookup!.url.fi;

const lead = (page: Page) => page.locator('[data-duty="lead"]');
/** The headings of the card the lookup leads, in the order they are read. */
const headings = (page: Page) => page.locator('section:has(> [data-duty="lead"]) h2').allInnerTexts();

/** Around Kamppi with everything closed by six, as if the same doors stood in Germany. */
const inGermany = kamppiClosed.map((pharmacy) => ({ ...pharmacy, country: 'DE' }));

test('nothing open nearby in Germany: the duty lookup leads the card, and the page asks it for nothing', async ({ page, context, baseURL }) => {
  const seen: string[] = [];
  context.on('request', (request) => seen.push(request.url()));
  await start(page, world(inGermany));

  // The lookup arrives in a file of its own, after the results.
  await expect(lead(page)).toBeVisible();
  await expect(lead(page).getByRole('heading', { name: 'Päivystävä apteekki' })).toBeVisible();
  await expect(lead(page)).toContainText('Saksa: apteekit päivystävät vuorotellen, kun muut ovat kiinni. Vuoro ei näy näissä aukioloajoissa.');

  // Before the first one to open, in the same card.
  const order = await headings(page);
  expect(order.indexOf('Päivystävä apteekki')).toBeGreaterThanOrEqual(0);
  expect(order.indexOf('Päivystävä apteekki')).toBeLessThan(order.indexOf('Avautuu ensimmäisenä'));

  // The heading says no more than the hours do: the one on duty may be among the closed doors.
  await expect(page.getByText('Lähistön apteekit ovat kiinni, päivystävä voi olla auki').first()).toBeVisible();
  await expect(page.getByText('Lähistöllä ei ole yhtään apteekkia auki')).toHaveCount(0);

  // The link is the official page as it stands: nothing of the user rides in it, and the new tab learns nothing of ours.
  const link = lead(page).getByRole('link', { name: `Hae päivystävä apteekki ${germany.lookup!.site} (avautuu uuteen välilehteen)` });
  await expect(link).toHaveAttribute('href', LOOKUP);
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  expect(carriesPosition(LOOKUP, HERE)).toBe(false);
  expect(new URL(LOOKUP).search).toBe('');

  // The number, as the official page prints it.
  await expect(lead(page).getByRole('link', { name: `Soita ${germany.phone!.shown}` })).toHaveAttribute('href', `tel:${germany.phone!.tel}`);
  // Who says so, and when it was read.
  await expect(lead(page)).toContainText('luettu 28.11.2026');

  // 112 stays where it was.
  await expect(page.getByRole('link', { name: '112' }).first()).toBeVisible();

  // Nothing was asked of the lookup, or of anyone the app doesn't name.
  for (const url of seen) expect(isAllowedUrl(url, baseURL!), url).toBe(true);
  expect(seen.filter((url) => url.includes(germany.lookup!.site))).toEqual([]);
});

test('nothing open nearby in Finland: no duty lookup, and the heading is as it was', async ({ page }) => {
  await start(page, world(kamppiClosed));
  await expect(page.getByRole('heading', { name: 'Avautuu ensimmäisenä' }).first()).toBeVisible();
  await expect(page.getByText('Lähistöllä ei ole yhtään apteekkia auki').first()).toBeVisible();
  await expect(page.locator('[data-duty]')).toHaveCount(0);
  await expect(page.getByText('Päivystävä apteekki')).toHaveCount(0);
});

test('a farther open pharmacy is found: the lookup still leads, and our answer follows', async ({ page }) => {
  await page.goto('/fi/dev/states/duty-proposed');
  await expect(lead(page)).toBeVisible();
  const order = await headings(page);
  expect(order.indexOf('Päivystävä apteekki')).toBeLessThan(order.indexOf('Lähin auki nyt'));
  expect(order.indexOf('Lähin auki nyt')).toBeLessThan(order.indexOf('Avautuu ensimmäisenä'));
  // One is known to be open, so the heading counts it.
  await expect(page.getByText('Yksi apteekki auki tähän aikaan yöstä').first()).toBeVisible();
});

test('one open past closed ones: our answer stays first, and the lookup is one row under it', async ({ page }) => {
  await page.goto('/fi/dev/states/duty-row');
  const card = page.locator('section', { has: page.getByRole('heading', { name: 'Lähin auki nyt' }) }).last();
  await expect(card).toBeVisible();
  await expect(lead(page)).toHaveCount(0);
  const row = card.locator('[data-duty="lookup"]');
  await expect(row).toHaveCount(1);
  await expect(row.getByRole('link', { name: `Hae päivystävä apteekki ${germany.lookup!.site}: apteekit päivystävät vuorotellen (avautuu uuteen välilehteen)` })).toHaveAttribute('href', LOOKUP);
  // One row, not two: the number is in the lead only.
  await expect(card.locator('[data-duty="phone"]')).toHaveCount(0);
});

test('the same night without the lookup, and the views of countries where duty does not rotate, show nothing of it', async ({ page }) => {
  for (const view of ['duty-current', 'tiles-far', 'helsinki', 'riga', 'nothing-open', 'far-open']) {
    await page.goto(`/fi/dev/states/${view}`);
    await expect(page.locator('h1').first(), view).toBeVisible();
    await expect(page.locator('[data-duty]'), view).toHaveCount(0);
  }
});

test.describe('on the phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the sheet starts at the card when the lookup leads', async ({ page }) => {
    await page.goto('/fi/dev/states/duty-half');
    await expect(page.locator('[data-sheet]').first()).toHaveAttribute('data-sheet', 'half');
    await expect(lead(page)).toBeInViewport();
    await expect(lead(page).getByRole('link', { name: /^Hae päivystävä apteekki/ })).toBeInViewport();
    // The bar counts the one that is known to be open.
    await page.goto('/fi/dev/states/duty-nothing-open-half');
    await expect(page.locator('[data-sheet]').first()).toHaveAttribute('data-sheet', 'half');
    await expect(page.getByText('Päivystävä voi olla auki', { exact: true }).first()).toBeVisible();
  });

  test('in the live app too: the results of a German night open at the card, with the lookup in view', async ({ page }) => {
    await start(page, world(inGermany));
    await expect(page.locator('[data-sheet]').first()).toHaveAttribute('data-sheet', 'half');
    await expect(lead(page)).toBeInViewport();
  });
});
