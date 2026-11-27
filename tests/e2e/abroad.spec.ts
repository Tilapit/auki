import type { Page } from '@playwright/test';
import { SOURCES } from '@/data/countries';
import { kamppi, MONDAY_EVENING } from '@/lib/fixtures/tiles';
import { HOME_KEY } from '@/lib/home';
import type { TilePharmacy } from '@/lib/tiles';
import { expect, test } from './fixtures';
import { fakeLocation, fakeTiles, open, settle, start, world } from './helpers';

/**
 * A prescription from another country than the pharmacy's (PLAN.md sections 5 and 8): the
 * "Resepti kotimaasta?" banner and the counter card, for any pair of countries. The
 * pharmacies are the Kamppi fixture's, said to stand in another country: what is checked is
 * what the app says about the pair, from data/countries/. The browser of these tests reads
 * Finnish (playwright.config.ts), so the home country it suggests is Finland unless a test
 * gives it other languages. Monday 23 November 2026 at 20:41 in Helsinki.
 */

const inCountry = (country: string) => world(kamppi.map((pharmacy): TilePharmacy => ({ ...pharmacy, country })));
const banner = (page: Page) => page.locator('section', { has: page.getByRole('heading', { name: 'Resepti kotimaasta?' }) }).last();
const home = (page: Page) => banner(page).getByRole('combobox', { name: 'Reseptin maa' });
const cardButton = (page: Page) => page.getByRole('button', { name: /^Näytä apteekissa: apteekkikortti / }).first();
const counter = (page: Page) => page.getByRole('dialog', { name: 'Näytä tämä apteekissa' });

/** The browser's languages, as a visitor's phone has them. */
async function reads(page: Page, languages: string[]) {
  await page.addInitScript((list) => {
    Object.defineProperty(Navigator.prototype, 'languages', { configurable: true, get: () => list });
    Object.defineProperty(Navigator.prototype, 'language', { configurable: true, get: () => list[0] });
  }, languages);
}

/** The same start as the helper's, in English. */
async function startInEnglish(page: Page, files: Record<string, unknown>) {
  await page.clock.install({ time: new Date((MONDAY_EVENING - 60) * 1000) });
  await fakeLocation(page, 'allow');
  await fakeTiles(page, files);
  await open(page, '/en');
  await page.clock.pauseAt(new Date(MONDAY_EVENING * 1000));
  await page.getByRole('button', { name: 'Show pharmacies near me' }).click();
  await settle(page);
}

test('at home there is no banner and no counter card', async ({ page }) => {
  await start(page, inCountry('FI'));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  await expect(page.getByRole('heading', { name: 'Resepti kotimaasta?' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Näytä apteekissa: apteekkikortti / })).toHaveCount(0);
});

test('at home the footer has a way to the banner, for someone whose phone suggests the wrong country', async ({ page }) => {
  await start(page, inCountry('FI'));
  await expect(page.getByRole('heading', { name: 'Resepti kotimaasta?' })).toHaveCount(0);
  const ask = page.getByRole('button', { name: 'Resepti toisesta maasta?' });
  await ask.click();
  // The banner comes up with the keyboard on its control, and claims nothing yet: the country is still the pharmacy's own.
  await expect(home(page)).toBeFocused();
  await expect(home(page)).toHaveValue('FI');
  await expect(banner(page)).toContainText('Valitse maa, jossa reseptisi on kirjoitettu, niin näet, käykö se täällä.');
  await expect(banner(page)).not.toContainText('sähköinen resepti');
  await expect(ask).toHaveCount(0);
  await home(page).selectOption({ label: 'Saksa' });
  // Not on Finland's list: said as that, with whose list it is, and never as a flat "ei käy".
  await expect(banner(page)).toContainText('Saksa ei ole niiden maiden luettelossa, joiden sähköiset reseptit käyvät Suomessa. Luettelo: Kanta, päivitetty');
  await expect(banner(page)).toContainText('Paperinen resepti käy EU:n säännön nojalla.');
  await expect(banner(page)).not.toContainText('sähköinen resepti ei käy');
  await expect(banner(page)).toContainText('Saksassa kirjoitettu paperinen resepti kelpaa Suomessa, kun siinä on vaaditut tiedot.');
});

