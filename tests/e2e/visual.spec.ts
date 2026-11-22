import { expect, test } from '@playwright/test';
import { allViews, SIZES, type Size, type Theme } from '../../lib/dev/viewList';

/**
 * Visual comparison: every /dev/states view against its committed baseline, at 1×.
 * A push that changes how a view looks fails here until the baseline is updated in the
 * same pull request, where GitHub then shows the two images side by side.
 *
 * The baselines are made in the CI's Linux image, where they are also compared: text
 * renders differently on macOS. See "Commands" in CLAUDE.md for how to update them.
 */
const ALL_SIZES: Size[] = ['phone', 'desktop'];
const ALL_THEMES: Theme[] = ['light', 'dark'];
const seen = new Set<string>();

for (const view of allViews) {
  for (const size of view.sizes ?? ALL_SIZES) {
    for (const theme of view.themes ?? ALL_THEMES) {
      const name = `${view.id}.${size}.${theme}`;
      if (seen.has(name)) continue;
      seen.add(name);
      test(name, async ({ browser }, testInfo) => {
        const context = await browser.newContext({ ...testInfo.project.use, viewport: SIZES[size], deviceScaleFactor: 1, reducedMotion: 'reduce' });
        const page = await context.newPage();
        await page.goto(`/fi/dev/states/${view.id}?theme=${theme}`);
        if (view.ready) await page.locator(view.ready).first().waitFor({ state: 'visible' });
        await page.evaluate(() => document.fonts.ready);
        await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: view.fullPage });
        await context.close();
      });
    }
  }
}
