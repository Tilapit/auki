import { test as base } from '@playwright/test';
import { fakeMapTiles } from './helpers';
import { REPORT_PATH } from '@/lib/reports';
import { WALKING_PATH } from '@/lib/walking';

/**
 * The test every spec uses: the same as Playwright's, except that the services behind the
 * results are answered by the test itself. No browser test reaches a real service
 * (CLAUDE.md).
 *
 * - The map tile host: the map loads by itself as soon as results are on screen.
 *   `mapTiles` holds the paths the map asked that host for.
 * - POST /api/walking: by default it answers as our server does without a key, at once, so
 *   the results are by straight line. A test about walking times answers it itself
 *   (`fakeWalking` in helpers.ts): a route on the page comes before this one. `walkingAsked`
 *   holds the bodies that reached this default.
 * - /api/report: by default it answers as our server does without a database, at once, so no
 *   report is offered and none is shown. A test about reports answers it itself
 *   (`fakeReports` in helpers.ts). `reportAsked` holds what reached this default.
 */
export const test = base.extend<{ mapTiles: string[]; walkingAsked: string[]; reportAsked: string[] }>({
  mapTiles: [
    async ({ context }, use) => {
      await use(await fakeMapTiles(context));
    },
    { auto: true },
  ],
  walkingAsked: [
    async ({ context }, use) => {
      const asked: string[] = [];
      await context.route(`**${WALKING_PATH}`, async (route) => {
        asked.push(route.request().postData() ?? '');
        await route.fulfill({ status: 503, json: { error: 'not-configured' }, headers: { 'cache-control': 'no-store' } });
      });
      await use(asked);
    },
    { auto: true },
  ],
  reportAsked: [
    async ({ context }, use) => {
      const asked: string[] = [];
      await context.route(`**${REPORT_PATH}*`, async (route) => {
        const request = route.request();
        asked.push(`${request.method()} ${new URL(request.url()).search} ${request.postData() ?? ''}`.trim());
        await route.fulfill({ status: 503, json: { error: 'not-configured' }, headers: { 'cache-control': 'no-store' } });
      });
      await use(asked);
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