test('abroad the footer has no such line: the banner is there already', async ({ page }) => {
  await start(page, inCountry('LV'));
  await expect(banner(page)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Resepti toisesta maasta?' })).toHaveCount(0);
});

test('a prescription from Finland in Latvia: both answers, what was met in Riga, and the sources with their dates', async ({ page }) => {
  await start(page, inCountry('LV'));
  await expect(home(page)).toHaveValue('FI');
  await expect(banner(page)).toContainText('Suomessa kirjoitettu sähköinen resepti käy Latviassa.');
  await expect(banner(page)).toContainText('Suomessa kirjoitettu paperinen resepti kelpaa Latviassa, kun siinä on vaaditut tiedot.');
  // The trip's result with its sample, month and city, no pharmacy's name, and under words that say whose prescriptions they were.
  await expect(banner(page)).toContainText('Suomalaisella reseptillä. Kokeiltu Riiassa 11/2026: e-resepti löytyi 1/1 apteekista.');
  await expect(banner(page)).toContainText('Jos ensimmäinen vastaus on ei, pyydä farmaseuttia.');
  await expect(banner(page)).toContainText('Viralliset lähteet luettu 26.11.2026.');

  // Behind one button: what each country's page asks, what a paper prescription has to show, and every source.
  const more = banner(page).getByRole('button', { name: 'Lisätiedot ja lähteet' });
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await expect(banner(page).getByRole('link')).toHaveCount(0);
  await more.click();
  await expect(more).toHaveAttribute('aria-expanded', 'true');
  await expect(banner(page)).toContainText('Ota mukaan passi tai henkilökortti ja asioi itse.');
  await expect(banner(page)).toContainText('Paperisessa reseptissä pitää olla vähintään:');
  await expect(banner(page).getByRole('listitem').filter({ hasText: 'potilaan sukunimi, etunimi ja syntymäaika' })).toBeVisible();
  const kanta = banner(page).getByRole('link', { name: /^Kanta: reseptilääkkeen ostaminen ulkomailta/ });
  await expect(kanta).toHaveAttribute('href', 'https://www.kanta.fi/reseptilaakkeen-ostaminen-ulkomailta');
  await expect(banner(page).getByRole('listitem').filter({ hasText: 'Kanta: reseptilääkkeen ostaminen ulkomailta' })).toContainText('Sivu päivitetty 6.3.2026, luettu 26.11.2026.');
  // Latvia's own page shows no date: then only the day it was read.
  await expect(banner(page).getByRole('listitem').filter({ hasText: 'eveseliba.gov.lv (Latvia)' })).toContainText('Luettu 26.11.2026.');
  await expect(banner(page).getByRole('link', { name: /^Sinun Eurooppasi \(EU\): reseptilääkkeen ostaminen/ })).toHaveAttribute('href', /index_fi\.htm$/);
  await expect(banner(page).getByRole('link', { name: /^Direktiivi 2011\/24\/EU, 11 artikla/ })).toBeVisible();
});

test('the counter card in Latvia: Latvian large with its lang, English under it, two formats, and the note that the translation is unchecked', async ({ page }) => {
  await start(page, inCountry('LV'));
  await cardButton(page).click();
  await expect(counter(page)).toBeVisible();
  await expect(counter(page).getByRole('heading', { level: 2 })).toBeFocused();
  const formats = counter(page).getByRole('group', { name: 'Reseptin muoto' }).getByRole('button');
  await expect(formats).toHaveText(['E-resepti', 'Paperiresepti']);
  await expect(formats.first()).toHaveAttribute('aria-pressed', 'true');
  const local = counter(page).locator('[lang="lv"]').first();
  await expect(local).toContainText('Labdien! Man ir citā Eiropas Savienības valstī izrakstīta e-recepte.');
  // The prescription's country stands by itself, in Latvian.
  await expect(local).toContainText('Valsts: Somija.');
  // From Finland, the line about the personal identity code that staff asked for on the trip.
  await expect(local).toContainText('tas ir mans Somijas personas kods');
  await expect(counter(page).locator('p[lang="en"]').first()).toContainText('Please look it up in the cross-border e-prescription system. Country: Finland.');
  await expect(counter(page)).toContainText('Käännös tarkistamatta');
  await formats.nth(1).click();
  await expect(local).toContainText('Šī ir oriģināla recepte');
  await expect(counter(page)).toContainText('Vai farmaceits varētu man palīdzēt?');
  // It is a modal: Escape closes it, and focus is back on the button that opened it.
  await page.keyboard.press('Escape');
  await expect(counter(page)).toBeHidden();
  await expect(cardButton(page)).toBeFocused();
});

test('a visitor in Finland: the banner is there, for the country the phone suggests, and the card is in Finnish', async ({ page }) => {
  await reads(page, ['et-EE', 'en-GB']);
  await start(page, inCountry('FI'));
  await expect(home(page)).toHaveValue('EE');
  await expect(banner(page)).toContainText('Virossa kirjoitettu sähköinen resepti käy Suomessa.');
  await expect(banner(page)).toContainText('Virossa kirjoitettu paperinen resepti kelpaa Suomessa, kun siinä on vaaditut tiedot.');
  // Nothing was tried at a counter in Finland: no field line.
  await expect(banner(page)).not.toContainText('Kokeiltu');
  await banner(page).getByRole('button', { name: 'Lisätiedot ja lähteet' }).click();
  await expect(banner(page)).toContainText('Resepti käy jokaisessa Suomen apteekissa.');
  await expect(banner(page).getByRole('link', { name: /^Kanta: lääkkeiden ostaminen ulkomaisella reseptillä/ })).toBeVisible();
  await expect(banner(page).getByRole('link', { name: /^TEHIK \(Viro\)/ })).toBeVisible();

  await page.getByRole('button', { name: 'Näytä apteekissa: apteekkikortti suomeksi' }).first().click();
  const local = counter(page).locator('[lang="fi"]').first();
  await expect(local).toContainText('Hei! Minulla on toisessa EU-maassa kirjoitettu sähköinen resepti.');
  await expect(local).toContainText('Maa: Viro.');
  await expect(counter(page).locator('p[lang="en"]').first()).toContainText('Country: Estonia.');
  // Finnish is the app's own language: not a translation waiting for a check.
  await expect(counter(page)).not.toContainText('Käännös tarkistamatta');
});

test('a prescription from Germany in Latvia: not on Latvia’s list, which the answer says with the list’s owner and date; the card has paper lines only', async ({ page }) => {
  await reads(page, ['de-DE', 'de', 'en']);
  await start(page, inCountry('LV'));
  await expect(home(page)).toHaveValue('DE');
  await expect(banner(page)).toContainText('Saksa ei ole niiden maiden luettelossa, joiden sähköiset reseptit käyvät Latviassa. Luettelo: eveseliba.gov.lv (Latvia), ');
  // The way that works is named in the same answer: the paper prescription, under the EU's rule.
  await expect(banner(page)).toContainText('Paperinen resepti käy EU:n säännön nojalla.');
  await expect(banner(page)).not.toContainText('sähköinen resepti ei käy');
  await expect(banner(page)).toContainText('Saksassa kirjoitettu paperinen resepti kelpaa Latviassa, kun siinä on vaaditut tiedot.');
  // The trip's result is Latvia's, and it says whose prescription it was made with.
  await expect(banner(page)).toContainText('Suomalaisella reseptillä. Kokeiltu Riiassa 11/2026');
  await banner(page).getByRole('button', { name: 'Lisätiedot ja lähteet' }).click();
  await expect(banner(page).getByRole('link', { name: /^eveseliba\.gov\.lv \(Latvia\)/ })).toHaveCount(1);
  await expect(banner(page).getByRole('link', { name: /^Kanta/ })).toHaveCount(0);

  await cardButton(page).click();
  await expect(counter(page).getByRole('group', { name: 'Reseptin muoto' })).toHaveCount(0);
  await expect(counter(page).locator('[lang="lv"]').first()).toContainText('Valsts: Vācija. Vai varat izsniegt zāles pēc šīs receptes?');
});

test('the country can be changed in the banner, and the choice is kept on the device as its code alone', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(`${request.url()} ${request.postData() ?? ''}`));
  await start(page, inCountry('LV'));
  await expect(home(page)).toHaveValue('FI');
  // Nothing is kept until something is picked: the suggestion is the browser's, worked out at every visit.
  expect(await page.evaluate((key) => localStorage.getItem(key), HOME_KEY)).toBeNull();

  await home(page).selectOption({ label: 'Sveitsi' });
  await expect(banner(page)).toContainText('Sveitsi ei ole niiden maiden luettelossa, joiden sähköiset reseptit käyvät Latviassa.');
  // Switzerland is outside the EU's rule: nothing points to paper as the way that works.
  await expect(banner(page)).not.toContainText('Paperinen resepti käy EU:n säännön nojalla.');
  await expect(banner(page)).toContainText('EU-maiden ei tarvitse hyväksyä Sveitsissä kirjoitettuja reseptejä.');
  expect(await page.evaluate((key) => localStorage.getItem(key), HOME_KEY)).toBe('CH');

  // Another country, the last in the list: outside the EU and the EEA nothing official was found, and the banner says so.
  await home(page).selectOption({ label: 'Muu maa' });
  await expect(banner(page)).toContainText('Virallista tietoa siitä, käykö EU:n ja Eta-alueen ulkopuolella kirjoitettu resepti Latviassa, ei löytynyt.');
  expect(await page.evaluate((key) => localStorage.getItem(key), HOME_KEY)).toBe('XX');

  // The next visit starts from the choice, not from the browser's languages.
  await home(page).selectOption({ label: 'Viro' });
  await page.reload();
  await settle(page);
  await expect(home(page)).toHaveValue('EE');
  await expect(banner(page)).toContainText('Virossa kirjoitettu sähköinen resepti käy Latviassa.');

  // And it went nowhere: no request named a country.
  expect(requests.filter((request) => /home|country=|[?&=](CH|XX|EE)\b/.test(request.replace(/^\S+\/_next\/\S*/, '')))).toEqual([]);
});

