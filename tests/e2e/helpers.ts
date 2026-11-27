import type { BrowserContext, Page } from '@playwright/test';
import { MONDAY_EVENING, KAMPPI, indexOf } from '@/lib/fixtures/tiles';
import { MAP_TILE_HOST, MAP_TILES_URL } from '@/lib/requests';
import { distanceMeters } from '@/lib/geo';
import { INDEX_PATH, encodeTile, tileKey, tileOf, tilePath } from '@/lib/tiles';
import type { TilePharmacy } from '@/lib/tiles';
import { REPORT_PATH } from '@/lib/reports';
import { WAKE_METHOD, WALKING_PATH, WALK_METERS_PER_SECOND, type Walk } from '@/lib/walking';

/**
 * What the flow tests share: a scripted geolocation, so each case behaves the same in
 * Chromium and WebKit, answers for the place lookup, and a way to open the page that waits
 * for React. Nothing here reaches a real service.
 */

export type Mode = 'allow' | 'approximate' | 'deny' | 'unavailable' | 'timeout' | 'timeout-then-allow' | 'ignore' | 'unsupported';

// A position no fixture uses, so that it can be searched for in the requests.
export const HERE = { lat: 60.16952, lon: 24.93545 };

export async function fakeLocation(page: Page, mode: Mode, permission: 'prompt' | 'granted' | 'denied' = 'prompt') {
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
        // Following a walk: the test moves the device with window.walk(), which says how many watches heard it.
        watchPosition(success: PositionCallback) {
          const id = ++watches;
          watching.set(id, success);
          return id;
        },
        clearWatch(id: number) {
          watching.delete(id);
        },
      };
      let watches = 0;
      const watching = new Map<number, PositionCallback>();
      (window as unknown as { walk: (lat: number, lon: number, accuracy?: number) => number }).walk = (lat, lon, accuracy = 15) => {
        for (const success of watching.values()) success({ coords: { latitude: lat, longitude: lon, accuracy }, timestamp: 0 } as GeolocationPosition);
        return watching.size;
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

interface Place {
  lat: number;
  lon: number;
}

export interface WalkingAsked {
  from: Place;
  to: Place[];
  route?: boolean;
}

/** A walk as a pedestrian would have it in a street grid: three tenths longer than the straight line, at 5 km/h. */
export function gridWalk(from: Place, to: Place): Walk {
  const meters = Math.round(distanceMeters(from, to) * 1.3);
  return { meters, seconds: Math.round(meters / WALK_METERS_PER_SECOND) };
}

/**
 * Answers POST /api/walking in place of our server and openrouteservice. By default every
 * destination gets `gridWalk`; `walk` gives one its own answer, or null for no route.
 * A request for a route gets a line of three points between the two places.
 * 'hold': never answers, as a service that is too slow. A number: that status.
 * Returns the requests it was asked, as the server would read them.
 * The wake-up (GET) is not its business: it goes on to the default of fixtures.ts.
 */
export async function fakeWalking(page: Page, answer: 'grid' | 'hold' | number | ((from: Place, to: Place, index: number) => Walk | null | undefined) = 'grid'): Promise<WalkingAsked[]> {
  const asked: WalkingAsked[] = [];
  await page.route(`**${WALKING_PATH}`, async (route) => {
    if (route.request().method() === WAKE_METHOD) return route.fallback();
    const body = route.request().postDataJSON() as WalkingAsked;
    asked.push(body);
    if (answer === 'hold') return;
    if (typeof answer === 'number') return route.fulfill({ status: answer, json: { error: 'upstream' } });
    const walks = body.to.map((to, index) => {
      const own = typeof answer === 'function' ? answer(body.from, to, index) : undefined;
      return own === undefined ? gridWalk(body.from, to) : own;
    });
    const [to] = body.to;
    const line = body.route ? { type: 'LineString', coordinates: [[body.from.lon, body.from.lat], [to.lon, body.from.lat], [to.lon, to.lat]] } : undefined;
    await route.fulfill({ json: { walks, ...(line ? { line } : {}) }, headers: { 'cache-control': 'no-store' } });
  });
  return asked;
}

export interface ReportsAsked {
  /** The query of every request for summaries: "?country=FI". */
  read: string[];
  /** Every report that was sent: its address, its body as text, and its headers. */
  sent: { url: string; body: string; headers: Record<string, string> }[];
}

/**
 * Answers /api/report as our server does with a database: the summaries given, and for a
 * report the status given (201 stored, 429 over the day's limit, 503 not there). A function
 * gives each sending its own status. No test reaches the real route or the database.
 */
export async function fakeReports(page: Page, summaries: Record<string, unknown> = {}, status: number | ((nth: number) => number) = 201): Promise<ReportsAsked> {
  const asked: ReportsAsked = { read: [], sent: [] };
  await page.route(`**${REPORT_PATH}*`, async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      asked.read.push(new URL(request.url()).search);
      return route.fulfill({ json: { summaries } });
    }
    asked.sent.push({ url: request.url(), body: request.postData() ?? '', headers: request.headers() });
    const code = typeof status === 'function' ? status(asked.sent.length) : status;
    const error = code === 429 ? 'limit' : 'upstream';
    await route.fulfill({ status: code, json: code === 201 ? { stored: true } : { error }, headers: { 'cache-control': 'no-store' } });
  });
  return asked;
}

