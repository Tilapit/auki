import { test as base } from '@playwright/test';
import { fakeMapTiles } from './helpers';
import { REPORT_PATH } from '@/lib/reports';
import { WAKE_METHOD, WALKING_PATH } from '@/lib/walking';

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
 * - GET /api/walking, the wake-up: answered here as our server answers it, with nothing.
 *   `fakeWalking` passes it on to this default, and so does a test that answers the walking
 *   request itself (`route.fallback()`). `walkingWoken` holds every wake-up, as it was sent.
 * - /api/report: by default it answers as our server does without a database, at once, so no
 *   report is offered and none is shown. A test about reports answers it itself
 *   (`fakeReports` in helpers.ts). `reportAsked` holds what reached this default.
 */
export interface Woken {
  url: string;
  headers: Record<string, string>;
  /** null: the request had no body at all. */
  body: string | null;
}

export const test = base.extend<{ mapTiles: string[]; walkingDefault: { asked: string[]; woken: Woken[] }; walkingAsked: string[]; walkingWoken: Woken[]; reportAsked: string[] }>({
  mapTiles: [
    async ({ context }, use) => {
      await use(await fakeMapTiles(context));
    },
    { auto: true },
  ],
  walkingDefault: [
    async ({ context }, use) => {
      const asked: string[] = [];
      const woken: Woken[] = [];
      await context.route(`**${WALKING_PATH}`, async (route) => {
        const request = route.request();
        if (request.method() === WAKE_METHOD) {
          woken.push({ url: request.url(), headers: request.headers(), body: request.postData() });
          await route.fulfill({ status: 204, body: '', headers: { 'cache-control': 'no-store' } });
          return;
        }
        asked.push(request.postData() ?? '');
        await route.fulfill({ status: 503, json: { error: 'not-configured' }, headers: { 'cache-control': 'no-store' } });
      });
      await use({ asked, woken });
    },
    { auto: true },
  ],
  walkingAsked: [
    async ({ walkingDefault }, use) => {
      await use(walkingDefault.asked);
    },
    { auto: false },
  ],
  walkingWoken: [
    async ({ walkingDefault }, use) => {
      await use(walkingDefault.woken);
    },
    { auto: false },
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
