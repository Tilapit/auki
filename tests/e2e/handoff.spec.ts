import type { Page, Request } from '@playwright/test';
import { kamppi, MONDAY_EVENING } from '@/lib/fixtures/tiles';
import type { TilePharmacy } from '@/lib/tiles';
import { expect, test } from './fixtures';
import { fakeLocation, fakePlaces, fakeTiles, locateButton, open, searchingStatus, settle, world } from './helpers';

/**
 * The hand-off link (PLAN.md 7.8): another app opens this one with the prescription's format
 * and the country it believes the user is in, in the address's fragment:
 *
 *   /fi#country=LV&rx=p
 *
 * What is checked: the link presets the banner and the counter card; a place search takes the
 * answer in the link's country; and nothing of the fragment is in any request or kept in any
 * storage. The pharmacies are the Kamppi fixture's, said to stand in another country, as in
 * abroad.spec.ts. Monday 23 November 2026 at 20:41 in Helsinki.
 */

const inCountry = (country: string) => world(kamppi.map((pharmacy): TilePharmacy => ({ ...pharmacy, country })));
const banner = (page: Page) => page.locator('section', { has: page.getByRole('heading', { name: 'Resepti kotimaasta?' }) }).last();
const cardButton = (page: Page) => page.getByRole('button', { name: /^Näytä apteekissa Apteekkikortti / }).first();
const counter = (page: Page) => page.getByRole('dialog', { name: 'Näytä tämä apteekissa' });
const formats = (page: Page) => counter(page).getByRole('group', { name: 'Reseptin muoto' }).getByRole('button');

/** The helper's start, from the address another app would open. */
async function startAt(page: Page, path: string, files: Record<string, unknown>) {
  await page.clock.install({ time: new Date((MONDAY_EVENING - 60) * 1000) });
  await fakeLocation(page, 'allow');
  await fakeTiles(page, files);
  await open(page, path);
  await page.clock.pauseAt(new Date(MONDAY_EVENING * 1000));
  await locateButton(page).click();
  await settle(page);
}

/** Everything a request says to whoever receives it: its address, its headers, its body. */
const said = (request: Request): string => `${request.url()}\n${JSON.stringify(request.headers())}\n${request.postData() ?? ''}`;

