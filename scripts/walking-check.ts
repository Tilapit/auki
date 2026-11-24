/**
 * `npm run walking:check`: three real requests to openrouteservice, to see that the key in
 * .env.local works and what the service answers. One raw Matrix request, to print the status
 * and the response headers that say how much of the budget is left; then one Matrix and one
 * Directions request through our own code (lib/server/routing.ts), as /api/walking makes them.
 *
 * The places are invented, around Kamppi in Helsinki, as in the test fixtures: nobody's
 * position and no real pharmacy. The key is read from the environment and never printed.
 * Three requests of the day's 500 and 2,000.
 */

import { walking } from '../lib/server/routing.ts';

const KAMPPI = { lat: 60.16952, lon: 24.93545 };
/** Metres north and east of it. The last one is across the bay: a long way round on foot. */
const PLACES: [name: string, north: number, east: number][] = [
  ['120 m north-east', 120, 60],
  ['320 m south-east', -260, 180],
  ['570 m south-west', -420, -380],
  ['950 m north', 900, -300],
  ['1.6 km east', 500, 1500],
  ['3.3 km west, across the water', -1000, -3200],
];
const to = PLACES.map(([, north, east]) => ({ lat: Math.round((KAMPPI.lat + north / 111_320) * 1e5) / 1e5, lon: Math.round((KAMPPI.lon + east / 55_400) * 1e5) / 1e5 }));

const key = process.env.ORS_API_KEY;
if (!key) {
  console.log('ORS_API_KEY is not set in .env.local: nothing was asked.');
  process.exit(1);
}

const started = Date.now();
const raw = await fetch('https://api.openrouteservice.org/v2/matrix/foot-walking', {
  method: 'POST',
  headers: { Authorization: key, 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ locations: [[KAMPPI.lon, KAMPPI.lat], ...to.map((place) => [place.lon, place.lat])], sources: [0], destinations: to.map((_, index) => index + 1), metrics: ['distance', 'duration'], units: 'm' }),
  signal: AbortSignal.timeout(10_000),
}).catch((error: unknown) => error);

if (!(raw instanceof Response)) {
  console.log('Matrix, raw: no answer.', raw instanceof Error ? raw.name : '');
  process.exit(1);
}
console.log(`Matrix, raw: HTTP ${raw.status} in ${Date.now() - started} ms`);
// The headers that speak of limits, whatever they are called: their names are not in the documentation.
for (const [name, value] of raw.headers) {
  if (/ratelimit|rate-limit|retry-after|quota/i.test(name)) console.log(`  ${name}: ${value}`);
}
if (!raw.ok) {
  // The body of a refusal says why, and holds nothing of ours.
  console.log(`  ${(await raw.text()).slice(0, 300)}`);
  process.exit(1);
}

const times = await walking({ from: KAMPPI, to });
if (times.status !== 'walks') {
  console.log('Walking times, through our code:', JSON.stringify(times));
  process.exit(1);
}
console.log(`Walking times, through our code: ${times.walks.length} answers`);
PLACES.forEach(([name], index) => {
  const walk = times.walks[index];
  console.log(`  ${name}: ${walk ? `${walk.meters} m, ${walk.seconds} s` : 'no walking route'}`);
});

const routeStarted = Date.now();
const route = await walking({ from: KAMPPI, to: [to[0]], route: true });
if (route.status !== 'route') {
  console.log('Route, through our code:', JSON.stringify(route));
  process.exit(1);
}
console.log(`Route, through our code: ${route.line.coordinates.length} points, ${route.walks[0].meters} m, ${route.walks[0].seconds} s, in ${Date.now() - routeStarted} ms`);
