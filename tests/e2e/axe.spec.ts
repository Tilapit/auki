import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { SIZES, type Theme } from '../../lib/dev/viewList';
import { openView, viewsBySize } from './devStates';

/**
 * axe on every state (PLAN.md section 9 and M7): each view of /dev/states, in both themes
 * and at both sizes, in both browsers. The themes are checked apart because contrast is
 * worked out from the colours in force, and the sizes because the phone and the desktop
 * show different parts of the same page.
 *
 * The rules are WCAG 2.0, 2.1 and 2.2 at levels A and AA, and axe's best practices. No rule
 * is switched off and no view is left out: a finding is fixed in the view.
 *
 * What axe can't judge it reports as "incomplete" and not as a failure: text over the
 * first window's painted sky, for one. Those are for the eye (`npm run shots`) and for the
 * contrast table in PLAN.md section 6.
 */
const ALL_THEMES: Theme[] = ['light', 'dark'];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

for (const { view, size } of viewsBySize()) {
  test(`${view.id}.${size}`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ ...testInfo.project.use, viewport: SIZES[size], reducedMotion: 'reduce' });
    const page = await context.newPage();
    for (const theme of view.themes ?? ALL_THEMES) {
      await openView(page, view, theme);
      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      // One line per element, so a failure reads as a list of what to fix.
      const found = violations.flatMap((violation) => violation.nodes.map((node) => `${violation.id} (${violation.impact}): ${node.target.join(' ')}\n    ${node.failureSummary?.replace(/\n\s*/g, ' ')}`));
      expect.soft(found, `${view.id}, ${size}, ${theme}`).toEqual([]);
    }
    await context.close();
  });
}
