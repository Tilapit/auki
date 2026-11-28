import type { Page } from '@playwright/test';
import { kamppi } from '@/lib/fixtures/tiles';
import { isAllowedUrl } from '@/lib/requests';
import type { TilePharmacy } from '@/lib/tiles';
import { expect, test } from './fixtures';
import { start, world } from './helpers';

/**
 * Medicine availability (PLAN.md 7.9): the app says where to check, and hands the name the
 * user typed to the country's own service in a link. The second privacy claim of PLAN.md
 * 7.6 is checked here: a medicine's name reaches no host but the one the link names, and
 * the page keeps nothing of it. The service is answered by the test: no test reaches it.
 */

// A name no medicine has, so that it can be searched for in everything the page sent and kept.
const NAME = 'Zzyx-Koevalmiste 12 mg';
const MARK = 'zzyx';
const SERVICE = 'https://www.apteekki.fi';
const SEARCH = `${SERVICE}/laakehaku.html`;

// The steps from where apteekki.fi's link lands to one pharmacy's stock, in the site's own Finnish words.
const steps = (pharmacy: string) => [
  'Paina oikean pakkauksen kohdalla ”Saatavuus ja hinta”.',
  'Paina ”Etsi lähin apteekki” ja salli sijainti.',
  `Etsi listasta ${pharmacy}. Sen kohdalla Varastossa-sarakkeessa lukee Kyllä tai Ei.`,
];

const card = (page: Page) => page.locator('section', { has: page.getByRole('heading', { name: 'Lähin auki nyt' }) }).last();
const medicine = (page: Page) => page.getByRole('dialog', { name: 'Tarkista lääkkeen saatavuus' });

