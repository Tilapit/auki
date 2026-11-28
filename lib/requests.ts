/**
 * Every request the app may make (PLAN.md 7.6), in one place. The Content-Security-Policy,
 * the privacy test and the "what the app sends" page (components/PrivacyPage.tsx) are built
 * from it, so the three can't drift apart.
 *
 * The claim it backs is narrow, so that it can be checked: the position leaves the device
 * in one request, POST /api/walking, and the page talks to one third party, the map tile
 * host.
 */

/**
 * The map's vector tiles, as a TileJSON address: OpenFreeMap unless NEXT_PUBLIC_MAP_TILES_URL
 * names another host with the same schema (PLAN.md, decision D6). The style is our own
 * (lib/map/style.ts), so this one value is all that changes with the host.
 */
export const MAP_TILES_URL = process.env.NEXT_PUBLIC_MAP_TILES_URL || 'https://tiles.openfreemap.org/planet';

/** The one third party: the host of those tiles, fetched by the map as squares come on screen. */
export const MAP_TILE_HOST = new URL(MAP_TILES_URL).origin;

export interface AppRequest {
  id: 'page' | 'tiles' | 'geocode' | 'wake' | 'walking' | 'mapTiles' | 'reports' | 'report';
  /** Our own origin, or the origin of the third party. */
  origin: string;
  /** Paths the request can have, as prefixes. */
  paths: string[];
  /** What it carries about where the user is. */
  carries:
    | 'nothing'
    | 'squares of 20 to 30 km'
    | 'the text typed'
    | 'the exact position'
    | 'the map squares on screen'
    | 'the country of the pharmacy whose details were opened'
    | 'one pharmacy, its country and the chips pressed';
  /** The milestone it arrives with. */
  since: 'M0' | 'M1' | 'M3' | 'M4' | 'M5' | 'MR';
}

export const REQUESTS: AppRequest[] = [
  { id: 'page', origin: 'self', paths: ['/'], carries: 'nothing', since: 'M0' },
  { id: 'tiles', origin: 'self', paths: ['/tiles/'], carries: 'squares of 20 to 30 km', since: 'M3' },
  { id: 'geocode', origin: 'self', paths: ['/api/geocode'], carries: 'the text typed', since: 'M1' },
  // The wake-up (PLAN.md 7.1, step 4; 28 Nov 2026, after M5): a GET to the walking function when the app
  // starts looking for a position, so that the request below does not meet a function that is still starting.
  { id: 'wake', origin: 'self', paths: ['/api/walking'], carries: 'nothing', since: 'M5' },
  { id: 'walking', origin: 'self', paths: ['/api/walking'], carries: 'the exact position', since: 'M5' },
  { id: 'mapTiles', origin: MAP_TILE_HOST, paths: ['/'], carries: 'the map squares on screen', since: 'M4' },
  // Visitors' reports (PLAN.md 7.10): what others told, read per country; and one's own report, sent only when the user sends it.
  { id: 'reports', origin: 'self', paths: ['/api/report'], carries: 'the country of the pharmacy whose details were opened', since: 'MR' },
  { id: 'report', origin: 'self', paths: ['/api/report'], carries: 'one pharmacy, its country and the chips pressed', since: 'MR' },
];

/** The only request that may carry the position. */
export const POSITION_REQUEST = { method: 'POST', path: '/api/walking' } as const;

/**
 * The wake-up of the same function: another method on the same path, so it is not the request
 * above, and the privacy test holds it to what every other request is held to. It carries nothing.
 */
export const WAKE_REQUEST = { method: 'GET', path: '/api/walking' } as const;

export const THIRD_PARTY_ORIGINS: string[] = [...new Set(REQUESTS.map((request) => request.origin).filter((origin) => origin !== 'self'))];

/** True for a URL the app may request: our own origin, or the map tile host. */
export function isAllowedUrl(url: string, ownOrigin: string): boolean {
  const { origin } = new URL(url);
  return origin === ownOrigin || THIRD_PARTY_ORIGINS.includes(origin);
}

/**
 * Whether a number in a URL, header or body gives a position away: the coordinate at three
 * decimals or more (about a hundred metres). Tile numbers and rounded-off values don't.
 */