test('the link presets the card: with rx=p the paper answer leads, the counter card opens on paper, and nothing of the link leaves the device', async ({ page }) => {
  const requests: Request[] = [];
  page.on('request', (request) => requests.push(request));
  await startAt(page, '/fi#country=LV&rx=p', inCountry('LV'));

  // Both answers are there, the link's format first.
  await expect(banner(page).locator('dt')).toHaveText(['Paperinen resepti', 'Sähköinen resepti']);
  await expect(banner(page)).toContainText('Suomessa kirjoitettu paperinen resepti kelpaa Latviassa, kun siinä on vaaditut tiedot.');
  await expect(banner(page)).toContainText('Suomessa kirjoitettu sähköinen resepti käy Latviassa.');

  await cardButton(page).click();
  await expect(formats(page)).toHaveText(['E-resepti', 'Paperiresepti']);
  await expect(formats(page).nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(counter(page).locator('[lang="lv"]').first()).toContainText('Šī ir oriģināla recepte');

  // What the user presses holds over what the link said, also when the card is opened again.
  await formats(page).first().click();
  await page.keyboard.press('Escape');
  await expect(counter(page)).toBeHidden();
  await cardButton(page).click();
  await expect(formats(page).first()).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');

  // The fragment stays where it was: in the address, for a tab that is loaded again.
  expect(new URL(page.url()).hash).toBe('#country=LV&rx=p');
  // No request has it: not in an address, not in a header, not in a body. A browser sends a
  // fragment nowhere, and nothing of ours copies it into a request.
  expect(requests.length).toBeGreaterThan(3);
  for (const request of requests) {
    const text = said(request);
    expect(text, request.url()).not.toMatch(/[#?&"]rx["=]|rx%3D/i);
    expect(text, request.url()).not.toMatch(/country[=":%]/i);
    expect(new URL(request.url()).hash, request.url()).toBe('');
  }
  // And the device keeps it nowhere but in that address.
  const kept = await page.evaluate(() => JSON.stringify([{ ...localStorage }, { ...sessionStorage }, document.cookie]));
  expect(kept).not.toMatch(/rx|country=|"LV"/);
});

test('with rx=e the card is as without a link, and a new link in the same tab is read without loading anything', async ({ page }) => {
  await startAt(page, '/fi#rx=e', inCountry('LV'));
  await expect(banner(page).locator('dt')).toHaveText(['Sähköinen resepti', 'Paperinen resepti']);
  await cardButton(page).click();
  await expect(formats(page).first()).toHaveAttribute('aria-pressed', 'true');
  await expect(counter(page).locator('[lang="lv"]').first()).toContainText('e-recepte');
  await page.keyboard.press('Escape');

  // Another app opens a new link in the tab that is already here: only the fragment changes.
  // A changed fragment is a step in the browser's history, and no step back to the first window: the results stay.
  await page.evaluate(() => {
    window.location.hash = '#country=LV&rx=p';
  });
  await expect(banner(page).locator('dt')).toHaveText(['Paperinen resepti', 'Sähköinen resepti']);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  await cardButton(page).click();
  await expect(formats(page).nth(1)).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');

  // Back is the link before it, on the same results; back once more is the first window, as always.
  await page.goBack();
  await expect(banner(page).locator('dt')).toHaveText(['Sähköinen resepti', 'Paperinen resepti']);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  await page.goBack();
  await expect(locateButton(page)).toBeVisible();
  expect(new URL(page.url()).hash).toBe('#rx=e');
});

test('a format the pair has no lines for: the card opens on the first it has', async ({ page }) => {
  // A Finnish e-prescription can't be used in Germany: the card has paper and "the doctor sends it".
  await startAt(page, '/fi#country=DE&rx=e', inCountry('DE'));
  await expect(banner(page).locator('dt')).toHaveText(['Sähköinen resepti', 'Paperinen resepti']);
  await cardButton(page).click();
  await expect(formats(page)).toHaveText(['Paperiresepti', 'Lääkäri lähettää']);
  await expect(formats(page).first()).toHaveAttribute('aria-pressed', 'true');
});

test('names and values the app does not know are passed over', async ({ page }) => {
  await startAt(page, '/fi#rx=x&country=Latvia&lat=60.1&medicine=anything', inCountry('LV'));
  await expect(banner(page).locator('dt')).toHaveText(['Sähköinen resepti', 'Paperinen resepti']);
  await cardButton(page).click();
  await expect(formats(page).first()).toHaveAttribute('aria-pressed', 'true');
});

test('at home the link changes nothing: no banner and no counter card', async ({ page }) => {
  await startAt(page, '/fi#country=FI&rx=p', inCountry('FI'));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  await expect(page.getByRole('heading', { name: 'Resepti kotimaasta?' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Näytä apteekissa Apteekkikortti / })).toHaveCount(0);
});

test.describe('place search', () => {
  // A name that is a place in several countries, as our server answers it: best first.
  const vienna = { lat: 48.2082, lon: 16.3738, label: 'Kirchplatz, Wien', country: 'AT' };
  const munich = { lat: 48.1372, lon: 11.5756, label: 'Kirchplatz, München', country: 'DE' };
  const answer = { place: vienna, places: [vienna, munich] };

  async function searchFrom(page: Page, path: string) {
    await fakeLocation(page, 'ignore');
    await fakeTiles(page, 'hold');
    const asked = await fakePlaces(page, answer);
    await open(page, path);
    await page.getByRole('button', { name: 'Hae paikan nimellä' }).click();
    const field = page.getByRole('searchbox', { name: 'Paikka' });
    await field.fill('Kirchplatz');
    await field.press('Enter');
    await expect(searchingStatus(page)).toBeVisible();
    return asked;
  }

  test("takes the answer in the link's country, and asks our server for the name and the language alone", async ({ page }) => {
    const asked = await searchFrom(page, '/fi#country=DE&rx=e');
    await expect(page.locator('p:visible', { hasText: 'Kirchplatz, München' }).first()).toBeVisible();
    await expect(page.getByText('Kirchplatz, Wien')).toHaveCount(0);
    // The country was not sent: the choice was made here, from an answer that is the same for everyone.
    expect(asked).toEqual(['?q=Kirchplatz&lang=fi']);
  });

  test('takes the first answer without a link', async ({ page }) => {
    const asked = await searchFrom(page, '/fi');
    await expect(page.locator('p:visible', { hasText: 'Kirchplatz, Wien' }).first()).toBeVisible();
    expect(asked).toEqual(['?q=Kirchplatz&lang=fi']);
  });

  test("takes the first answer when none is in the link's country: the user typed the name", async ({ page }) => {
    await searchFrom(page, '/fi#country=LV');
    await expect(page.locator('p:visible', { hasText: 'Kirchplatz, Wien' }).first()).toBeVisible();
  });
});

test('the link to the other language carries the link on, with what was understood of it and nothing else', async ({ page }) => {
  await fakeLocation(page, 'ignore');
  await fakeTiles(page, 'hold');
  await open(page, '/fi#rx=P&medicine=anything&country=lv');
  await expect(page.getByRole('link', { name: 'In English' })).toHaveAttribute('href', '/en#country=LV&rx=p');
  // Without a link there is nothing to carry.
  await open(page, '/fi');
  await page.evaluate(() => {
    window.location.hash = '';
  });
  await expect(page.getByRole('link', { name: 'In English' })).toHaveAttribute('href', '/en');
});