/** Moves the device, as the watch of the live position hears it. Returns how many watches were listening. */
export function walkTo(page: Page, place: { lat: number; lon: number }, accuracy = 15): Promise<number> {
  return page.evaluate(([lat, lon, radius]) => (window as unknown as { walk: (lat: number, lon: number, accuracy: number) => number }).walk(lat, lon, radius), [place.lat, place.lon, accuracy]);
}

/**
 * Answers the map tile host, so that no test reaches it: a description of the tiles, and
 * every tile empty. 'down': the host answers 503. Returns the paths that were asked for.
 * Routed on the context where one is given, which also covers the map's worker.
 */
export async function fakeMapTiles(target: Page | BrowserContext, mode: 'empty' | 'down' = 'empty'): Promise<string[]> {
  const asked: string[] = [];
  const cors = { 'access-control-allow-origin': '*' };
  await target.route(`${MAP_TILE_HOST}/**`, async (route) => {
    const url = new URL(route.request().url());
    asked.push(url.pathname);
    if (mode === 'down') await route.fulfill({ status: 503, body: '', headers: cors });
    else if (url.href === MAP_TILES_URL) await route.fulfill({ json: { tilejson: '3.0.0', tiles: [`${MAP_TILE_HOST}/planet/test/{z}/{x}/{y}.pbf`], minzoom: 0, maxzoom: 14 }, headers: cors });
    else await route.fulfill({ status: 204, body: '', headers: cors });
  });
  return asked;
}

/** Whether this browser can draw the map at all: without WebGL the app keeps the markers on a plain ground. */
export const hasWebGL = (page: Page): Promise<boolean> => page.evaluate(() => !!document.createElement('canvas').getContext('webgl2'));

/** The files of a small world: an index, and one tile per square that has pharmacies. */
export function world(pharmacies: TilePharmacy[], outside = false): Record<string, unknown> {
  const squares = new Map<string, TilePharmacy[]>();
  for (const pharmacy of pharmacies) {
    const key = tileKey(tileOf(pharmacy));
    squares.set(key, [...(squares.get(key) ?? []), pharmacy]);
  }
  const tiles = [...squares].map(([key, list]) => {
    const [x, y] = key.split('/').map(Number);
    return { x, y, pharmacies: list };
  });
  return {
    [INDEX_PATH]: indexOf(tiles, outside ? [tileOf(KAMPPI)] : []),
    ...Object.fromEntries(tiles.map((tile) => [tilePath(tile.x, tile.y), encodeTile(tile)])),
  };
}

/**
 * From the first window to what the tiles say, with the page's clock in the test's hands:
 * Monday 23 November 2026 at 20:41 in Helsinki unless a test says otherwise.
 */
export async function start(page: Page, files: Record<string, unknown> | number, now = MONDAY_EVENING) {
  await page.clock.install({ time: new Date((now - 60) * 1000) });
  await fakeLocation(page, 'allow');
  const asked = await fakeTiles(page, files);
  await open(page, '/fi');
  // From here on the page's clock moves only when the test moves it.
  await page.clock.pauseAt(new Date(now * 1000));
  await locateButton(page).click();
  await settle(page);
  return asked;
}

