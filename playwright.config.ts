import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 3000);
const CI = !!process.env.CI;

/**
 * End-to-end tests in Chromium and in WebKit (the closest thing to Safari). Locally they
 * run against the dev server. CI runs them against a production build made with
 * DEV_ROUTES=1, which keeps the /dev/states views in it and is several times faster.
 *
 * - states.spec.ts makes the 2× screenshots for review by eye (`npm run shots`). Not in CI.
 * - visual.spec.ts compares 1× screenshots with the committed baselines. In CI, and locally
 *   only with VISUAL=1: the baselines are made on Linux and text renders differently on macOS.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  testIgnore: CI ? ['**/states.spec.ts'] : process.env.VISUAL ? [] : ['**/visual.spec.ts'],
  outputDir: 'test-results',
  snapshotPathTemplate: 'tests/e2e/__screenshots__/{projectName}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: CI,
  workers: CI ? 2 : 4,
  reporter: CI ? [['list'], ['github']] : [['list']],
  expect: {
    // Same image, same browser build: the pixels should match. A few may differ at glyph edges.
    toHaveScreenshot: { maxDiffPixels: 20, animations: 'disabled', caret: 'hide' },
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    // No test may depend on the real time or place.
    timezoneId: 'Europe/Helsinki',
    locale: 'fi-FI',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit', use: { browserName: 'webkit', userAgent: devices['iPhone 14'].userAgent } },
  ],
  webServer: {
    command: CI ? `npm run start -- -p ${PORT}` : `npm run dev -- -p ${PORT}`,
    // The /dev pages are decided when a page is rendered, so the server needs the switch as well as the build.
    env: CI ? { DEV_ROUTES: '1' } : {},
    url: `http://localhost:${PORT}/fi`,
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
});
