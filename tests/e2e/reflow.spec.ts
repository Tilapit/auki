import { expect, test, type Page } from '@playwright/test';
import { openView, views } from './devStates';

/**
 * Reflow (PLAN.md section 9; WCAG 1.4.10 and 1.4.4): every view of /dev/states at 320 CSS
 * pixels wide, and at 200 % zoom. Zooming a browser to 200 % halves the window in CSS pixels,
 * so the zoomed case is the desktop size of /dev/states, 1440 by 900, as 720 by 450.
 *
 * Two things are asked. Nothing scrolls sideways: not the page and nothing in it. And no
 * content is lost: no text and no control is cut off by a box that hides what doesn't fit,
 * pushed past the edge of the screen, or ended with an ellipsis that isn't there at the
 * phone's usual 390 pixels. What a scrolling area holds can be scrolled to, up and down.
 *
 * Left out, and why:
 * - The map and what lies on it, and the data page's table. Both are two-dimensional by
 *   nature, which is the criterion's own exception; the list is the map's equivalent.
 * - What is hidden from everyone (`aria-hidden`: the first window's painted sky) or shown
 *   to screen readers only.
 * - Up and down, the phone's sheet below its open place: the card under the screen's edge
 *   is one press of the handle away, and keyboard.spec.ts holds it to that.
 */
const USUAL = { width: 390, height: 844 };
const CASES = [
  { name: '320 px wide', viewport: { width: 320, height: 568 } },
  { name: '200 % zoom', viewport: { width: 720, height: 450 } },
];

interface Lost {
  /** Content that can't be got to, each in words. */
  found: string[];
  /** Text that ends in an ellipsis because it doesn't fit. */
  shortened: string[];
}

/** Every way a view loses content at this size. Read in the page. */
const lost = (page: Page): Promise<Lost> =>
  page.evaluate(() => {
    const found = new Set<string>();
    const shortened = new Set<string>();
    const screen = { width: document.documentElement.clientWidth, height: window.innerHeight };
    const tag = (element: Element) =>
      `${element.tagName.toLowerCase()}.${String(element.getAttribute('class') ?? '')
        .split(' ')[0]
        .replace(/^.*__|^[\w-]+?_/, '')}`;
    const say = (element: Element) => `${tag(element)} "${(element.getAttribute('aria-label') ?? element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40)}"`;
    if (document.documentElement.scrollWidth > screen.width + 1) found.add(`the page scrolls sideways: ${document.documentElement.scrollWidth} px of content in ${screen.width}`);

    // The phone's sheet below its open place: what it holds under the screen's edge is one press away.
    const closedSheet = document.querySelector('[data-sheet="peek"] [data-grab], [data-sheet="half"] [data-grab]')?.parentElement ?? null;
    const forScreenReadersOnly = (element: Element) => {
      const box = element.getBoundingClientRect();
      return box.width <= 1 && box.height <= 1;
    };

    for (const element of document.querySelectorAll<HTMLElement>('body *')) {
      if (element.closest('[data-map], [aria-hidden="true"], svg, table')) continue;
      if (!element.checkVisibility({ visibilityProperty: true })) continue;
      const style = getComputedStyle(element);
      if ((style.overflowX === 'auto' || style.overflowX === 'scroll') && element.scrollWidth > element.clientWidth + 1 && !element.querySelector('table')) {
        found.add(`${say(element)} scrolls sideways: ${element.scrollWidth} px of content in ${element.clientWidth}`);
      }

      // Content: a control, or an element with text of its own.
      const control = element.matches('a[href], button, input, select, textarea');
      const ownText = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
      if (!control && !ownText) continue;
      const box = element.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;
      if (ownText && style.textOverflow === 'ellipsis' && element.scrollWidth > element.clientWidth + 1) shortened.add(say(element));

      // Up through what holds it. A scrolling area can be scrolled to what it holds; a box that
      // hides what doesn't fit can't. Past a modal dialog, or anything fixed, only the screen is left.
      let hiddenOnPurpose = forScreenReadersOnly(element);
      let cut: string | undefined;
      let sideways = true;
      let upAndDown = !(closedSheet && closedSheet.contains(element));
      let fixed = false;
      for (let above = element.parentElement; above && !hiddenOnPurpose && !cut && !fixed; above = above.parentElement) {
        if (forScreenReadersOnly(above)) hiddenOnPurpose = true;
        const holds = getComputedStyle(above);
        const frame = above.getBoundingClientRect();
        if (holds.overflowX === 'auto' || holds.overflowX === 'scroll') sideways = false;
        else if (sideways && (holds.overflowX === 'hidden' || holds.overflowX === 'clip') && (box.right > frame.right + 1 || box.left < frame.left - 1)) {
          cut = `${Math.round(Math.max(box.right - frame.right, frame.left - box.left))} px of it are cut off sideways by ${tag(above)}`;
        }
        if (holds.overflowY === 'auto' || holds.overflowY === 'scroll') upAndDown = false;
        else if (upAndDown && (holds.overflowY === 'hidden' || holds.overflowY === 'clip') && (box.bottom > frame.bottom + 1 || box.top < frame.top - 1)) {
          cut = `${Math.round(Math.max(box.bottom - frame.bottom, frame.top - box.top))} px of it are cut off by ${tag(above)}`;
        }
        fixed = above.matches('dialog:modal') || holds.position === 'fixed';
      }
      if (hiddenOnPurpose) continue;
      if (cut) found.add(`${say(element)}: ${cut}`);
      else if (sideways && (box.right > screen.width + 1 || box.left < -1)) found.add(`${say(element)}: reaches ${Math.round(Math.max(box.right - screen.width, -box.left))} px past the edge of the screen`);
      else if (fixed && upAndDown && (box.bottom > screen.height + 1 || box.top < -1)) found.add(`${say(element)}: ${Math.round(Math.max(box.bottom - screen.height, -box.top))} px of it are off the screen, in something that does not scroll`);
    }
    return { found: [...found], shortened: [...shortened] };
  });

for (const view of views()) {
  test(view.id, async ({ browser, browserName }, testInfo) => {
    const context = await browser.newContext({ ...testInfo.project.use, viewport: USUAL, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const at = async (viewport: { width: number; height: number }) => {
      await page.setViewportSize(viewport);
      await openView(page, view);
      return lost(page);
    };
    // WebKit stands in for Safari on an iPhone, as in the visual comparison: it is asked for
    // the narrow phone. The desktop window zoomed to 200 % is Chromium's.
    const cases = CASES.filter(({ viewport }) => browserName !== 'webkit' || viewport.width === 320);
    // A name that is too long for the phone's bar ends in an ellipsis at any size: that is not
    // reflow's doing. Looked up only when something is shortened, which is seldom.
    let usual: Set<string> | undefined;
    for (const { name, viewport } of cases) {
      const { found, shortened } = await at(viewport);
      if (shortened.length > 0) usual ??= new Set((await at(USUAL)).shortened);
      const cutShort = shortened.filter((text) => !usual?.has(text)).map((text) => `${text}: ends in an ellipsis here, and not at ${USUAL.width} px`);
      expect.soft([...found, ...cutShort], `${view.id} at ${name}`).toEqual([]);
    }
    await context.close();
  });
}