test('a phone that suggests no country: the banner asks, in English, and answers once a country is chosen', async ({ page }) => {
  await reads(page, ['en-US']);
  await startInEnglish(page, inCountry('LV'));
  const section = page.locator('section', { has: page.getByRole('heading', { name: 'Prescription from home?' }) }).last();
  const select = section.getByRole('combobox', { name: 'Country of the prescription' });
  await expect(select).toHaveValue('');
  await expect(section).toContainText('Choose the country your prescription was written in to see whether it works here.');
  // Nothing is claimed, and no counter card is offered, before a country is known.
  await expect(section).not.toContainText('e-prescription written');
  await expect(page.getByRole('button', { name: /^Show at the counter/ })).toHaveCount(0);

  await select.selectOption({ label: 'United Kingdom' });
  await expect(section).toContainText('The list of countries whose e-prescriptions are dispensed in Latvia does not include the United Kingdom. List: eveseliba.gov.lv (Latvia), ');
  await expect(section).not.toContainText('A paper prescription works under the EU’s rule.');
  await expect(section).toContainText('No official statement was found on whether a prescription written in the United Kingdom is accepted in Latvia.');
  await expect(section).toContainText('With a prescription from Finland. Tried in Riga, 11/2026');
  await expect(page.getByRole('button', { name: 'Show at the counter: the card in Latvian' }).first()).toBeVisible();
});