test('a medicine\'s name goes to the country\'s own service in the link the user opens, and nowhere else', async ({ page, context, baseURL }) => {
  const seen: { url: string; text: string }[] = [];
  context.on('request', (request) => {
    seen.push({ url: request.url(), text: [request.url(), JSON.stringify(request.headers()), request.postData() ?? ''].join('\n') });
  });
  const opened: { url: string; referer: string | undefined }[] = [];
  await context.route(`${SERVICE}/**`, async (route) => {
    opened.push({ url: route.request().url(), referer: route.request().headers().referer });
    await route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>stand-in</title>' });
  });
  await start(page, world(kamppi));

  // One of the card's main actions: its name is the dialog's, with the address of where the check is made. It asks nothing until it is pressed.
  await expect(card(page).getByRole('button', { name: 'Tarkista lääkkeen saatavuus apteekki.fi' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Lääkkeen nimi' })).toHaveCount(0);
  await card(page).getByRole('button', { name: /^Tarkista lääkkeen saatavuus/ }).click();
  const dialog = medicine(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { level: 2 })).toBeFocused();
  // It names the service and who runs it, and makes no claim of its own.
  await expect(dialog).toContainText('Lääkehaku, jota ylläpitää Suomen Apteekkariliitto');
  // The pharmacy to check with is the card's, and its number is a call link.
  await expect(dialog).toContainText('Varastotieto on palvelun oma, eikä tämä sovellus näe sitä. Varmista apteekista ennen kuin lähdet: +358 9 1234 501.');
  await expect(dialog.getByRole('link', { name: '+358 9 1234 501' })).toHaveAttribute('href', 'tel:+35891234501');

  // Without a name the link opens the service's own search.
  const link = dialog.getByRole('link', { name: 'Avaa apteekki.fi' });

  // Under it, the way from where it lands to this pharmacy's stock: three steps, the card's pharmacy named in the last.
  const list = dialog.getByRole('list');
  await expect(list.getByRole('listitem')).toHaveText(steps('Kampin apteekki'));
  expect(await dialog.evaluate((d) => !!(d.querySelector('[data-handoff]')!.compareDocumentPosition(d.querySelector('ol')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  // The site's own words are marked as Finnish, so that a screen reader in any language reads them as such.
  await expect(list.locator('[lang="fi"]')).toHaveText(['Saatavuus ja hinta', 'Etsi lähin apteekki', 'Varastossa', 'Kyllä', 'Ei']);
  await expect(link).toHaveAttribute('href', SEARCH);
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');

  // The field can be submitted nowhere: it has no name and no form, and the browser neither keeps nor spell-checks it.
  const field = dialog.getByRole('textbox', { name: 'Lääkkeen nimi' });
  expect(
    await field.evaluate((input: HTMLInputElement) => ({ name: input.name, form: input.form, autocomplete: input.autocomplete, spellcheck: input.spellcheck })),
  ).toEqual({ name: '', form: null, autocomplete: 'off', spellcheck: false });
  await expect(field).toHaveAccessibleDescription(/Nimi siirtyy laitteeltasi suoraan sivustolle apteekki\.fi, kun avaat linkin\./);

  // With a name the link carries it, as the service's own search would write it.
  await field.fill(`  ${NAME} `);
  await expect(link).toHaveAttribute('href', `${SEARCH}?ehto=${encodeURIComponent(NAME)}`);

  // The keyboard's "go" follows the link: the service opens in a tab of its own, which knows nothing of this one.
  const [tab] = await Promise.all([context.waitForEvent('page'), field.press('Enter')]);
  await tab.waitForLoadState();
  expect(tab.url()).toBe(`${SEARCH}?ehto=${encodeURIComponent(NAME)}`);
  expect(await tab.evaluate(() => window.opener)).toBeNull();
  expect(await tab.evaluate(() => document.referrer)).toBe('');
  expect(opened).toEqual([{ url: `${SEARCH}?ehto=${encodeURIComponent(NAME)}`, referer: undefined }]);
  await tab.close();

  // The claim: of everything that was sent, only that one request has the name. Our own host never saw it.
  const origin = new URL(baseURL!).origin;
  const elsewhere = seen.filter((request) => new URL(request.url).origin !== SERVICE);
  expect(elsewhere.length).toBeGreaterThan(3);
  for (const request of elsewhere) {
    expect(isAllowedUrl(request.url, origin), request.url).toBe(true);
    expect(decodeURIComponent(request.text).toLowerCase().includes(MARK), request.url).toBe(false);
  }
  expect(seen.filter((request) => new URL(request.url).origin === SERVICE)).toHaveLength(1);

  // And the page kept nothing: no storage, no cookie, no address, no history entry.
  const kept = await page.evaluate(async () =>
    JSON.stringify([{ ...localStorage }, { ...sessionStorage }, document.cookie, location.href, history.state, 'caches' in window ? await caches.keys() : [], 'databases' in indexedDB ? await indexedDB.databases() : []]),
  );
  expect(kept.toLowerCase()).not.toContain(MARK);

  // The name does not outlive the dialog.
  await dialog.getByRole('button', { name: 'Sulje' }).click();
  await expect(dialog).toBeHidden();
  await card(page).getByRole('button', { name: /^Tarkista lääkkeen saatavuus/ }).click();
  await expect(field).toHaveValue('');
  await expect(link).toHaveAttribute('href', SEARCH);
});

test('a pharmacy\'s details offer the same check, and Escape closes it without closing the details', async ({ page }) => {
  await start(page, world(kamppi));
  await page.getByRole('button', { name: 'Yliopiston apteekki', exact: true }).click();
  const sheet = page.getByRole('dialog').filter({ has: page.getByRole('heading', { level: 2, name: 'Yliopiston apteekki' }) });
  await expect(sheet).toBeVisible();
  const open = sheet.getByRole('button', { name: /^Tarkista lääkkeen saatavuus/ });
  // From the keyboard, where it matters that focus comes back. (Safari does not focus a button that is clicked.)
  await open.focus();
  await page.keyboard.press('Enter');
  await expect(medicine(page)).toBeVisible();
  await expect(medicine(page).getByRole('link', { name: 'Avaa apteekki.fi' })).toHaveAttribute('href', SEARCH);
  // The steps and the number are this pharmacy's, not the card's.
  await expect(medicine(page).getByRole('listitem')).toHaveText(steps('Yliopiston apteekki'));
  await expect(medicine(page).getByRole('link', { name: '+358 9 1234 502' })).toHaveAttribute('href', 'tel:+35891234502');
  await page.keyboard.press('Escape');
  await expect(medicine(page)).toBeHidden();
  // Back where the user was: the pharmacy's details, on the button that opened the dialog.
  await expect(sheet).toBeVisible();
  await expect(open).toBeFocused();
});

test('pressed with a mouse where a pressed button gets no focus, as in Safari on a Mac: closed, the check gives the keyboard back to its button all the same', async ({ page }) => {
  await start(page, world(kamppi));
  const open = card(page).getByRole('button', { name: /^Tarkista lääkkeen saatavuus/ });
  // Safari's way, in any browser: the press leaves the focus where it was.
  await open.evaluate((button) => button.addEventListener('mousedown', (event) => event.preventDefault()));
  await open.click();
  await expect(medicine(page)).toBeVisible();
  await medicine(page).getByRole('button', { name: 'Sulje' }).click();
  await expect(medicine(page)).toBeHidden();
  await expect(open).toBeFocused();
});

test('a service whose address takes no name is never asked for one', async ({ page }) => {
  // The same pharmacies as if they stood in Austria, where the stock lookup lives in the Chamber's app.
  const austrian = kamppi.map((pharmacy): TilePharmacy => ({ ...pharmacy, country: 'AT' }));
  await start(page, world(austrian));
  await card(page).getByRole('button', { name: /^Tarkista lääkkeen saatavuus/ }).click();
  const dialog = medicine(page);
  await expect(dialog).toContainText('ApoApp');
  await expect(dialog.getByRole('textbox')).toHaveCount(0);
  await expect(dialog.getByRole('link', { name: 'Avaa apothekerkammer.at' })).toHaveAttribute('href', 'https://www.apothekerkammer.at/apoapp');
  await expect(dialog).toContainText('Linkissä ei ole lääkkeen nimeä. Kirjoita se palvelun omaan hakuun: tämä sovellus ei kysy eikä näe sitä.');
  // The steps are apteekki.fi's and are not given for another service; the number to call is.
  await expect(dialog.getByRole('list')).toHaveCount(0);
  await expect(dialog.getByRole('link', { name: '+358 9 1234 501' })).toHaveAttribute('href', 'tel:+35891234501');
});

test('in a country without a stock search of its own, nothing is offered', async ({ page }) => {
  // The same pharmacies as if they stood in Latvia, which has no such service to hand over to.
  const latvian = kamppi.map((pharmacy): TilePharmacy => ({ ...pharmacy, country: 'LV' }));
  await start(page, world(latvian));
  await expect(card(page).getByRole('heading', { level: 3 }).first()).toHaveText('Kampin apteekki');
  await expect(page.getByText('Tarkista lääkkeen saatavuus')).toHaveCount(0);
  await expect(page.getByText('Lääkkeen saatavuus')).toHaveCount(0);
  await page.getByRole('button', { name: 'Yliopiston apteekki', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toHaveText('Yliopiston apteekki');
  await expect(page.getByRole('button', { name: /^Tarkista lääkkeen saatavuus/ })).toHaveCount(0);
});
