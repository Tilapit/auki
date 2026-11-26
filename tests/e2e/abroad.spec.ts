import type { Page } from '@playwright/test';
import { kamppi } from '@/lib/fixtures/tiles';
import type { TilePharmacy } from '@/lib/tiles';
import { expect, test } from './fixtures';
import { start, world } from './helpers';

/**
 * Abroad (M6, PLAN.md sections 5 and 8): the "Resepti Suomesta?" banner with the trip's field
 * result, and the counter card. The pharmacies are the Kamppi fixture's, said to stand in
 * another country: what is checked is what the app says about that country, from
 * data/countries/. Monday 23 November 2026 at 20:41 in Helsinki.
 */

const inCountry = (country: string) => world(kamppi.map((pharmacy): TilePharmacy => ({ ...pharmacy, country })));
const banner = (page: Page) => page.locator('section', { has: page.getByRole('heading', { name: 'Resepti Suomesta?' }) }).last();
const cardButton = (page: Page) => page.getByRole('button', { name: /^Näytä apteekkikortti / }).first();
const counter = (page: Page) => page.getByRole('dialog', { name: 'Näytä tämä apteekissa' });

test('in Finland there is no banner and no counter card', async ({ page }) => {
  await start(page, inCountry('FI'));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  await expect(page.getByRole('heading', { name: 'Resepti Suomesta?' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Näytä apteekkikortti / })).toHaveCount(0);
});

test('in Latvia the card says that the e-prescription works, where that comes from, and what happened in Riga', async ({ page }) => {
  await start(page, inCountry('LV'));
  await expect(banner(page)).toContainText('Suomalainen e-resepti toimii Latviassa passilla.');
  await expect(banner(page)).toContainText('Jos kysytään ”insurance numberia”, se on henkilötunnuksesi passin tietosivulla.');
  await expect(banner(page)).toContainText('Lähde: Kanta, tarkistettu 25.11.2026.');
  await expect(banner(page).getByRole('link', { name: 'Kanta' })).toHaveAttribute('href', 'https://www.kanta.fi/en/buying-prescription-medicines-abroad');
  // The field result with its sample, month and city, and no pharmacy's name.
  await expect(banner(page)).toContainText('Kokeiltu Riiassa 11/2026: e-resepti löytyi 1/1 apteekista.');
});

test('the counter card in Latvia: Latvian large with its lang, English under it, two formats, and the note that the translation is unchecked', async ({ page }) => {
  await start(page, inCountry('LV'));
  await cardButton(page).click();
  await expect(counter(page)).toBeVisible();
  await expect(counter(page).getByRole('heading', { level: 2 })).toBeFocused();
  const formats = counter(page).getByRole('group', { name: 'Reseptin muoto' }).getByRole('button');
  await expect(formats).toHaveText(['E-resepti', 'Paperiresepti']);
  await expect(formats.first()).toHaveAttribute('aria-pressed', 'true');
  await expect(counter(page).locator('[lang="lv"]').first()).toContainText('Labdien! Man ir Somijas e-recepte.');
  await expect(counter(page).locator('p[lang="en"]').first()).toContainText('Please look it up in the cross-border e-prescription system.');
  await expect(counter(page)).toContainText('Käännös tarkistamatta');
  await formats.nth(1).click();
  await expect(counter(page).locator('[lang="lv"]').first()).toContainText('Šī ir oriģināla recepte');
  await expect(counter(page)).toContainText('Vai farmaceits varētu man palīdzēt?');
  // It is a modal: Escape closes it, and focus is back on the button that opened it.
  await page.keyboard.press('Escape');
  await expect(counter(page)).toBeHidden();
  await expect(cardButton(page)).toBeFocused();
});

test('in Germany, where a Finnish e-prescription can’t be used, the card has no lines for one: paper, and the doctor sends it', async ({ page }) => {
  await start(page, inCountry('DE'));
  await expect(banner(page)).toContainText('Suomalainen e-resepti ei toimi Saksassa.');
  await expect(banner(page)).toContainText('Kokeiltu Berliinissä, Frankfurtissa, Stuttgartissa ja Münchenissä 11/2026: lääkärin sähköposti kävi 8/11 apteekissa.');
  await cardButton(page).click();
  const formats = counter(page).getByRole('group', { name: 'Reseptin muoto' }).getByRole('button');
  await expect(formats).toHaveText(['Paperiresepti', 'Lääkäri lähettää']);
  await expect(counter(page).locator('[lang="de"]').first()).toContainText('Das ist ein Originalrezept von einem Arzt in Finnland');
  await formats.nth(1).click();
  await expect(counter(page).locator('[lang="de"]').first()).toContainText('Mein Arzt in Finnland kann Ihnen das Rezept direkt per E-Mail oder Fax schicken.');
});

test('in English the banner is in English, and Sweden, where nothing was tried at a counter, has no field line', async ({ page }) => {
  await start(page, inCountry('SE'));
  await expect(banner(page)).toContainText('Suomalainen e-resepti ei toimi Ruotsissa.');
  await expect(banner(page)).not.toContainText('Kokeiltu');
  await page.getByRole('link', { name: 'In English' }).first().click();
  await expect(page).toHaveURL(/\/en$/);
});

test('while the card is open the screen is asked to stay awake, and the card says so only when it does', async ({ page }) => {
  await page.addInitScript(() => {
    const log: string[] = [];
    (window as unknown as { wake: string[] }).wake = log;
    Object.defineProperty(Navigator.prototype, 'wakeLock', {
      configurable: true,
      get: () => ({
        request: async (type: string) => {
          log.push(`request ${type}`);
          return { release: async () => void log.push('release') };
        },
      }),
    });
  });
  await start(page, inCountry('LV'));
  const wake = () => page.evaluate(() => (window as unknown as { wake: string[] }).wake);
  expect(await wake()).toEqual([]);
  await cardButton(page).click();
  await expect(counter(page)).toContainText('Näyttö pysyy päällä.');
  expect(await wake()).toEqual(['request screen']);
  await page.keyboard.press('Escape');
  await expect(counter(page)).toBeHidden();
  await expect.poll(wake).toEqual(['request screen', 'release']);
});

test('a browser that can’t keep the screen awake shows the card without that line', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'wakeLock', { configurable: true, get: () => ({ request: async () => Promise.reject(new Error('NotAllowedError')) }) });
  });
  await start(page, inCountry('LV'));
  await cardButton(page).click();
  await expect(counter(page)).toContainText('Käännös tarkistamatta');
  await expect(counter(page)).not.toContainText('Näyttö pysyy päällä.');
});