test('in Germany, which takes no e-prescription from abroad, the card has no lines for one: paper, and the doctor sends it', async ({ page }) => {
  await start(page, inCountry('DE'));
  await expect(banner(page)).toContainText('Toisessa maassa kirjoitettu sähköinen resepti ei käy Saksassa.');
  await expect(banner(page)).toContainText('Kokeiltu Berliinissä, Frankfurtissa, Stuttgartissa ja Münchenissä 11/2026: lääkärin sähköposti kävi 8/11 apteekissa.');
  await cardButton(page).click();
  const formats = counter(page).getByRole('group', { name: 'Reseptin muoto' }).getByRole('button');
  await expect(formats).toHaveText(['Paperiresepti', 'Lääkäri lähettää']);
  await expect(counter(page).locator('[lang="de"]').first()).toContainText('Das ist ein Originalrezept von einem Arzt aus einem anderen EU- oder EWR-Land.');
  await expect(counter(page).locator('[lang="de"]').first()).toContainText('Land: Finnland.');
  await formats.nth(1).click();
  await expect(counter(page).locator('[lang="de"]').first()).toContainText('Mein Arzt kann Ihnen das Rezept direkt per E-Mail oder Fax schicken.');
});

test('Sweden, where nothing was tried at a counter, has no field line, and says what its own authority says', async ({ page }) => {
  await start(page, inCountry('SE'));
  await expect(banner(page)).toContainText('Toisessa maassa kirjoitettu sähköinen resepti ei käy Ruotsissa.');
  await expect(banner(page)).not.toContainText('Kokeiltu');
  await banner(page).getByRole('button', { name: 'Lisätiedot ja lähteet' }).click();
  await expect(banner(page)).toContainText('Ruotsissa käy vain rajat ylittävää käyttöä varten kirjoitettu paperinen resepti.');
  await expect(banner(page).getByRole('link', { name: /^E-hälsomyndigheten \(Ruotsi\)/ })).toBeVisible();
});

