import type { Locator, Page } from '@playwright/test';
import { farOpen, kamppi, kamppiClosed } from '@/lib/fixtures/tiles';
import type { TilePharmacy } from '@/lib/tiles';
import { expect, test } from './fixtures';
import { fakeReports, settle, start, world } from './helpers';

/**
 * The phone's bottom sheet (PLAN.md section 5). It rests in three places: on one row, so
 * that the map has the screen; at the card; and open, with the list. It gets from one to
 * the next by its handle, by "Kaikki N apteekkia" and by dragging.
 *
 * The pharmacies come from fixture tiles and the page's clock is the test's: Monday
 * 23 November 2026 at 20:41 in Helsinki. The sheet itself glides in real time.
 */

test.use({ viewport: { width: 390, height: 844 } });

const SCREEN = 844;
/** The handle's name says what a press does, and so where the sheet is. */
const AT = { peek: 'Näytä lisää', half: 'Näytä lista', expanded: 'Pienennä lista' } as const;
type Place = keyof typeof AT;

const handle = (page: Page) => page.locator('[data-grab]');
const rows = (page: Page) => page.locator('ol > li h3');
/** The row the sheet shows at its lowest. Its heading is for screen readers; the card under it has the same one. */
const row = (page: Page, label = 'Lähin auki nyt') => page.locator('section', { has: page.getByRole('heading', { name: label, level: 2 }) }).first();
const card = (page: Page, label = 'Lähin auki nyt') => page.locator('section', { has: page.getByRole('heading', { name: label, level: 2 }) }).last();
const allButton = (page: Page) => page.getByRole('button', { name: /^Kaikki \d+ apteekkia$/ });

