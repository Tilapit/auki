import type { Locator, Page } from '@playwright/test';

/**
 * The keyboard alone (PLAN.md section 9). Two things are asked of every view: Tab reaches
 * every control that shows, and whatever has the focus can be seen.
 */

/** Safari's Tab stops at text fields only, unless Option is held: that is its default, and WebKit's here. */
export const tabKey = (browserName: string): string => (browserName === 'webkit' ? 'Alt+Tab' : 'Tab');

export interface Round {
  /** Controls that show and that Tab never came to. */
  missed: string[];
  /** Controls that had the focus while no part of them could be seen. */
  hidden: string[];
  /** Controls that had the focus outside `within`, when the focus was meant to stay there. */
  outside: string[];
  /** How many controls there were to reach. */
  controls: number;
}

interface Seen {
  /** Its number among the controls there were to reach, or -1 for something else that took the focus. */
  index: number;
  name: string;
  shows: boolean;
  inside: boolean;
}

/** What has the focus now, and whether any of it can be seen: read in the page. */
const focused = (page: Page, within: string | null): Promise<Seen | null> =>
  page.evaluate((scope) => {
    const element = document.activeElement;
    if (!element || element === document.body || element === document.documentElement) return null;
    const box = element.getBoundingClientRect();
    // Nine points across it. It shows if the browser's own hit test finds it, or something in it, at one of them.
    let shows = false;
    for (const fx of [0.1, 0.5, 0.9]) {
      for (const fy of [0.1, 0.5, 0.9]) {
        const x = box.left + box.width * fx;
        const y = box.top + box.height * fy;
        if (x < 0 || y < 0 || x >= window.innerWidth || y >= window.innerHeight) continue;
        const hit = document.elementFromPoint(x, y);
        if (hit && (hit === element || element.contains(hit))) shows = true;
      }
    }
    const name = (element.getAttribute('aria-label') ?? element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60);
    return {
      index: Number(element.getAttribute('data-tab-stop') ?? -1),
      name: `${element.tagName.toLowerCase()} "${name}"`,
      shows,
      inside: !scope || !!element.closest(scope),
    };
  }, within);

/**
 * Presses Tab until every control that shows has had the focus, or until it has gone round
 * twice without finding the rest. `within` is a selector: only the controls inside it are
 * asked for, and with `contained` the focus may not leave it either (a modal dialog).
 */
export async function tabRound(page: Page, key: string, { within = null, contained = false }: { within?: string | null; contained?: boolean } = {}): Promise<Round> {
  // What there is to reach: links, buttons and fields that are shown, switched on and not inert.
  const { names, around } = await page.evaluate((scope) => {
    for (const marked of document.querySelectorAll('[data-tab-stop]')) marked.removeAttribute('data-tab-stop');
    const root: ParentNode = (scope ? document.querySelector(scope) : document.querySelector('dialog:modal')) ?? document;
    const stops = [...root.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, summary, [tabindex]')].filter(
      (element) =>
        element.tabIndex >= 0 &&
        !(element as HTMLButtonElement).disabled &&
        !element.closest('[inert]') &&
        element.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true }),
    );
    const names = stops.map((element, index) => {
      element.setAttribute('data-tab-stop', String(index));
      const name = (element.getAttribute('aria-label') ?? element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60);
      return `${element.tagName.toLowerCase()} "${name}"`;
    });
    // Where the focus may leave `within`, Tab has the whole page to go round before it is back.
    const page = document.querySelector('dialog:modal') ?? document;
    return { names, around: page.querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex]').length };
  }, within);

  const reached = new Set<number>();
  const hidden = new Set<string>();
  const outside = new Set<string>();
  for (let press = 0; press < around * 2 + 6 && reached.size < names.length; press++) {
    await page.keyboard.press(key);
    let seen = await focused(page, within);
    // The map eases a marker that took the focus under the bar or the sheet into view: a moment for that.
    for (let wait = 0; seen && !seen.shows && wait < 12; wait++) {
      await page.waitForTimeout(100);
      seen = await focused(page, within);
    }
    if (!seen) continue;
    // React may have put a new element in a control's place since the round began (the language
    // link does, once the address is known): the same control by its name.
    const index = seen.index >= 0 ? seen.index : names.findIndex((name, at) => name === seen?.name && !reached.has(at));
    if (index >= 0) reached.add(index);
    if (!seen.shows) hidden.add(seen.name);
    if (contained && !seen.inside) outside.add(seen.name);
  }
  // A control that is no longer there to reach was not missed: the map brings a focused marker into
  // view and its edge chip goes, and a card control under the screen's edge opens the sheet over the map.
  const gone = await page.evaluate(
    () =>
      [...document.querySelectorAll<HTMLElement>('[data-tab-stop]')]
        .filter((element) => !element.closest('[inert]') && element.checkVisibility({ visibilityProperty: true }))
        .map((element) => Number(element.getAttribute('data-tab-stop'))),
  );
  const still = new Set(gone);
  return { missed: names.filter((_, index) => !reached.has(index) && still.has(index)), hidden: [...hidden], outside: [...outside], controls: names.length };
}

/** Moves the focus to a control with Tab alone, however many presses that takes. False if Tab never came to it. */
export async function tabTo(page: Page, key: string, target: Locator, presses = 80): Promise<boolean> {
  for (let press = 0; press < presses; press++) {
    if (await target.evaluate((element) => element === document.activeElement).catch(() => false)) return true;
    await page.keyboard.press(key);
  }
  return target.evaluate((element) => element === document.activeElement).catch(() => false);
}
