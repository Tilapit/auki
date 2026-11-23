import type { Page } from '@playwright/test';

/**
 * What the flow tests share: a scripted geolocation, so each case behaves the same in
 * Chromium and WebKit, answers for the place lookup, and a way to open the page that waits
 * for React. Nothing here reaches a real service.
 */

export type Mode = 'allow' | 'approximate' | 'deny' | 'unavailable' | 'timeout' | 'timeout-then-allow' | 'ignore' | 'unsupported';

// A position no fixture uses, so that it can be searched for in the requests.
export const HERE = { lat: 60.16952, lon: 24.93545 };

export async function fakeLocation(page: Page, mode: Mode, permission: 'prompt' | 'granted' = 'prompt') {
  await page.addInitScript(
    ({ mode, permission, here }) => {
      let calls = 0;
      const position = (accuracy: number) => ({ coords: { latitude: here.lat, longitude: here.lon, accuracy }, timestamp: 0 }) as GeolocationPosition;
      const failure = (code: number) => ({ code, message: '' }) as GeolocationPositionError;
      const geolocation = {
        getCurrentPosition(success: PositionCallback, error: PositionErrorCallback) {
          calls++;
          // Answers without a timer, so a paused test clock doesn't hold it back.
          void Promise.resolve().then(() => {
            if (mode === 'allow') success(position(25));
            if (mode === 'approximate') success(position(2400));
            if (mode === 'deny') error(failure(1));
            if (mode === 'unavailable') error(failure(2));
            if (mode === 'timeout') error(failure(3));
            if (mode === 'timeout-then-allow') {
              if (calls === 1) error(failure(3));
              else success(position(25));
            }
            // 'ignore': the permission prompt is left unanswered, so nothing ever calls back.
          });
        },
        watchPosition: () => 0,
        clearWatch: () => undefined,
      };
      Object.defineProperty(Navigator.prototype, 'geolocation', { get: () => (mode === 'unsupported' ? undefined : geolocation), configurable: true });
      Object.defineProperty(Navigator.prototype, 'permissions', { get: () => ({ query: async () => ({ state: permission }) }), configurable: true });
    },
    { mode, permission, here: HERE },
  );
}

/** Answers GET /api/geocode. Returns the queries it was asked. */
export async function fakePlaces(page: Page, answer: { place: object | null } | number) {
  const asked: string[] = [];
  await page.route('**/api/geocode**', async (route) => {
    asked.push(new URL(route.request().url()).search);
    if (typeof answer === 'number') await route.fulfill({ status: answer, json: { error: 'upstream' } });
    else await route.fulfill({ json: answer });
  });
  return asked;
}

/** Opens the page and waits until React has attached its handlers: a click before that would do nothing. */
export async function open(page: Page, path: string) {
  await page.goto(path);
  await page.waitForFunction(() => {
    const control = document.querySelector('button, input');
    return !!control && Object.keys(control).some((key) => key.startsWith('__reactProps'));
  });
}

export const locateButton = (page: Page) => page.getByRole('button', { name: 'Näytä apteekit lähelläni' });
export const searchingStatus = (page: Page) => page.getByText('Katsotaan, mitkä apteekit ovat auki juuri nyt…');

/**
 * Answers the tile requests (`/tiles/v1/…`). A map of path to file: anything else is a 404.
 * 'hold': never answers, so the searching view stays. A number: every request gets that status.
 */
export async function fakeTiles(page: Page, files: Record<string, unknown> | 'hold' | number): Promise<string[]> {
  const asked: string[] = [];
  await page.route('**/tiles/v1/**', async (route) => {
    const { pathname } = new URL(route.request().url());
    asked.push(pathname);
    if (files === 'hold') return;
    if (typeof files === 'number') await route.fulfill({ status: files, body: '' });
    else if (pathname in files) await route.fulfill({ json: files[pathname] });
    else await route.fulfill({ status: 404, body: '' });
  });
  return asked;
}
