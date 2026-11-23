import { test as base } from '@playwright/test';
import { fakeMapTiles } from './helpers';

/**
 * The test every spec uses: the same as Playwright's, except that the map tile host is
 * answered by the test itself. No browser test reaches a real service (CLAUDE.md), and the
 * map loads by itself as soon as results are on screen.
 *
 * `mapTiles` holds the paths the map asked that host for.
 */
export const test = base.extend<{ mapTiles: string[] }>({
  mapTiles: [
    async ({ context }, use) => {
      await use(await fakeMapTiles(context));
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
