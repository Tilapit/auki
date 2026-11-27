import type { Page } from '@playwright/test';
import { kamppi } from '@/lib/fixtures/tiles';
import { carriesPosition } from '@/lib/requests';
import { REPORTS_DONE_KEY } from '@/lib/reports';
import { LOCATED_KEY } from '@/lib/geolocation';
import { expect, test } from './fixtures';
import { HERE, fakeReports, start, world } from './helpers';

/**
 * Visitors' reports (PLAN.md 7.10): offered in a pharmacy's details and never asked, one
 * screen of chips, and what others told from three reports on. The privacy claim is checked
 * here: a report carries the pharmacy, its country and the chips pressed, and nothing else;
 * the device remembers only which pharmacies it has asked about today. /api/report is
 * answered by the test: no test reaches the route or the database.
 *
 * The page's clock is the test's: Monday 23 November 2026 at 20:41 in Helsinki.
 */

/** The details of a pharmacy: the dialog that has the route buttons. The report's own dialog is another one. */
const details = (page: Page) => page.locator('dialog', { has: page.locator('[data-fold]') });
const offer = (page: Page) => page.getByRole('button', { name: 'Kävitkö täällä? Kerro, miten meni' });
const skip = (page: Page) => page.locator('[data-report-row]').getByRole('button', { name: /^Ohita kysymys käynnistä/ });
const form = (page: Page) => page.getByRole('dialog', { name: 'Miten käynti meni?' });
const chip = (page: Page, name: string) => form(page).getByRole('button', { name, exact: true });
const told = (page: Page) => page.getByRole('region', { name: 'Kävijöiden ilmoituksia' });
const openDetails = async (page: Page, name: string) => {
  await page.getByRole('button', { name }).first().click();
  await expect(details(page).getByRole('heading', { level: 2 })).toHaveText(name);
};
const closeDetails = (page: Page) => page.keyboard.press('Escape');
const done = (page: Page) => page.evaluate((key) => localStorage.getItem(key), REPORTS_DONE_KEY);

const FIVE = { count: 5, from: '2026-11-12', to: '2026-11-23', answers: { prescription: { yes: 3, no: 1 }, english: { yes: 4, no: 0 }, shortWait: { yes: 2, no: 2 } } };

test('without a report service nothing is offered and nothing is shown', async ({ page, reportAsked }) => {
  await start(page, world(kamppi));
  await openDetails(page, 'Töölön apteekki');
  await expect.poll(() => reportAsked).toEqual(['GET ?country=FI']);
  await expect(offer(page)).toHaveCount(0);
  await expect(told(page)).toHaveCount(0);
  await expect(page.locator('[data-report-row], [data-report-summary], [data-report-note]')).toHaveCount(0);
});

test('the offer is a row in a pharmacy’s details: nothing is asked before one is opened, and then only the country is named', async ({ page }) => {
  const asked = await fakeReports(page);
  await start(page, world(kamppi));
  // The search, the card and the list ask nothing about reports, and offer nothing.
  expect(asked.read).toEqual([]);
  await expect(offer(page)).toHaveCount(0);

  await openDetails(page, 'Töölön apteekki');
  await expect(offer(page)).toBeVisible();
  // "Ohita" is in view beside it, and says to a screen reader what it passes over.
  await expect(skip(page)).toBeVisible();
  await expect(skip(page)).toHaveText('Ohita');
  // The row is below the way there: after the route buttons, never above them.
  const route = await details(page).getByRole('link', { name: /Reitti Google Mapsissa/ }).boundingBox();
  const row = await page.locator('[data-report-row]').boundingBox();
  expect(row!.y).toBeGreaterThan(route!.y + route!.height);
  // One request, which names the country and nothing else. No pharmacy, no position.
  expect(asked.read).toEqual(['?country=FI']);

  // Another pharmacy of the same country costs no request.
  await closeDetails(page);
  await openDetails(page, 'Yliopiston apteekki');
  await expect(offer(page)).toBeVisible();
  expect(asked.read).toEqual(['?country=FI']);
  expect(asked.sent).toEqual([]);
});