/** The sheet glides to its place in real time: where the handle is once it has stopped moving. */
async function rest(target: Locator): Promise<{ x: number; y: number }> {
  let box = (await target.boundingBox())!;
  for (let tries = 0; tries < 40; tries++) {
    await target.page().waitForTimeout(120);
    const next = (await target.boundingBox())!;
    const still = Math.abs(next.y - box.y) < 0.5;
    box = next;
    if (still) break;
  }
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function expectAt(page: Page, place: Place) {
  await expect(handle(page)).toHaveAccessibleName(AT[place]);
  await expect(handle(page)).toHaveAttribute('aria-expanded', String(place !== 'peek'));
}

/**
 * Drags with the mouse from a point, down by `by` pixels (up when negative).
 * 'held': it is held still before it is let go, so where it is let go decides.
 * 'thrown': it is let go while it still moves, so the way it moves decides.
 *
 * The page's clock is the test's, and an event's time is read from it: time passes
 * between two events only when the test lets it.
 */
async function drag(page: Page, from: { x: number; y: number }, by: number, how: 'held' | 'thrown' = 'held') {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  if (how === 'thrown') {
    await page.mouse.move(from.x, from.y + Math.sign(by) * 10);
    // One frame later it is already far on, and then it is let go.
    await page.clock.runFor(16);
    await page.mouse.move(from.x, from.y + by);
  } else {
    for (let step = 1; step <= 8; step++) {
      await page.clock.runFor(16);
      await page.mouse.move(from.x, from.y + (by * step) / 8);
    }
    await page.clock.runFor(200);
    await page.mouse.move(from.x, from.y + by + Math.sign(by));
  }
  await page.mouse.up();
}

test('at its lowest the sheet is one row: the nearest open pharmacy, how far, its status, and the route', async ({ page }) => {
  await start(page, world(kamppi));
  await expectAt(page, 'peek');
  const answer = row(page);
  await expect(answer.getByRole('heading', { level: 3 })).toHaveText('Kampin apteekki');
  await expect(answer).toContainText('130 m');
  await expect(answer).toContainText('Sulkeutuu pian, klo 21');
  // One row and the handle: the map has the rest of the screen.
  const top = (await rest(handle(page))).y;
  expect(SCREEN - top).toBeLessThan(110);
  // The card and the list are not there yet, for the eye or for a screen reader.
  await expect(allButton(page)).toBeHidden();
  await expect(rows(page).first()).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Lähin auki nyt', level: 2 })).toHaveCount(1);

  // The row's one button is the route: it opens the pharmacy, where the map apps are.
  await answer.getByRole('button', { name: 'Reitti kävellen: Kampin apteekki' }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toHaveText('Kampin apteekki');
});

test('the handle goes one place up at a time, and from the list back down', async ({ page }) => {
  await start(page, world(kamppi));
  const low = (await rest(handle(page))).y;

  // The card: everything about the nearest one, and the way to the list under it.
  await handle(page).click();
  await expectAt(page, 'half');
  const middle = (await rest(handle(page))).y;
  await expect(card(page).getByRole('heading', { level: 3 })).toHaveText('Kampin apteekki');
  await expect(card(page).getByRole('link', { name: 'Soita: Kampin apteekki' })).toBeInViewport();
  await expect(allButton(page)).toBeInViewport();
  await expect(allButton(page)).toHaveText('Kaikki 6 apteekkia');
  // The list waits below: not to be seen, and not to be reached by the keyboard or a screen reader.
  await expect(rows(page).first()).toBeHidden();
  // The row has given way to the card: the pharmacy is named once.
  await expect(page.getByRole('heading', { name: 'Kampin apteekki', level: 3 })).toHaveCount(1);
  // Never more than 60 % of the screen, and clearly more than the row. The handle's middle is 13 px under the sheet's top.
  expect(SCREEN - middle + 13).toBeLessThanOrEqual(SCREEN * 0.6 + 1);
  expect(low - middle).toBeGreaterThanOrEqual(120);

  // The list: nearly the whole screen, under the bar.
  await handle(page).click();
  await expectAt(page, 'expanded');
  const high = (await rest(handle(page))).y;
  expect(high).toBeLessThan(110);
  await expect(rows(page)).toHaveCount(5);
  await expect(rows(page).first()).toBeInViewport();
  await expect(allButton(page)).toBeHidden();
  await expect(page.getByRole('button', { name: /Hae toinen paikka/ }).first()).toBeInViewport();

  // And down again, to the row.
  await handle(page).click();
  await expectAt(page, 'peek');
  expect(Math.abs((await rest(handle(page))).y - low)).toBeLessThan(2);
  await expect(rows(page).first()).toBeHidden();
});

test('"Kaikki 6 apteekkia" under the card opens the list', async ({ page }) => {
  await start(page, world(kamppi));
  await handle(page).click();
  await expectAt(page, 'half');
  await rest(handle(page));
  await allButton(page).click();
  await expectAt(page, 'expanded');
  await rest(handle(page));
  await expect(rows(page).first()).toBeInViewport();
  // The button has gone, and focus with it to what it promised: the first pharmacy of the list.
  await expect(allButton(page)).toBeHidden();
  await expect(page.locator('ol > li h3 button').first()).toBeFocused();
  await expect(rows(page)).toHaveText(['Yliopiston apteekki', 'Hietalahden apteekki', 'Apteekki Runeberginkatu 6', 'Töölön apteekki', 'Kruununhaan apteekki']);
});

test('the sheet follows a drag between its three places, and settles on the nearest', async ({ page }) => {
  await start(page, world(kamppi));
  // Where the three places are, learnt from the handle.
  const low = (await rest(handle(page))).y;
  await handle(page).click();
  const middle = (await rest(handle(page))).y;
  await handle(page).click();
  const high = (await rest(handle(page))).y;
  await handle(page).click();
  await expectAt(page, 'peek');
  const lower = low - middle;
  const upper = middle - high;

  // Up by most of the way to the card: it settles there.
  await drag(page, await rest(handle(page)), -lower * 0.7);
  await expectAt(page, 'half');
  expect(Math.abs((await rest(handle(page))).y - middle)).toBeLessThan(2);
  await expect(card(page).getByRole('heading', { level: 3 })).toBeInViewport();
  // On to the list.
  await drag(page, await rest(handle(page)), -upper * 0.7);
  await expectAt(page, 'expanded');
  await expect(rows(page).first()).toBeInViewport();
  // A short drag doesn't count: it settles back where it was.
  await drag(page, await rest(handle(page)), 50);
  await expectAt(page, 'expanded');
  expect(Math.abs((await rest(handle(page))).y - high)).toBeLessThan(2);
  // Down to the card, and down to the row.
  await drag(page, await rest(handle(page)), upper * 0.7);
  await expectAt(page, 'half');
  await drag(page, await rest(handle(page)), lower * 0.7);
  await expectAt(page, 'peek');
  expect(Math.abs((await rest(handle(page))).y - low)).toBeLessThan(2);
  await expect(rows(page).first()).toBeHidden();

  // In one pull from the row to the list, past the card.
  await drag(page, await rest(handle(page)), -(low - high) - 40);
  await expectAt(page, 'expanded');
  // And in one from the list to the row.
  await drag(page, await rest(handle(page)), low - high + 40);
  await expectAt(page, 'peek');
});

test('below the open list the whole sheet is the handle, and a drag by a button is not a press of it', async ({ page }) => {
  await start(page, world(kamppi));
  const low = (await rest(handle(page))).y;
  await handle(page).click();
  const middle = (await rest(handle(page))).y;
  await handle(page).click();
  await handle(page).click();
  await expectAt(page, 'peek');
  await rest(handle(page));

  // By the pharmacy's name in the row.
  await drag(page, await rest(row(page).getByRole('heading', { level: 3 })), -(low - middle) * 0.7);
  await expectAt(page, 'half');
  await rest(handle(page));
  // By the card.
  await drag(page, await rest(card(page).getByRole('heading', { level: 3 })), (low - middle) * 0.7);
  await expectAt(page, 'peek');
  await rest(handle(page));
  // By the route button: the sheet moves, and the pharmacy's own sheet does not open.
  await drag(page, await rest(row(page).getByRole('button', { name: 'Reitti kävellen: Kampin apteekki' })), -(low - middle) * 0.7);
  await expectAt(page, 'half');
  await expect(page.getByRole('dialog')).toBeHidden();
  // The same by the card's route button, a short way: the mouse lets go over the button it pressed, and that is still not a press.
  const route = card(page).getByRole('button', { name: 'Reitti kävellen: Kampin apteekki' });
  await drag(page, await rest(route), 40);
  await expectAt(page, 'half');
  await rest(handle(page));
  await expect(page.getByRole('dialog')).toBeHidden();
  // By a link: a browser would let the mouse pick a link up and carry it off, and the sheet would stay behind.
  await drag(page, await rest(card(page).getByRole('link', { name: 'Soita: Kampin apteekki' })), (low - middle) * 0.7);
  await expectAt(page, 'peek');
  await rest(handle(page));
  // Nothing was selected on the way: the next drag by the same text is a drag again.
  expect(await page.evaluate(() => String(window.getSelection()))).toBe('');
  await drag(page, await rest(row(page).getByRole('heading', { level: 3 })), -(low - middle) * 0.7);
  await expectAt(page, 'half');
  await rest(handle(page));
  // A plain press of the route button works as ever.
  await route.click();
  await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toHaveText('Kampin apteekki');
});

test('thrown, the sheet goes one place the way it was thrown', async ({ page }) => {
  await start(page, world(kamppi));
  const low = (await rest(handle(page))).y;
  await handle(page).click();
  const middle = (await rest(handle(page))).y;
  await handle(page).click();
  await handle(page).click();
  await expectAt(page, 'peek');
  // Less than half the way to the card: let go at rest it would fall back. Thrown, it goes on.
  const flick = Math.min(80, (low - middle) * 0.3);
  await drag(page, await rest(handle(page)), -flick, 'thrown');
  await expectAt(page, 'half');
  expect(Math.abs((await rest(handle(page))).y - middle)).toBeLessThan(2);
  await drag(page, await rest(handle(page)), flick, 'thrown');
  await expectAt(page, 'peek');
  // The same short way, held still before it is let go: back where it was.
  await drag(page, await rest(handle(page)), -flick);
  await expectAt(page, 'peek');
  expect(Math.abs((await rest(handle(page))).y - low)).toBeLessThan(2);
});

test('a control under the edge of the screen opens the sheet when it takes focus: nothing focused is out of sight', async ({ page, browserName }) => {
  // A short screen: the card is taller than the 60 % the sheet may take, and its last link lies under the edge.
  await page.setViewportSize({ width: 390, height: 480 });
  await start(page, world(kamppi));
  await handle(page).click();
  await expectAt(page, 'half');
  await rest(handle(page));
  await expect(rows(page).first()).toBeHidden();
  const next = card(page).getByRole('button', { name: /^Ei varastossa\? Seuraava auki Yliopiston apteekki/ });
  const link = (await next.boundingBox())!;
  expect(link.y + link.height).toBeGreaterThan(480);
  await next.focus();
  await expectAt(page, 'expanded');
  await rest(handle(page));
  await expect(next).toBeFocused();
  await expect(next).toBeInViewport();
  // The view itself has not moved: the bar is where it was.
  expect((await page.getByRole('button', { name: /Hae toinen paikka/ }).first().boundingBox())!.y).toBeLessThan(80);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  // The same for "Kaikki 6 apteekkia" under the edge. It goes away as the list opens, so the list it promised takes the focus.
  await handle(page).click();
  await handle(page).click();
  await expectAt(page, 'half');
  await rest(handle(page));
  const more = (await allButton(page).boundingBox())!;
  expect(more.y).toBeGreaterThan(480);
  await allButton(page).focus();
  await expectAt(page, 'expanded');
  await rest(handle(page));
  const first = page.locator('ol > li h3 button').first();
  await expect(first).toBeFocused();
  await expect(first).toBeInViewport();
  // In the open list the button can't be reached at all: Tab from the card's last control goes to the list.
  // That control is the row of the next open pharmacy: the medicine search is one of the main actions above it.
  await next.focus();
  // Safari's Tab stops at text fields only, unless Option is held: that is its default, and WebKit's here.
  const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  // Over the list stand its two filters; the first pharmacy is the third stop.
  await page.keyboard.press(tab);
  await expect(page.getByRole('button', { name: 'Englantia puhuttiin' })).toBeFocused();
  await page.keyboard.press(tab);
  await page.keyboard.press(tab);
  await expect(first).toBeFocused();
});

test('hours unknown nearby: the row is the nearest pharmacy, and its button is the call', async ({ page }) => {
  // Hours coverage (provisional). Around Kamppi nothing has opening hours; the one pharmacy known to be open is 14 km away.
  const unlisted = kamppi.map((pharmacy): TilePharmacy => ({ ...pharmacy, hours: { kind: 'missing' } }));
  await start(page, world([...unlisted, farOpen]));
  await expectAt(page, 'peek');
  const answer = row(page, 'Lähin apteekki');
  await expect(answer.getByRole('heading', { level: 3 })).toHaveText('Kampin apteekki');
  await expect(answer).toContainText('130 m');
  await expect(answer).toContainText('Aukioloaikoja ei ole merkitty');
  await expect(answer.getByRole('link', { name: 'Soita: Kampin apteekki' })).toHaveAttribute('href', 'tel:+35891234501');
  // The one known to be open is not in the row any more: it is a line of the card, one place up.
  await expect(answer).not.toContainText('Jumbon apteekki');
  await handle(page).click();
  await expectAt(page, 'half');
  await expect(card(page, 'Lähin apteekki')).toContainText('Lähin, jonka tiedetään olevan auki Jumbon apteekki');
});

test('nothing open: the sheet starts at the card, with 112 in view, and the row keeps the number', async ({ page }) => {
  await start(page, world(kamppiClosed));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lähistöllä ei ole yhtään apteekkia auki');
  // No row first here: the card says what opens first, and keeps the emergency number prominent.
  await expectAt(page, 'half');
  await rest(handle(page));
  const first = card(page, 'Avautuu ensimmäisenä');
  await expect(first.getByRole('heading', { level: 3 })).toHaveText('Kampin apteekki');
  await expect(first.getByText('Hätätilanteessa soita 112.')).toBeInViewport();
  await expect(first.getByRole('link', { name: '112' })).toHaveAttribute('href', 'tel:112');

  // Pulled down to the row, for the map: no route to a closed door, and 112 is the row's button.
  await handle(page).click();
  await handle(page).click();
  await expectAt(page, 'peek');
  const answer = row(page, 'Avautuu ensimmäisenä');
  await expect(answer.getByRole('heading', { level: 3 })).toHaveText('Kampin apteekki');
  await expect(answer).toContainText('Kiinni, avautuu huomenna klo 9');
  await expect(answer.getByRole('link', { name: 'Hätätilanteessa soita 112.' })).toHaveAttribute('href', 'tel:112');
  await expect(answer.getByRole('button', { name: /reitti/i })).toHaveCount(0);
});

/**
 * A finger on the screen, through Chromium's DevTools: down at a point, moved by `by` pixels
 * (up when negative) a frame at a time, held still, lifted. Where it is lifted decides.
 */
async function finger(page: Page, from: { x: number; y: number }, by: number) {
  const devtools = await page.context().newCDPSession(page);
  const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', y?: number) =>
    devtools.send('Input.dispatchTouchEvent', { type, touchPoints: y === undefined ? [] : [{ x: Math.round(from.x), y: Math.round(y) }] });
  await touch('touchStart', from.y);
  for (let step = 1; step <= 8; step++) {
    await page.clock.runFor(16);
    await touch('touchMove', from.y + (by * step) / 8);
  }
  await page.clock.runFor(200);
  await touch('touchMove', from.y + by + Math.sign(by));
  await touch('touchEnd');
  await devtools.detach();
}

/**
 * A pharmacy's details in the phone's sheet (Janne's iPhone, 25 Nov 2026: they opened at full
 * height, the map was gone, and a drag down did not close them). They behave like a place card
 * in Apple Maps: open at a middle height with the map and the marker in view above them, down
 * to the row they close, and their content scrolls only when the sheet is fully up.
 */
test.describe('a pharmacy’s details in the sheet', () => {
  test.use({ hasTouch: true });

  const details = (page: Page) => page.getByRole('dialog');
  const route = (page: Page) => row(page).getByRole('button', { name: 'Reitti kävellen: Kampin apteekki' });
  const scrolled = (page: Page) => handle(page).evaluate((element) => element.nextElementSibling!.scrollTop);

  test('they open at a middle height: the map and the pharmacy’s marker stay in view above them, and the map still moves', async ({ page }) => {
    await start(page, world(kamppi));
    await expectAt(page, 'peek');
    await route(page).click();
    await expect(details(page).getByRole('heading', { level: 2 })).toHaveText('Kampin apteekki');
    await expect(details(page).getByRole('heading', { level: 2 })).toBeFocused();
    // The handle now says what a press does to the details.
    await expect(handle(page)).toHaveAccessibleName('Näytä lisää');
    const top = (await rest(handle(page))).y - 13;
    // Never more than 60 % of the screen, and down to the first route button.
    expect(top).toBeGreaterThanOrEqual(SCREEN * 0.4 - 1);
    await expect(details(page).getByRole('link', { name: 'Reitti Google Mapsissa' })).toBeInViewport({ ratio: 1 });
    // The marker of the pharmacy is on the map above the sheet, clear of the bar.
    await settle(page);
    const marker = (await page.getByRole('region', { name: /^Kartta/ }).getByRole('button', { name: /^Kampin apteekki/ }).boundingBox())!;
    expect(marker.y + marker.height / 2).toBeLessThan(top);
    expect(marker.y + marker.height / 2).toBeGreaterThan(76);
    // Nothing lies over the map: another marker can be pressed, and the details are that pharmacy's.
    await page.getByRole('region', { name: /^Kartta/ }).getByRole('button', { name: /^Yliopiston apteekki/ }).click();
    await expect(details(page).getByRole('heading', { level: 2 })).toHaveText('Yliopiston apteekki');
    await expect(handle(page)).toHaveAccessibleName('Näytä lisää');
  });

  test('a press on the card’s name opens them as a row of the list does, and closed they give the card back', async ({ page }) => {
    await fakeReports(page);
    await start(page, world(kamppi));
    await handle(page).click();
    await expectAt(page, 'half');
    await rest(handle(page));
    const name = card(page).getByRole('button', { name: 'Kampin apteekki', exact: true });
    await name.click();
    const heading = details(page).getByRole('heading', { level: 2 });
    await expect(heading).toHaveText('Kampin apteekki');
    await expect(heading).toBeFocused();
    // At the middle, like the details of any pharmacy: the map stays in view above them.
    await expect(handle(page)).toHaveAccessibleName('Näytä lisää');
    await rest(handle(page));
    // What the card has no room for: the week's hours, the contacts, both map apps, the medicine search, the report row.
    await expect(details(page).getByText('Joka päivä 8.00–21.00')).toBeVisible();
    await expect(details(page).getByRole('link', { name: 'kamppi@apteekki.example' })).toHaveCount(1);
    await expect(details(page).getByRole('link', { name: /Reitti Google Mapsissa/ })).toBeInViewport({ ratio: 1 });
    await expect(details(page).getByRole('link', { name: /Reitti Apple Kartoissa/ })).toHaveCount(1);
    await expect(details(page).getByRole('button', { name: /^Tarkista lääkkeen saatavuus/ })).toHaveCount(1);
    await expect(details(page).getByRole('button', { name: 'Kävitkö täällä? Kerro, miten meni' })).toHaveCount(1);
    // Closed, the sheet is at the card again, and the keyboard is back on the name that opened them.
    await details(page).getByRole('button', { name: 'Sulje' }).click();
    await expect(details(page)).toBeHidden();
    await expectAt(page, 'half');
    await expect(name).toBeFocused();
  });

  test('the status line under the card’s name belongs to the same press', async ({ page }) => {
    // Without the pharmacy that closes at nine, the nearest open one is open until midnight: its card has a status line and no timeline.
    await start(page, world(kamppi.slice(1)));
    await handle(page).click();
    await expectAt(page, 'half');
    await rest(handle(page));
    await expect(card(page).getByRole('heading', { level: 3 })).toHaveText('Yliopiston apteekki');
    const status = (await card(page).getByText('Auki klo 24 asti', { exact: true }).boundingBox())!;
    await page.mouse.click(status.x + status.width / 2, status.y + status.height / 2);
    await expect(details(page).getByRole('heading', { level: 2 })).toHaveText('Yliopiston apteekki');
    // The card's own buttons are still their own: the head's hit area ends above them.
    await page.keyboard.press('Escape');
    await expect(details(page)).toBeHidden();
    await card(page).getByRole('link', { name: 'Soita: Yliopiston apteekki' }).click({ trial: true });
  });

  test('the close button and Escape bring back what the sheet showed before: the row, or the list where it was', async ({ page }) => {
    // A short screen, so that the list of six is longer than the open sheet.
    await page.setViewportSize({ width: 390, height: 560 });
    await start(page, world(kamppi));
    await route(page).click();
    await expect(details(page)).toBeVisible();
    await details(page).getByRole('button', { name: 'Sulje' }).click();
    await expect(details(page)).toBeHidden();
    await expectAt(page, 'peek');
    // Focus is back on what opened them.
    await expect(route(page)).toBeFocused();

    // From the open list, scrolled: the details come at the middle, and the list comes back as it was.
    await handle(page).click();
    await handle(page).click();
    await expectAt(page, 'expanded');
    await rest(handle(page));
    const last = rows(page).last();
    await last.scrollIntoViewIfNeeded();
    // Where the list stands at the moment its row is pressed: the press itself may still bring the row a little further in.
    await handle(page).evaluate((element) => {
      const scroller = element.nextElementSibling!;
      document.addEventListener('click', () => ((window as unknown as { pressedAt: number }).pressedAt = scroller.scrollTop), { capture: true, once: true });
    });
    await last.click();
    const before = await page.evaluate(() => (window as unknown as { pressedAt: number }).pressedAt);
    expect(before).toBeGreaterThan(0);
    await expect(details(page)).toBeVisible();
    await expect(handle(page)).toHaveAccessibleName('Näytä lisää');
    await page.keyboard.press('Escape');
    await expect(details(page)).toBeHidden();
    await expectAt(page, 'expanded');
    await expect.poll(() => scrolled(page)).toBe(before);
  });

  test('the handle takes them fully up and back to the middle', async ({ page }) => {
    await start(page, world(kamppi));
    await route(page).click();
    const middle = (await rest(handle(page))).y;
    await handle(page).click();
    await expect(handle(page)).toHaveAccessibleName('Näytä vähemmän');
    const high = (await rest(handle(page))).y;
    expect(high).toBeLessThan(middle - 100);
    await expect(details(page)).toBeVisible();
    await handle(page).click();
    await expect(handle(page)).toHaveAccessibleName('Näytä lisää');
    expect(Math.abs((await rest(handle(page))).y - middle)).toBeLessThan(2);
  });

  test('a finger drags them down to the row, and that closes them; up, and they are fully open', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Playwright moves a finger across the screen only through Chromium DevTools.');
    await start(page, world(kamppi));
    const low = (await rest(handle(page))).y;
    await route(page).click();
    await expect(details(page)).toBeVisible();
    const middle = (await rest(handle(page))).y;

    // A short way down and it comes back: still the details, still at the middle.
    await finger(page, await rest(details(page).getByRole('heading', { level: 2 })), (low - middle) * 0.3);
    await expect(details(page)).toBeVisible();
    expect(Math.abs((await rest(handle(page))).y - middle)).toBeLessThan(2);
    // Most of the way down, by the details themselves: the row is back, and the details are closed.
    await finger(page, await rest(details(page).getByRole('heading', { level: 2 })), (low - middle) * 0.7);
    await expect(details(page)).toBeHidden();
    await expectAt(page, 'peek');
    expect(Math.abs((await rest(handle(page))).y - low)).toBeLessThan(2);

    // Up from the middle: fully open.
    await route(page).click();
    await rest(handle(page));
    await finger(page, await rest(details(page).getByRole('heading', { level: 2 })), -(middle - 101) * 0.7);
    await expect(handle(page)).toHaveAccessibleName('Näytä vähemmän');
    await expect(details(page)).toBeVisible();
    expect(await page.evaluate(() => [window.scrollY, window.visualViewport?.scale])).toEqual([0, 1]);
  });

  test('at the middle nothing in them scrolls; fully up they scroll, and from their top a pull down takes the sheet down', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Playwright moves a finger across the screen only through Chromium DevTools.');
    await start(page, world(kamppi));
    await route(page).click();
    await expect(details(page)).toBeVisible();
    const middle = (await rest(handle(page))).y;
    await handle(page).click();
    const high = (await rest(handle(page))).y;
    const text = details(page).getByText('Aukioloajat');

    // Fully up: a finger that moves up scrolls the content, and the sheet stays.
    await finger(page, await rest(text), -160);
    expect(await scrolled(page)).toBeGreaterThan(20);
    expect(Math.abs((await rest(handle(page))).y - high)).toBeLessThan(2);
    // Not at its top: a long pull down scrolls it back to its top and no further, and the sheet still stays.
    await finger(page, { x: 195, y: 300 }, (middle - high) * 0.7);
    expect(await scrolled(page)).toBe(0);
    expect(Math.abs((await rest(handle(page))).y - high)).toBeLessThan(2);
    // (The test's finger is faster than any thumb: the browser lets the content glide on for a moment, and that glide is its own.)
    await page.waitForTimeout(700);
    // At its top: the same pull takes the sheet down to the middle, and nothing has been scrolled or stretched.
    await finger(page, { x: 195, y: 300 }, (middle - high) * 0.7);
    await expect(handle(page)).toHaveAccessibleName('Näytä lisää');
    expect(Math.abs((await rest(handle(page))).y - middle)).toBeLessThan(2);
    expect(await scrolled(page)).toBe(0);
    await expect(details(page)).toBeVisible();
    expect(await page.evaluate(() => [window.scrollY, window.visualViewport?.scale])).toEqual([0, 1]);
  });

  test('the open list does the same: from its top a pull down takes the sheet to the card', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Playwright moves a finger across the screen only through Chromium DevTools.');
    await start(page, world(kamppi));
    await handle(page).click();
    const middle = (await rest(handle(page))).y;
    await handle(page).click();
    const high = (await rest(handle(page))).y;
    await expectAt(page, 'expanded');
    await finger(page, await rest(rows(page).first()), (middle - high) * 0.7);
    await expectAt(page, 'half');
    expect(Math.abs((await rest(handle(page))).y - middle)).toBeLessThan(2);
  });
});