/**
 * The map views arrive as a chunk of their own, and React holds a view that was waiting
 * for one back for a moment, on a timer. With the clock paused that moment has to be given.
 */
export async function settle(page: Page) {
  await page.clock.runFor(1000);
}

/**
 * The same start with the page's clock running on from the test's moment, for what happens
 * over real time: gestures, the map's own easing, its inertia. Location is already allowed,
 * so the results come by themselves.
 */
export async function startRunning(page: Page, files: Record<string, unknown>, now = MONDAY_EVENING) {
  await page.clock.install({ time: new Date(now * 1000) });
  await fakeLocation(page, 'allow', 'granted');
  const asked = await fakeTiles(page, files);
  await page.goto('/fi');
  return asked;
}

export interface Finger {
  x: number;
  y: number;
}

/**
 * Real touch input, as a phone's screen gives it: Chromium only, through DevTools. Playwright's
 * own touchscreen can tap, and nothing more. Every step waits a frame, as a finger would take.
 */
export async function touchscreen(page: Page) {
  const devtools = await page.context().newCDPSession(page);
  const send = (type: 'touchStart' | 'touchMove' | 'touchEnd', fingers: Finger[]) => devtools.send('Input.dispatchTouchEvent', { type, touchPoints: fingers.map((finger, id) => ({ x: Math.round(finger.x), y: Math.round(finger.y), id })) });
  const between = (from: Finger, to: Finger, share: number): Finger => ({ x: from.x + (to.x - from.x) * share, y: from.y + (to.y - from.y) * share });
  /** Moves every finger from its first place to its last, in steps a frame apart. */
  const move = async (from: Finger[], to: Finger[], steps: number) => {
    await send('touchStart', from);
    for (let step = 1; step <= steps; step++) {
      await send('touchMove', from.map((finger, index) => between(finger, to[index], step / steps)));
      await page.waitForTimeout(16);
    }
    // Held still for a moment: let go without speed, the map stays where it was put.
    await page.waitForTimeout(120);
    await send('touchMove', to);
    await send('touchEnd', []);
  };
  return {
    devtools,
    drag: (from: Finger, to: Finger, steps = 24) => move([from], [to], steps),
    pinch: (from: [Finger, Finger], to: [Finger, Finger], steps = 24) => move(from, to, steps),
    async tap(...fingers: Finger[]) {
      await send('touchStart', fingers);
      await page.waitForTimeout(30);
      await send('touchEnd', []);
    },
    /**
     * A flick: the finger travels from one place to the other and lifts without slowing. All of
     * its touches go out at once, so they bear times a millisecond or so apart on any machine:
     * the fastest flick there is, which the map counts as its fastest (lib/map/glide.ts).
     * A flick with a speed of its own can't be sent from here. A touch bears the time it was
     * sent at, whatever time it is given, and sent one by one a step takes thirty milliseconds
     * on a Mac and over a hundred in CI, which is a finger that stops and starts. Chromium's own
     * synthesizeScrollGesture makes a true flick on a Mac and moves nothing in CI's Linux.
     */
    async flick(from: Finger, to: Finger, steps = 6) {
      const sent = [send('touchStart', [from])];
      for (let step = 1; step <= steps; step++) sent.push(send('touchMove', [between(from, to, step / steps)]));
      sent.push(send('touchEnd', []));
      await Promise.all(sent);
    },
    /** A finger laid on the screen and left there. `slide` moves it, `lift` takes it off. */
    async hold(at: Finger) {
      await send('touchStart', [at]);
    },
    async slide(from: Finger, to: Finger, steps = 12) {
      for (let step = 1; step <= steps; step++) {
        await send('touchMove', [between(from, to, step / steps)]);
        await page.waitForTimeout(16);
      }
    },
    async lift() {
      await send('touchEnd', []);
    },
    /** A tap as a thumb makes it: the finger rolls a few pixels between touching and lifting. */
    async roll(from: Finger, to: Finger) {
      await send('touchStart', [from]);
      for (let step = 1; step <= 4; step++) {
        await page.waitForTimeout(16);
        await send('touchMove', [between(from, to, step / 4)]);
      }
      await page.waitForTimeout(30);
      await send('touchEnd', []);
    },
  };
}
