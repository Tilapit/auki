import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 3000);

/**
 * End-to-end tests and the /dev/states screenshots. Runs against the dev server,
 * in Chromium and in WebKit (the closest thing to Safari).
 */
export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'test-results',
  fullyParallel: true,
  workers: 4,
  reporter: [['list']],
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
    command: `npm run dev -- -p ${PORT}`,
    url: `http://localhost:${PORT}/fi`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