test('"Ohita" takes the row away, sends nothing, and the same visit is not asked about again', async ({ page }) => {
  const asked = await fakeReports(page);
  await start(page, world(kamppi));
  await openDetails(page, 'Töölön apteekki');
  await skip(page).click();
  await expect(offer(page)).toHaveCount(0);
  await expect(page.locator('[data-report-note]')).toHaveCount(0);
  // The keyboard is not left on a button that is gone.
  await expect(details(page).getByRole('heading', { level: 2 })).toBeFocused();
  expect(asked.sent).toEqual([]);
  // What the device remembers: this pharmacy's id under today's date. Beside the mark that location has worked, nothing else.
  expect(await done(page)).toBe('{"day":"2026-11-23","ids":["n105"]}');
  expect(Object.keys(await page.evaluate(() => ({ ...localStorage }))).sort()).toEqual([LOCATED_KEY, REPORTS_DONE_KEY].sort());

  // Opened again, the same pharmacy has no row; another one has.
  await closeDetails(page);
  await openDetails(page, 'Töölön apteekki');
  await expect(details(page).getByRole('link', { name: /Reitti Google Mapsissa/ })).toBeVisible();
  await expect(offer(page)).toHaveCount(0);
  await closeDetails(page);
  await openDetails(page, 'Yliopiston apteekki');
  await expect(offer(page)).toBeVisible();

  // A visit is a pharmacy and a day: the next day it may be offered again, and yesterday's list is gone.
  await closeDetails(page);
  await page.clock.fastForward(24 * 3600_000);
  await openDetails(page, 'Töölön apteekki');
  await expect(offer(page)).toBeVisible();
  await skip(page).click();
  expect(await done(page)).toBe('{"day":"2026-11-24","ids":["n105"]}');
});

test('one screen of chips: a report carries the pharmacy, its country and the chips pressed, and nothing else', async ({ page }) => {
  const asked = await fakeReports(page);
  await start(page, world(kamppi));
  await openDetails(page, 'Töölön apteekki');
  await offer(page).click();
  await expect(form(page)).toBeVisible();
  await expect(form(page).getByRole('heading', { level: 2 })).toBeFocused();
  await expect(form(page)).toContainText('Töölön apteekki');
  // Chips only: nowhere to type a name, a medicine or anything else.
  await expect(form(page).locator('input, textarea, select, [contenteditable]')).toHaveCount(0);
  await expect(form(page).getByRole('group')).toHaveCount(5);
  await expect(form(page).locator('button[aria-pressed="false"]')).toHaveCount(10);
  // "Ohita" is there beside "Lähetä", and the dialog says what is stored.
  await expect(form(page).getByRole('button', { name: 'Ohita', exact: true })).toBeVisible();
  await expect(form(page)).toContainText('Ilmoitus on nimetön. Siitä tallennetaan apteekki, valintasi ja päivä.');

  // Nothing pressed: it says so and sends nothing.
  await form(page).getByRole('button', { name: 'Lähetä' }).click();
  await expect(form(page).getByRole('status')).toHaveText('Valitse ainakin yksi.');
  expect(asked.sent).toEqual([]);

  // Of a pair at most one is pressed, and a second press takes it back.
  await chip(page, 'Resepti kävi').click();
  await expect(form(page).getByRole('status')).toHaveText('');
  await chip(page, 'Resepti ei käynyt').click();
  await expect(chip(page, 'Resepti kävi')).toHaveAttribute('aria-pressed', 'false');
  await expect(chip(page, 'Resepti ei käynyt')).toHaveAttribute('aria-pressed', 'true');
  await chip(page, 'Lyhyt jono').click();
  await chip(page, 'Englantia puhuttiin').click();
  await chip(page, 'Englantia puhuttiin').click();
  await expect(form(page).locator('button[aria-pressed="true"]')).toHaveCount(2);

  await form(page).getByRole('button', { name: 'Lähetä' }).click();
  await expect(form(page)).toBeHidden();
  expect(asked.sent).toHaveLength(1);
  const [{ url, body, headers }] = asked.sent;
  // The whole body, as text: no day, no time, no position, no language, nothing typed.
  expect(body).toBe('{"pharmacy":"n105","country":"FI","answers":{"prescription":false,"shortWait":true}}');
  expect(new URL(url).search).toBe('');
  expect(carriesPosition([url, body, JSON.stringify(headers)].join('\n'), HERE)).toBe(false);
  expect(headers.cookie).toBeUndefined();

  // Thanks stand where the row was, and the keyboard is on the pharmacy's name.
  await expect(page.locator('[data-report-note]')).toHaveText('Kiitos. Ilmoituksesi on tallennettu.');
  await expect(offer(page)).toHaveCount(0);
  await expect(details(page).getByRole('heading', { level: 2 })).toBeFocused();
  expect(await done(page)).toBe('{"day":"2026-11-23","ids":["n105"]}');
  // The answers themselves are kept nowhere on the device.
  const kept = await page.evaluate(() => JSON.stringify([{ ...localStorage }, { ...sessionStorage }, document.cookie]));
  expect(kept).not.toContain('shortWait');
  expect(kept).not.toContain('prescription');
});

