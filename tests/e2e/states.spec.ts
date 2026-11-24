import { test } from '@playwright/test';
import { allViews, SIZES, type Size, type Theme } from '../../lib/dev/viewList';

/**
 * Screenshots of every view in /dev/states, for checking against design/png/.
 * Output: screenshots/<view>.<size>.<theme>.png for Chromium and screenshots/webkit/… for WebKit.
 * LOCALE=en switches the language.
 */
const locale = process.env.LOCALE ?? 'fi';
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
        const folder = [testInfo.project.name === 'chromium' ? '' : `${testInfo.project.name}/`, locale === 'fi' ? '' : `${locale}/`].join('');
        const context = await browser.newContext({ viewport: SIZES[size], deviceScaleFactor: 2, reducedMotion: 'reduce' });
        const page = await context.newPage();
        await page.goto(`/${locale}/dev/states/${view.id}?theme=${theme}`);
        if (view.ready) await page.locator(view.ready).first().waitFor({ state: 'visible' });
        // A map places its markers once it has measured itself: wait until every one on the page has.
        await page.waitForFunction(() => !document.querySelector('[data-map]:not([data-map="ready"])'));
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(150);
        await page.screenshot({ path: `screenshots/${folder}${name}.png`, fullPage: view.fullPage });
        await context.close();
      });
    }
  }
}
