import type { Page } from '@playwright/test';
import { kamppi } from '@/lib/fixtures/tiles';
import { LOCATED_KEY } from '@/lib/geolocation';
import { LAST_DETAIL_KEY, LAST_SEARCH_KEY } from '@/lib/session';
import type { TilePharmacy } from '@/lib/tiles';
import { expect, test } from './fixtures';
import { HERE, fakeLocation, fakeWalking, settle, start, world } from './helpers';

/**
 * A tab that is loaded again shows the results it had (PLAN.md section 5, "First visit"): after
 * a route in a map app during which the phone threw the tab away, a change of language, a look
 * at the data page. The tab keeps its last search in its own session storage (lib/session.ts);
 * these tests hold what is kept, what it brings back, and when it is let go.
 */

const rows = (page: Page) => page.locator('ol > li h3');
const isAt = (place: { lat: number; lon: number }, pharmacy: TilePharmacy) => Math.abs(place.lat - pharmacy.lat) < 1e-5 && Math.abs(place.lon - pharmacy.lon) < 1e-5;
const [kampin] = kamppi;
// The nearest by straight line is across the tracks, sixteen minutes on foot: the list's order shows whether the walking times are there.
const acrossTheTracks = (_from: unknown, to: { lat: number; lon: number }) => (isAt(to, kampin) ? { meters: 1300, seconds: 936 } : undefined);
const WALKING_ORDER = ['Hietalahden apteekki', 'Apteekki Runeberginkatu 6', 'Töölön apteekki', 'Kampin apteekki', 'Kruununhaan apteekki'];
const kept = (page: Page) => page.evaluate(() => [{ ...localStorage }, Object.keys(sessionStorage).sort(), document.cookie] as const);

test('a tab that is loaded again shows the results it had, without asking for the position or the walking times again', async ({ page }) => {
  const asked = await fakeWalking(page, acrossTheTracks);
  await start(page, world(kamppi));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  await expect(rows(page)).toHaveText(WALKING_ORDER);
  expect(asked).toHaveLength(1);

  // What the visit has left on the device: the mark of a first visit, and this tab's last search. No cookie.
  expect(await kept(page)).toEqual([{ [LOCATED_KEY]: '1' }, [LAST_SEARCH_KEY], '']);
  const search = JSON.parse(await page.evaluate((key) => sessionStorage.getItem(key) ?? '', LAST_SEARCH_KEY));
  expect(Object.keys(search).sort()).toEqual(['at', 'fixedAt', 'position', 'walks']);
  expect(search.position).toEqual({ source: 'device', ...HERE, accuracy: 25, approximate: false });

  // From here on the browser refuses the position: results that come now were not located again.
  await fakeLocation(page, 'deny', 'denied');
  await page.reload();
  await settle(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  // The same order as before: the walking times came back with the search, and no request was made for them.
  await expect(rows(page)).toHaveText(WALKING_ORDER);
  await expect(page.getByText('Etäisyydet ovat kävelyreittejä.')).toBeVisible();
  expect(asked).toHaveLength(1);
});

test('the pharmacy whose details were open is open again', async ({ page }) => {
  await fakeWalking(page, acrossTheTracks);
  await start(page, world(kamppi));
  await page.getByRole('button', { name: 'Töölön apteekki' }).first().click();
  const details = page.getByRole('dialog');
  await expect(details.getByRole('heading', { level: 2 })).toHaveText('Töölön apteekki');
  expect((await kept(page))[1]).toEqual([LAST_DETAIL_KEY, LAST_SEARCH_KEY]);

  await page.reload();
  await settle(page);
  await expect(details.getByRole('heading', { level: 2 })).toHaveText('Töölön apteekki');

  // Closed, they stay closed.
  await page.keyboard.press('Escape');
  await expect(details).toBeHidden();
  expect((await kept(page))[1]).toEqual([LAST_SEARCH_KEY]);
  await page.reload();
  await settle(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  await expect(details).toBeHidden();
});

test('a change of language keeps the results', async ({ page }) => {
  const asked = await fakeWalking(page, acrossTheTracks);
  await start(page, world(kamppi));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  // The link is "In English" on a wide screen and the round "EN" on a phone: both end in these words.
  await page.getByRole('link', { name: /In English$/ }).first().click();
  await page.waitForURL('**/en');
  await settle(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 pharmacies open right now');
  // The same walking order, each name in the page's new language.
  await expect(rows(page)).toHaveText(WALKING_ORDER.map((name) => name.replace('Apteekki Runeberginkatu', 'Pharmacy Runeberginkatu')));
  expect(asked).toHaveLength(1);
});

test('half an hour later the tab does not bring the old search back: it locates again', async ({ page }) => {
  const asked = await fakeWalking(page, acrossTheTracks);
  await start(page, world(kamppi));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
  await page.clock.fastForward('28:00');
  await page.reload();
  await settle(page);
  // The search is the old one, and the statuses are those of this minute: at 21.10 one of the two has closed.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Yksi apteekki auki juuri nyt');
  await expect(rows(page)).toHaveText(WALKING_ORDER);
  expect(asked).toHaveLength(1);

  // The half hour counts from the position, not from the last time the tab was loaded.
  await page.clock.fastForward('02:00');
  await page.reload();
  await settle(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Yksi apteekki auki juuri nyt');
  // A new search: the position was asked for again, and so were the walking times.
  await expect.poll(() => asked.length).toBe(2);
  const fixedAt = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? '{}').fixedAt as number, LAST_SEARCH_KEY);
  expect(new Date(fixedAt).toISOString()).toMatch(/T19:11:0\d/);
});

test('leaving the results forgets them', async ({ page }) => {
  await fakeWalking(page, acrossTheTracks);
  await start(page, world(kamppi));
  await page.getByRole('button', { name: 'Töölön apteekki' }).first().click();
  await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toHaveText('Töölön apteekki');
  expect((await kept(page))[1]).toEqual([LAST_DETAIL_KEY, LAST_SEARCH_KEY]);
  await page.goBack();
  await expect(page.getByRole('button', { name: 'Näytä apteekit lähelläni' })).toBeVisible();
  expect(await kept(page)).toEqual([{ [LOCATED_KEY]: '1' }, [], '']);
});

test('a search that found nothing is not kept', async ({ page }) => {
  await start(page, world([]));
  await expect(page.getByRole('heading', { name: 'OpenStreetMapissa ei ole apteekkeja 50 kilometrin säteellä' })).toBeVisible();
  expect((await kept(page))[1]).toEqual([]);
});