test('closing the dialog sends nothing and keeps the offer; "Ohita" in it passes the visit over', async ({ page }) => {
  const asked = await fakeReports(page);
  await start(page, world(kamppi));
  await openDetails(page, 'Töölön apteekki');
  await offer(page).click();
  await chip(page, 'Lääke oli varastossa').click();
  await page.keyboard.press('Escape');
  await expect(form(page)).toBeHidden();
  // The details stay open under it, the row is still there, and the keyboard is back on it.
  await expect(details(page).getByRole('heading', { level: 2 })).toHaveText('Töölön apteekki');
  await expect(offer(page)).toBeFocused();
  expect(await done(page)).toBeNull();

  // Opened again it starts empty: what was pressed did not outlive the dialog.
  await offer(page).click();
  await expect(form(page).locator('button[aria-pressed="true"]')).toHaveCount(0);
  await form(page).getByRole('button', { name: 'Ohita', exact: true }).click();
  await expect(form(page)).toBeHidden();
  await expect(offer(page)).toHaveCount(0);
  expect(asked.sent).toEqual([]);
  expect(await done(page)).toBe('{"day":"2026-11-23","ids":["n105"]}');
});

test('a sending that fails keeps the chips and can be tried again', async ({ page }) => {
  const asked = await fakeReports(page, {}, (nth) => (nth === 1 ? 503 : 201));
  await start(page, world(kamppi));
  await openDetails(page, 'Töölön apteekki');
  await offer(page).click();
  await chip(page, 'Esteetön sisäänkäynti').click();
  await form(page).getByRole('button', { name: 'Lähetä' }).click();
  await expect(form(page).getByRole('status')).toHaveText('Lähetys ei onnistunut. Yritä uudelleen.');
  await expect(chip(page, 'Esteetön sisäänkäynti')).toHaveAttribute('aria-pressed', 'true');
  // Nothing is marked as done by a report that did not arrive.
  expect(await done(page)).toBeNull();

  await form(page).getByRole('button', { name: 'Lähetä' }).click();
  await expect(form(page)).toBeHidden();
  await expect(page.locator('[data-report-note]')).toHaveText('Kiitos. Ilmoituksesi on tallennettu.');
  expect(asked.sent.map((sent) => sent.body)).toEqual(['{"pharmacy":"n105","country":"FI","answers":{"stepFree":true}}', '{"pharmacy":"n105","country":"FI","answers":{"stepFree":true}}']);
});

test('over the day’s limit the app says that the report was not stored, and does not offer again', async ({ page }) => {
  await fakeReports(page, {}, 429);
  await start(page, world(kamppi));
  await openDetails(page, 'Töölön apteekki');
  await offer(page).click();
  await chip(page, 'Pitkä jono').click();
  await form(page).getByRole('button', { name: 'Lähetä' }).click();
  await expect(form(page)).toBeHidden();
  await expect(page.locator('[data-report-note]')).toHaveText('Tästä apteekista on tänään jo paljon ilmoituksia, joten tätä ei tallennettu.');
  await expect(offer(page)).toHaveCount(0);
});

test('what others told is shown from three reports on, with the count and the days', async ({ page }) => {
  // The last one should never leave the server. If it did, the page still shows nothing of it.
  await fakeReports(page, { n105: FIVE, n102: { ...FIVE, count: 2 } });
  await start(page, world(kamppi));
  await openDetails(page, 'Töölön apteekki');
  await expect(told(page)).toBeVisible();
  await expect(told(page).getByRole('heading', { level: 3 })).toHaveText('Kävijöiden ilmoituksia');
  await expect(told(page)).toContainText('5 ilmoitusta, 12.11.2026–23.11.2026. Nimettömiä, ei tarkistettuja.');
  await expect(told(page).locator('dt')).toHaveText(['Resepti', 'Englanti', 'Jono']);
  await expect(told(page).locator('dd')).toHaveText(['Kävi 3, ei käynyt 1', 'Puhuttiin 4, ei puhuttu 0', 'Lyhyt 2, pitkä 2']);
  // The offer is under it.
  await expect(offer(page)).toBeVisible();

  await closeDetails(page);
  await openDetails(page, 'Yliopiston apteekki');
  await expect(details(page).getByRole('link', { name: /Reitti Google Mapsissa/ })).toBeVisible();
  await expect(offer(page)).toBeVisible();
  await expect(told(page)).toHaveCount(0);
});

test('in English, on the example data of /dev/states', async ({ page }) => {
  await page.goto('/en/dev/states/report-summary');
  const region = page.getByRole('region', { name: 'What visitors have reported' });
  await expect(region).toContainText('5 reports, 12 Nov 2026 – 26 Nov 2026. Anonymous and not verified.');
  await expect(region.locator('dd').first()).toHaveText('Accepted 3, not accepted 1');
  await expect(page.getByRole('button', { name: 'Been here? Say how it went' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Skip the question about your visit/ })).toHaveText('Skip');
});
