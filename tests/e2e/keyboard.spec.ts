import type { Page } from '@playwright/test';
import { MONDAY_EVENING, kamppi } from '@/lib/fixtures/tiles';
import { SIZES } from '../../lib/dev/viewList';
import { openView, viewsBySize } from './devStates';
import { expect, test } from './fixtures';
import { fakeLocation, fakePlaces, fakeTiles, hasWebGL, locateButton, open, world } from './helpers';
import { tabKey, tabRound, tabTo } from './keyboard';

/**
 * The keyboard-only run (PLAN.md section 9 and M7). No mouse and no touch anywhere in this
 * file: Tab, Enter, Escape and typing. Two things are asked wherever the run stops:
 * Tab reaches every control that shows, and whatever has the focus can be seen.
 *
 * First the way a person goes: the first window, the position, the results, the phone
 * sheet's three places, a pharmacy and back, another place by its name; and the counter
 * card abroad. Then every view of /dev/states, for the states that way doesn't pass.
 */

/** Presses Tab around what is on screen and holds it to the two things. */
async function round(page: Page, key: string, what: string, options: { within?: string; contained?: boolean } = {}) {
  const result = await tabRound(page, key, options);
  expect.soft(result.missed, `${what}: Tab reaches every control`).toEqual([]);
  expect.soft(result.hidden, `${what}: what has the focus can be seen`).toEqual([]);
  if (options.contained) expect.soft(result.outside, `${what}: the focus stays inside`).toEqual([]);
  return result;
}

/** The map has stopped changing what is under the keyboard: MapLibre, where there is WebGL, has taken the markers in. */
async function mapSettled(page: Page) {
  const map = page.locator('[data-map]');
  if (await hasWebGL(page)) await expect(map).not.toHaveAttribute('data-basemap', 'plain');
  await page.waitForTimeout(300);
}

/** The sheet glides to its place in real time: wait until its handle has stopped. */
async function sheetAt(page: Page, name: string) {
  const handle = page.locator('[data-grab]');
  await expect(handle).toHaveAccessibleName(name);
  let last = -1;
  await expect
    .poll(async () => {
      const y = (await handle.boundingBox())?.y ?? -1;
      const still = Math.abs(y - last) < 0.5;
      last = y;
      return still;
    }, { intervals: [120] })
    .toBe(true);
}