test('a prescription from Sweden in Latvia: Sweden’s own agency says it can’t be used abroad, and how to get it on paper', async ({ page }) => {
  await reads(page, ['sv-SE', 'sv', 'en']);
  await start(page, inCountry('LV'));
  await expect(home(page)).toHaveValue('SE');
  await expect(banner(page)).toContainText('Ruotsissa kirjoitettu sähköinen resepti ei käy ulkomailla.');
  await expect(banner(page)).toContainText('Ruotsissa kirjoitettu paperinen resepti kelpaa Latviassa, kun siinä on vaaditut tiedot.');
  await banner(page).getByRole('button', { name: 'Lisätiedot ja lähteet' }).click();
  await expect(banner(page)).toContainText('Apteekkia voi pyytää tulostamaan sen paperille ennen matkaa.');
  const agency = banner(page).getByRole('listitem').filter({ hasText: 'Läkemedelsverket (Ruotsi)' });
  await expect(agency.getByRole('link')).toHaveAttribute('href', SOURCES.lakemedelsverket.url.fi);
  await expect(agency).toContainText('Sivu päivitetty 14.4.2026, luettu 26.11.2026.');
  // No page says the pair works: the card has paper lines only.
  await cardButton(page).click();
  await expect(counter(page).getByRole('group', { name: 'Reseptin muoto' })).toHaveCount(0);
});

test('a prescription from Latvia in Austria: the two countries’ pages disagree, and the banner says so and names both', async ({ page }) => {
  await reads(page, ['lv-LV', 'lv', 'en']);
  await start(page, inCountry('AT'));
  await expect(home(page)).toHaveValue('LV');
  await expect(banner(page)).toContainText('Maiden omat sivut kertovat eri tavoin, käykö Latviassa kirjoitettu sähköinen resepti Itävallassa.');
  await banner(page).getByRole('button', { name: 'Lisätiedot ja lähteet' }).click();
  await expect(banner(page).getByRole('link', { name: /^eveseliba\.gov\.lv \(Latvia\)/ })).toHaveCount(1);
  // Austria's list of whose e-prescriptions its pharmacies take is on its page for health professionals, with that page's date.
  await expect(banner(page).getByRole('listitem').filter({ hasText: 'gesundheit.gv.at (Itävalta): EU-resepti, tietoa terveydenhuollon ammattilaisille' })).toContainText('Sivu päivitetty 21.9.2026, luettu 26.11.2026.');
});

test('a prescription from Spain in Austria: both pages have the pair, and the answer says where the pharmacies that offer the service are listed', async ({ page }) => {
  await reads(page, ['es-ES', 'es', 'en']);
  await start(page, inCountry('AT'));
  await expect(home(page)).toHaveValue('ES');
  await expect(banner(page)).toContainText('Espanjassa kirjoitettu sähköinen resepti käy Itävallassa.');
  await banner(page).getByRole('button', { name: 'Lisätiedot ja lähteet' }).click();
  await expect(banner(page)).toContainText('Itävallan terveysportaali gesundheit.gv.at luettelee apteekit, jotka tarjoavat palvelua. Niitä on 45.');
  await expect(banner(page).getByRole('link', { name: /^gesundheit\.gv\.at \(Itävalta\): tietoa Itävaltaan matkustaville potilaille/ })).toHaveAttribute('href', SOURCES.gesundheitAtVisitors.url.fi);
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

/**
 * The guidance is not part of the first load (lib/guidance.ts): its sentences, its sources and
 * the card's lines travel in a file of their own, fetched when a prescription's country is not
 * the pharmacy's. Which file that is has no name to test by, so every script the page fetches
 * is read for an address that only the guidance has: one of its sources.
 */
function guidanceFetched(page: Page) {
  const marker = SOURCES.tehik.url.fi;
  // From the moment a script is asked for, so that one still on its way is waited for and read.
  const scripts: Promise<string>[] = [];
  page.on('request', (request) => {
    if (request.resourceType() !== 'script') return;
    scripts.push(
      request
        .response()
        .then((response) => response?.text() ?? '')
        .catch(() => ''),
    );
  });
  return async () => (await Promise.all(scripts)).filter((body) => body.includes(marker)).length;
}

test('at home none of the guidance is fetched, until the banner is asked for from the footer', async ({ page }) => {
  const fetched = guidanceFetched(page);
  await start(page, inCountry('FI'));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  // Abroad the file is asked for as the results appear (the next test). Here half a second of
  // real time is given for a request that should never come; the page's own clock stands still.
  await page.waitForTimeout(500);
  expect(await fetched()).toBe(0);

  await page.getByRole('button', { name: 'Resepti toisesta maasta?' }).click();
  await expect(home(page)).toBeFocused();
  expect(await fetched()).toBe(1);
});

test('abroad the guidance is fetched once, and the banner and the card’s button are there when it has come', async ({ page }) => {
  const fetched = guidanceFetched(page);
  await start(page, inCountry('LV'));
  await expect(banner(page)).toContainText('Suomessa kirjoitettu sähköinen resepti käy Latviassa.');
  await expect(cardButton(page)).toBeVisible();
  expect(await fetched()).toBe(1);
});