export function carriesPosition(text: string, position: { lat: number; lon: number }): boolean {
  const prefix = (value: number) => {
    const [whole, decimals = ''] = String(value).split('.');
    return decimals.length >= 3 ? `${whole}.${decimals.slice(0, 3)}` : undefined;
  };
  return [prefix(position.lat), prefix(position.lon)].some((needle) => needle !== undefined && text.includes(needle));
}

/** The requests that are sent with a body. Every other one is a GET, as a browser's network panel shows it. */
const POSTED: ReadonlySet<string> = new Set(['walking', 'report']);

export function methodOf(request: AppRequest): 'GET' | 'POST' {
  return POSTED.has(request.id) ? 'POST' : 'GET';
}

/**
 * Where a request shows in the browser's own network panel: its path on our origin, or the
 * third party's host. The "what the app sends" page prints it beside the request's name, so
 * that the list can be held against what the browser did.
 */
export function addressOf(request: AppRequest): string {
  return request.origin === 'self' ? request.paths[0] : new URL(request.origin).host;
}

/**
 * What the user opens themself. These are not requests of the app's: each is a link to another
 * site or app, in a tab of its own and without a referrer (components/NewTab.tsx), to hosts the
 * page itself may never call. Listed so that the page says what such a link carries.
 */
export const OPENED_BY_USER = [
  // The route in a map app, a phone number, a pharmacy's email and website, OpenStreetMap's note form, the official pages the app points to, the map's credits.
  { id: 'links', carries: "the pharmacy's position or nothing" },
  // A country's own medicine stock search (PLAN.md 7.9), opened from the medicine dialog.
  { id: 'medicine', carries: 'the medicine name as typed, where the service takes one' },
] as const;

export interface HeaderOptions {
  /** `next dev`: React needs eval for its error overlay, and hot reloading a socket. */
  development: boolean;
  /** The /dev pages exist: /dev/states shows the views in frames of our own origin. */
  devRoutes: boolean;
}

/**
 * `connect-src 'self'` plus the map tile host is the line that stops the page from calling
 * anyone else, whatever the code tries.
 *
 * script-src and style-src allow inline code: the pages are static, and Next.js can give
 * inline scripts a nonce only on pages rendered on demand, which would cost the cached
 * shell. Tightening them with hashes is tried in M7.
 */
export function contentSecurityPolicy({ development, devRoutes }: HeaderOptions): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", ...(development ? ["'unsafe-eval'"] : [])],
    'style-src': ["'self'", "'unsafe-inline'"],
    // Our own files and inline SVG. The map draws on a canvas from vector data and loads no image.
    'img-src': ["'self'", 'data:'],
    // No font is fetched from anywhere: the type is the device's own, on the map too. (`next dev` shows its own overlay in a font of ours.)
    'font-src': [development ? "'self'" : "'none'"],
    'connect-src': ["'self'", ...THIRD_PARTY_ORIGINS, ...(development ? ['ws:', 'wss:'] : [])],
    // The map's worker is a file on our own origin (scripts/copy-map-worker.mjs): no blob: worker.
    'worker-src': ["'self'"],
    'manifest-src': ["'self'"],
    'frame-ancestors': [devRoutes ? "'self'" : "'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"],
  };
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ');
}

/**
 * The line of the policy that holds the page to the list, as a visitor's browser gets it:
 * the "what the app sends" page prints it.
 */
export function connectSources(): string {
  const directive = contentSecurityPolicy({ development: false, devRoutes: false })
    .split('; ')
    .find((line) => line.startsWith('connect-src '));
  return directive ?? '';
}

const PERMISSIONS = ['geolocation=(self)', 'screen-wake-lock=(self)', 'camera=()', 'microphone=()', 'payment=()', 'usb=()', 'accelerometer=()', 'gyroscope=()', 'magnetometer=()', 'browsing-topics=()'];

export function securityHeaders(options: HeaderOptions): { key: string; value: string }[] {
  return [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(options) },
    // Links the user taps (map apps, a pharmacy's website) learn nothing about where they came from.
    { key: 'Referrer-Policy', value: 'no-referrer' },
    { key: 'Permissions-Policy', value: PERMISSIONS.join(', ') },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
  ];
}
