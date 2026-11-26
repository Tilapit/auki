import type { Page } from '@playwright/test';
import { allViews, type Size, type ViewInfo } from '../../lib/dev/viewList';

/**
 * What the checks that go through every view of /dev/states share: axe, the keyboard and
 * reflow (PLAN.md section 9). The views and their sizes come from lib/dev/viewList.ts, the
 * same list the screenshots are made from, so a new view is checked from the day it is added.
 */

const ALL_SIZES: Size[] = ['phone', 'desktop'];

/** Every view at each size it is shown in, once. */
export function viewsBySize(): { view: ViewInfo; size: Size }[] {
  const seen = new Set<string>();
  return allViews.flatMap((view) =>
    (view.sizes ?? ALL_SIZES).flatMap((size) => {
      const name = `${view.id}.${size}`;
      if (seen.has(name)) return [];
      seen.add(name);
      return [{ view, size }];
    }),
  );
}

/** Every view, once. */
export function views(): ViewInfo[] {
  const seen = new Set<string>();
  return allViews.filter((view) => !seen.has(view.id) && !!seen.add(view.id));
}

/** Opens a view and waits until it stands as a person would see it. */
export async function openView(page: Page, view: ViewInfo, theme?: 'light' | 'dark') {
  await page.goto(`/fi/dev/states/${view.id}${theme ? `?theme=${theme}` : ''}`);
  if (view.ready) await page.locator(view.ready).first().waitFor({ state: 'visible' });
  await atRest(page);
}

/**
 * A view is checked as it stands at rest. The phone's sheet measures its card after the
 * first paint and the map then moves its chips clear of it: until nothing on the map or the
 * sheet has moved for a moment, a check would be looking at a layout nobody sees.
 */
export async function atRest(page: Page) {
  // A map places its markers once it has measured itself: until then they are hidden.
  await page.waitForFunction(() => !document.querySelector('[data-map]:not([data-map="ready"])'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(
    () => {
      const state = window as unknown as { placedAt?: string; unmoved?: number };
      const places = [...document.querySelectorAll('[data-pin], [data-chip], [data-grab], dialog[open]')]
        .map((element) => {
          const box = element.getBoundingClientRect();
          return `${Math.round(box.x)},${Math.round(box.y)},${Math.round(box.height)}`;
        })
        .join(' ');
      state.unmoved = state.placedAt === places ? (state.unmoved ?? 0) + 1 : 0;
      state.placedAt = places;
      return state.unmoved >= 3;
    },
    undefined,
    { polling: 50 },
  );
}