test.describe('with a finger', () => {
  test.use({ hasTouch: true });

  test('a tap on the handle moves the sheet', async ({ page }) => {
    await start(page, world(kamppi));
    await expectAt(page, 'peek');
    const at = await rest(handle(page));
    await page.touchscreen.tap(at.x, at.y);
    await expectAt(page, 'half');
  });

  test('a tap on the row, beside its button, raises the sheet to the card', async ({ page }) => {
    await start(page, world(kamppi));
    await expectAt(page, 'peek');
    const name = await rest(row(page).getByRole('heading', { level: 3 }));
    await page.touchscreen.tap(name.x, name.y);
    await expectAt(page, 'half');
    await expect(page.getByRole('dialog')).toBeHidden();
    // At the card a tap on plain text does nothing: only the lowest sheet is one big handle.
    const label = await rest(card(page).getByRole('heading', { level: 2 }));
    await page.touchscreen.tap(label.x, label.y);
    await expectAt(page, 'half');
    await expect(page.getByRole('dialog')).toBeHidden();
    // The card's name is a button: a tap on it opens the pharmacy's details.
    const title = await rest(card(page).getByRole('heading', { level: 3 }));
    await page.touchscreen.tap(title.x, title.y);
    await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toHaveText('Kampin apteekki');
  });

  // Janne's iPhone, 25 Nov 2026: "sometimes a touch doesn't register". Below the open list the
  // whole sheet is its handle, so every button on it is pressed through the sheet's own drag.
  test('a tap by a thumb that rolls a few pixels still presses the button under it, and the sheet stays', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Playwright moves a finger across the screen only through Chromium DevTools.');
    await start(page, world(kamppi));
    await expectAt(page, 'peek');
    const devtools = await page.context().newCDPSession(page);
    const roll = async (from: { x: number; y: number }, by: number) => {
      const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', y?: number) =>
        devtools.send('Input.dispatchTouchEvent', { type, touchPoints: y === undefined ? [] : [{ x: Math.round(from.x), y: Math.round(y) }] });
      await touch('touchStart', from.y);
      for (let step = 1; step <= 4; step++) {
        await page.clock.runFor(16);
        await touch('touchMove', from.y + (by * step) / 4);
      }
      await page.clock.runFor(30);
      await touch('touchEnd');
    };
    const route = row(page).getByRole('button', { name: 'Reitti kävellen: Kampin apteekki' });
    for (const by of [-9, 10]) {
      await roll(await rest(route), by);
      await expect(page.getByRole('dialog').getByRole('heading', { level: 2 }), `rolled ${by}`).toHaveText('Kampin apteekki');
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toBeHidden();
      // The roll itself moved nothing: closed, the details leave the sheet at the row it was on.
      await expectAt(page, 'peek');
      await rest(handle(page));
    }
    // Thrown upwards from the same button, however short the way: that is the sheet's, and no press.
    const from = await rest(route);
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', y?: number) =>
      devtools.send('Input.dispatchTouchEvent', { type, touchPoints: y === undefined ? [] : [{ x: Math.round(from.x), y: Math.round(y) }] });
    await touch('touchStart', from.y);
    await page.clock.runFor(8);
    await touch('touchMove', from.y - 6);
    await page.clock.runFor(8);
    await touch('touchMove', from.y - 12);
    await touch('touchEnd');
    await expectAt(page, 'half');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('a finger drags the sheet from the row to the card and on to the list', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Playwright moves a finger across the screen only through Chromium DevTools. In WebKit it can tap, which the test above does.');
    await start(page, world(kamppi));
    const low = (await rest(handle(page))).y;
    await handle(page).click();
    const middle = (await rest(handle(page))).y;
    await handle(page).click();
    const high = (await rest(handle(page))).y;
    await handle(page).click();
    await expectAt(page, 'peek');

    // By the row itself, not only by the handle: below the open list the whole sheet takes the finger.
    await finger(page, await rest(row(page).getByRole('heading', { level: 3 })), -(low - middle) * 0.7);
    await expectAt(page, 'half');
    expect(Math.abs((await rest(handle(page))).y - middle)).toBeLessThan(2);
    await finger(page, await rest(handle(page)), -(middle - high) * 0.7);
    await expectAt(page, 'expanded');
    await expect(rows(page).first()).toBeInViewport();
    // Open, the list is the list's: a finger that moves up on it scrolls it, and the sheet stays.
    await finger(page, await rest(rows(page).first()), -120);
    await expectAt(page, 'expanded');
    expect(Math.abs((await rest(handle(page))).y - high)).toBeLessThan(2);
    await finger(page, await rest(handle(page)), low - high + 40);
    await expectAt(page, 'peek');
    // The page itself was never scrolled or zoomed by any of it.
    expect(await page.evaluate(() => [window.scrollY, window.visualViewport?.scale])).toEqual([0, 1]);
  });
});