for (const size of ['phone', 'desktop'] as const) {
  test.describe(`${size}, by keyboard alone`, () => {
    test.use({ viewport: SIZES[size] });

    test('from the first window to a pharmacy and back, and to another place', async ({ page, browserName }) => {
      const key = tabKey(browserName);
      // Monday 23 November 2026 at 20:41 in Helsinki, and the clock runs on: the sheet and the map move in real time.
      await page.clock.install({ time: new Date(MONDAY_EVENING * 1000) });
      await fakeLocation(page, 'allow');
      await fakeTiles(page, world(kamppi));
      await fakePlaces(page, { place: { lat: 60.1689, lon: 24.9325, label: 'Kamppi, Helsinki' } });
      await open(page, '/fi');

      // The first window: the button that asks for the position is reached and pressed.
      await round(page, key, 'the first window');
      expect(await tabTo(page, key, locateButton(page)), 'Tab comes to the locate button').toBe(true);
      await page.keyboard.press('Enter');

      // The results: the focus is on the title, so a screen reader starts from what was found.
      const title = page.getByRole('heading', { level: 1 });
      await expect(title).toHaveText('2 apteekkia auki juuri nyt');
      await expect(title).toBeFocused();
      await mapSettled(page);
      await round(page, key, 'the results');

      // The phone's sheet: its handle takes it from the row to the card, to the list and back down.
      if (size === 'phone') {
        const handle = page.locator('[data-grab]');
        await sheetAt(page, 'Näytä lisää');
        expect(await tabTo(page, key, handle), 'Tab comes to the handle').toBe(true);
        await page.keyboard.press('Enter');
        await sheetAt(page, 'Näytä lista');
        await round(page, key, 'the sheet at the card');

        expect(await tabTo(page, key, handle)).toBe(true);
        await page.keyboard.press('Enter');
        await sheetAt(page, 'Pienennä lista');
        const list = await round(page, key, 'the sheet open, with the list');
        // The list's rows are among them, and nothing under the sheet is.
        await expect(page.locator('ol > li h3 button').first()).toHaveAttribute('data-tab-stop');
        expect(list.controls).toBeGreaterThan(6);

        expect(await tabTo(page, key, handle)).toBe(true);
        await page.keyboard.press('Enter');
        await sheetAt(page, 'Näytä lisää');
      }

      // A pharmacy's own sheet, opened from the route button: the focus goes to its name.
      const opener = page.getByRole('button', { name: /^Reitti\b.*Kampin apteekki$/ }).first();
      expect(await tabTo(page, key, opener), 'Tab comes to the route button').toBe(true);
      await page.keyboard.press('Enter');
      const name = page.getByRole('heading', { level: 2, name: 'Kampin apteekki' });
      await expect(name).toBeVisible();
      await expect(page.locator(':focus')).toContainText('Kampin apteekki');
      // Whatever holds the sheet: every control in it is reached, and seen.
      await page.evaluate(() => document.activeElement?.closest('dialog, [role="dialog"]')?.setAttribute('data-keyboard-scope', ''));
      const sheet = await round(page, key, 'the pharmacy sheet', { within: '[data-keyboard-scope]' });
      expect(sheet.controls).toBeGreaterThan(2);
      // From inside it Escape closes it. Where the focus goes then is the next test's.
      const out = page.locator('[data-keyboard-scope]').getByRole('button', { name: /^(Sulje|Takaisin listaan)$/ }).first();
      expect(await tabTo(page, key, out), 'Tab comes to the way out of the sheet').toBe(true);
      await page.keyboard.press('Escape');
      await expect(name).toBeHidden();

      // Another place by its name: the search opens with the keyboard already in its field.
      const elsewhere = page.getByRole('button', { name: /Hae toinen paikka/ }).first();
      expect(await tabTo(page, key, elsewhere), 'Tab comes to the place search').toBe(true);
      await page.keyboard.press('Enter');
      const field = page.getByRole('searchbox', { name: 'Paikka' });
      await expect(field).toBeFocused();
      await round(page, key, 'the place search');
      expect(await tabTo(page, key, field)).toBe(true);
      await page.keyboard.type('Kamppi');
      await page.keyboard.press('Enter');
      await expect(title).toHaveText('2 apteekkia auki juuri nyt');
      await expect(title).toBeFocused();
      await expect(page.locator('p:visible, span:visible', { hasText: 'Kamppi, Helsinki' }).first()).toBeVisible();
    });

    // On the desktop this fails on `main` as it was on 25 Nov 2026: the details there are a dialog
    // shown in place, their content goes before the dialog closes, and the browser hands the focus
    // back only from a modal one. The pull request "iphone" of the same day remembers what opened
    // them (`opener` in ResultsView.tsx); with it merged this passes at both sizes.
    test('closing a pharmacy’s details gives the focus back to what opened them', async ({ page, browserName }) => {
      const key = tabKey(browserName);
      await page.clock.install({ time: new Date(MONDAY_EVENING * 1000) });
      await fakeLocation(page, 'allow', 'granted');
      await fakeTiles(page, world(kamppi));
      await page.goto('/fi');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('2 apteekkia auki juuri nyt');
      await mapSettled(page);
      const opener = page.getByRole('button', { name: /^Reitti\b.*Kampin apteekki$/ }).first();
      const name = page.getByRole('heading', { level: 2, name: 'Kampin apteekki' });
      const leave = async (how: 'Escape' | 'Enter') => {
        expect(await tabTo(page, key, opener), 'Tab comes to the route button').toBe(true);
        await page.keyboard.press('Enter');
        await expect(name).toBeVisible();
        await page.evaluate(() => document.activeElement?.closest('dialog, [role="dialog"]')?.setAttribute('data-keyboard-scope', ''));
        const out = page.locator('[data-keyboard-scope]').getByRole('button', { name: /^(Sulje|Takaisin listaan)$/ }).first();
        expect(await tabTo(page, key, out), 'Tab comes to the way out of the details').toBe(true);
        await page.keyboard.press(how);
        await expect(name).toBeHidden();
        await expect(opener, `after ${how === 'Escape' ? 'Escape' : 'its own way out'}`).toBeFocused();
      };
      await leave('Escape');
      await leave('Enter');
    });

    test('the counter card abroad: opened, gone through and closed', async ({ page, browserName }) => {
      const key = tabKey(browserName);
      await open(page, '/fi/dev/states/riga');
      // On the phone this view has the list open; on the desktop the card is in the panel.
      const opener = page.getByRole('button', { name: /^Näytä apteek/ }).first();
      expect(await tabTo(page, key, opener), 'Tab comes to the button of the counter card').toBe(true);
      await page.keyboard.press('Enter');
      const card = page.locator('dialog[open]');
      await expect(card).toBeVisible();
      // The focus is in the card from the start, and Tab never takes it out: it is a modal dialog.
      await expect(card.locator(':focus')).toHaveCount(1);
      const inside = await round(page, key, 'the counter card', { within: 'dialog[open]', contained: true });
      expect(inside.controls).toBeGreaterThan(1);
      await page.keyboard.press('Escape');
      await expect(card).toBeHidden();
      await expect(opener).toBeFocused();
    });
  });
}

// Every state, as /dev/states shows it. A view that opens with a dialog over it is gone through inside the dialog.
for (const size of ['phone', 'desktop'] as const) {
  test.describe(`every view, ${size}: Tab reaches every control, and the focus is never out of sight`, () => {
    test.use({ viewport: SIZES[size] });
    // In Chromium. WebKit goes the person's way above at both sizes; here it would only press
    // Option-Tab through the same pages again, at twice the time.
    test.skip(({ browserName }) => browserName !== 'chromium', 'Every view is gone round in Chromium.');
    for (const { view } of viewsBySize().filter((entry) => entry.size === size)) {
      test(view.id, async ({ page, browserName }) => {
        await openView(page, view);
        await round(page, tabKey(browserName), view.id);
      });
    }
  });
}
