import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FUNCTION_REGION, Gate, MATRIX_TIMEOUT_MS, OWN_LIMITS, PLAN_LIMITS, readRequest, resetWalking, walking, type Deps } from '@/lib/server/routing';
import { MAX_DESTINATIONS, WALKING_WAIT_MS } from '@/lib/walking';

/** Kamppi, and places around it: none of these is anyone's position. */
const HERE = { lat: 60.16952, lon: 24.93545 };
const near = (north: number, east: number) => ({ lat: HERE.lat + north / 111_320, lon: HERE.lon + east / 55_400 });
const THREE = [near(120, 60), near(-260, 180), near(900, -300)];
const KEY = 'test-key-not-a-real-one';

const matrixAnswer = (seconds: (number | null)[], meters: (number | null)[]) => ({ durations: [seconds], distances: [meters], metadata: {} });
const routeAnswer = (coordinates: unknown[] = [[24.93545, 60.16952], [24.9361, 60.1701], [24.93653, 60.1706]]) => ({
  type: 'FeatureCollection',
  features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates }, properties: { summary: { distance: 151.4, duration: 109.1 } } }],
});

/** A fake clock and a fake openrouteservice: no test here touches the network or the time. */
function setup(answer: unknown = matrixAnswer([109.1, 240.6, 713.3], [151.4, 334.2, 990.7]), status = 200, headers: Record<string, string> = {}) {
  let time = Date.UTC(2026, 10, 24, 10, 0, 0);
  const reply = { answer, status, headers };
  const fetch = vi.fn<(...args: unknown[]) => Promise<Response>>(async () => new Response(JSON.stringify(reply.answer), { status: reply.status, headers: reply.headers }));
  const deps: Partial<Deps> = { fetch: fetch as unknown as typeof globalThis.fetch, now: () => time, key: KEY };
  return { deps, fetch, reply, advance: (ms: number) => (time += ms) };
}

const sent = (fetch: ReturnType<typeof setup>['fetch'], call = 0) => {
  const [url, init] = fetch.mock.calls[call] as unknown as [string, RequestInit];
  return { url, headers: init.headers as Record<string, string>, body: JSON.parse(init.body as string), init };
};

beforeEach(() => resetWalking());

describe('walking times', () => {
  it('asks openrouteservice once, from the position to every destination, on foot', async () => {
    const { deps, fetch } = setup();
    await expect(walking({ from: HERE, to: THREE }, deps)).resolves.toEqual({
      status: 'walks',
      walks: [
        { meters: 151, seconds: 109 },
        { meters: 334, seconds: 241 },
        { meters: 991, seconds: 713 },
      ],
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    const { url, headers, body } = sent(fetch);
    expect(url).toBe('https://api.heigit.org/openrouteservice/v2/matrix/foot-walking');
    expect(headers.Authorization).toBe(KEY);
    // Longitude first, as openrouteservice wants it; the position is the one source.
    expect(body).toEqual({
      locations: [[24.93545, 60.16952], ...THREE.map((place) => [Math.round(place.lon * 1e5) / 1e5, Math.round(place.lat * 1e5) / 1e5])],
      sources: [0],
      destinations: [1, 2, 3],
      metrics: ['distance', 'duration'],
      units: 'm',
    });
  });

  it('gives null for a destination with no walking route, and keeps the rest', async () => {
    const { deps } = setup(matrixAnswer([109, null, 713], [151, null, 991]));
    const result = await walking({ from: HERE, to: THREE }, deps);
    expect(result).toEqual({ status: 'walks', walks: [{ meters: 151, seconds: 109 }, null, { meters: 991, seconds: 713 }] });
  });

  it('does not call openrouteservice without a key', async () => {
    const { deps, fetch } = setup();
    await expect(walking({ from: HERE, to: THREE }, { ...deps, key: undefined })).resolves.toEqual({ status: 'unavailable', reason: 'not-configured' });
    await expect(walking({ from: HERE, to: THREE }, { ...deps, key: '' })).resolves.toEqual({ status: 'unavailable', reason: 'not-configured' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('never passes the key or the upstream answer on when something fails', async () => {
    const { deps } = setup({ error: { code: 6099, message: `secret ${KEY}` } }, 500);
    const result = await walking({ from: HERE, to: THREE }, deps);
    expect(result).toEqual({ status: 'unavailable', reason: 'upstream' });
    expect(JSON.stringify(result)).not.toContain(KEY);
  });

  it('treats an answer of another shape as no answer', async () => {
    for (const answer of [{}, { durations: [[1, 2]], distances: [[1, 2]] }, { durations: 'x' }, null, matrixAnswer([1, 2, 3], [1, 2])]) {
      resetWalking();
      const { deps } = setup(answer);
      await expect(walking({ from: HERE, to: THREE }, deps)).resolves.toEqual({ status: 'unavailable', reason: 'upstream' });
    }
  });

  it('gives openrouteservice less time than the list waits', async () => {
    const { deps, fetch } = setup();
    fetch.mockImplementationOnce(async (...args: unknown[]) => {
      const { signal } = args[1] as RequestInit;
      expect(signal).toBeInstanceOf(AbortSignal);
      throw new DOMException('The operation timed out.', 'TimeoutError');
    });
    await expect(walking({ from: HERE, to: THREE }, deps)).resolves.toEqual({ status: 'unavailable', reason: 'upstream' });
    expect(MATRIX_TIMEOUT_MS).toBeLessThan(WALKING_WAIT_MS);
  });

  it('runs in Frankfurt: vercel.json puts every function where the module says', () => {
    const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as { regions?: string[]; functions?: Record<string, unknown> };
    expect(FUNCTION_REGION).toBe('fra1');
    expect(config.regions).toEqual([FUNCTION_REGION]);
    // No function has a region of its own: one left in Washington would be slow again.
    expect(JSON.stringify(config.functions ?? {})).not.toContain('regions');
  });
});

describe('the walking route', () => {
  it('asks for one route on foot and answers with its line, longitude first', async () => {
    const { deps, fetch } = setup(routeAnswer());
    await expect(walking({ from: HERE, to: [THREE[0]], route: true }, deps)).resolves.toEqual({
      status: 'route',
      walks: [{ meters: 151, seconds: 109 }],
      line: { type: 'LineString', coordinates: [[24.93545, 60.16952], [24.9361, 60.1701], [24.93653, 60.1706]] },
    });
    const { url, body } = sent(fetch);
    expect(url).toBe('https://api.heigit.org/openrouteservice/v2/directions/foot-walking/geojson');
    expect(body).toEqual({ coordinates: [[24.93545, 60.16952], [24.93653, 60.1706]], instructions: false });
  });

  it('thins a very long line and keeps both ends', async () => {
    const long = Array.from({ length: 5000 }, (_, index) => [24.9 + index * 0.00001, 60.1 + index * 0.00001]);
    const { deps } = setup(routeAnswer(long));
    const result = await walking({ from: HERE, to: [THREE[0]], route: true }, deps);
    if (result.status !== 'route') throw new Error(result.status);
    expect(result.line.coordinates.length).toBeLessThanOrEqual(1500);
    expect(result.line.coordinates[0]).toEqual([24.9, 60.1]);
    expect(result.line.coordinates.at(-1)).toEqual([24.94999, 60.14999]);
  });

  it('says so when openrouteservice finds no route, and does not count it as a failure', async () => {
    const { deps, fetch, reply } = setup({ error: { code: 2010, message: 'Could not find point 1' } }, 404);
    for (let i = 0; i < 5; i++) await expect(walking({ from: HERE, to: [THREE[0]], route: true }, deps)).resolves.toEqual({ status: 'unavailable', reason: 'upstream' });
    // It was answered each time: nothing paused, so the next one is asked too.
    reply.answer = routeAnswer();
    reply.status = 200;
    await expect(walking({ from: HERE, to: [THREE[0]], route: true }, deps)).resolves.toMatchObject({ status: 'route' });
    expect(fetch).toHaveBeenCalledTimes(6);
  });

  it('refuses a line that is not one', async () => {
    for (const coordinates of [[[24.9, 60.1]], [[24.9, 60.1], ['x', 60.2]], [[24.9, 60.1], [24.9, 160]]]) {
      resetWalking();
      const { deps } = setup(routeAnswer(coordinates));
      await expect(walking({ from: HERE, to: [THREE[0]], route: true }, deps)).resolves.toEqual({ status: 'unavailable', reason: 'upstream' });
    }
  });
});

describe('what the route accepts', () => {
  it('reads a position and up to twenty destinations', () => {
    expect(readRequest({ from: HERE, to: THREE })).toEqual({ from: HERE, to: THREE, route: false });
    expect(readRequest({ from: HERE, to: Array.from({ length: MAX_DESTINATIONS }, (_, index) => near(index * 100, 0)) })?.to).toHaveLength(20);
  });

  it('refuses what it should not pass on', async () => {
    const tooMany = Array.from({ length: MAX_DESTINATIONS + 1 }, (_, index) => near(index * 100, 0));
    const invalid: unknown[] = [
      null,
      'text',
      [],
      {},
      { from: HERE },
      { from: HERE, to: [] },
      { from: HERE, to: tooMany },
      { from: { lat: 91, lon: 0 }, to: THREE },
      { from: { lat: '60.1', lon: 24.9 }, to: THREE },
      { from: { lat: Number.NaN, lon: 24.9 }, to: THREE },
      { from: HERE, to: [{ lat: 60.17 }] },
      { from: HERE, to: 'near' },
      // Farther than any search reaches: 50 km.
      { from: HERE, to: [near(51_000, 0)] },
      // A route is to one place, and is a walk.
      { from: HERE, to: THREE, route: true },
      { from: HERE, to: [near(11_000, 0)], route: true },
      { from: HERE, to: [THREE[0]], route: 'yes' },
    ];
    const { deps, fetch } = setup();
    for (const body of invalid) {
      expect(readRequest(body), JSON.stringify(body)).toBeUndefined();
      await expect(walking(body, deps)).resolves.toEqual({ status: 'invalid' });
    }
    expect(fetch).not.toHaveBeenCalled();
    // The edges themselves are fine.
    expect(readRequest({ from: HERE, to: [near(49_000, 0)] })).toBeDefined();
    expect(readRequest({ from: HERE, to: [near(9_000, 0)], route: true })).toBeDefined();
    expect(readRequest({ from: HERE, to: [THREE[0]], route: false })).toEqual({ from: HERE, to: [THREE[0]], route: false });
  });
});

describe('the budget', () => {
  it('our own limits stay under the plan', () => {
    for (const kind of ['matrix', 'directions'] as const) {
      expect(OWN_LIMITS[kind].perMinute).toBeLessThan(PLAN_LIMITS[kind].perMinute);
      expect(OWN_LIMITS[kind].perDay).toBeLessThan(PLAN_LIMITS[kind].perDay);
    }
    expect(PLAN_LIMITS).toEqual({ matrix: { perMinute: 40, perDay: 500 }, directions: { perMinute: 40, perDay: 2000 } });
  });

  it('stops at the minute limit and goes on when the minute has passed', async () => {
    const { deps, fetch, advance } = setup();
    for (let i = 0; i < OWN_LIMITS.matrix.perMinute; i++) {
      await expect(walking({ from: HERE, to: THREE }, deps)).resolves.toMatchObject({ status: 'walks' });
      advance(1000);
    }
    await expect(walking({ from: HERE, to: THREE }, deps)).resolves.toEqual({ status: 'unavailable', reason: 'budget' });
    expect(fetch).toHaveBeenCalledTimes(OWN_LIMITS.matrix.perMinute);
    // The first request of the minute is now more than a minute old.
    advance(60_000 - OWN_LIMITS.matrix.perMinute * 1000 + 1);
    await expect(walking({ from: HERE, to: THREE }, deps)).resolves.toMatchObject({ status: 'walks' });
  });

  it('counts times and routes apart: a minute full of one leaves the other', async () => {
    const { deps, reply } = setup();
    for (let i = 0; i < OWN_LIMITS.matrix.perMinute; i++) await walking({ from: HERE, to: THREE }, deps);
    await expect(walking({ from: HERE, to: THREE }, deps)).resolves.toEqual({ status: 'unavailable', reason: 'budget' });
    reply.answer = routeAnswer();
    await expect(walking({ from: HERE, to: [THREE[0]], route: true }, deps)).resolves.toMatchObject({ status: 'route' });
  });

  it('stops at the day limit until midnight UTC', () => {
    const gate = new Gate({ perMinute: 1000, perDay: 5 });
    let now = Date.UTC(2026, 10, 24, 23, 50, 0);
    for (let i = 0; i < 5; i++) expect(gate.take(now)).toBe('ok');
    expect(gate.take(now)).toBe('budget');
    now += 9 * 60_000; // 23:59
    expect(gate.take(now)).toBe('budget');
    now += 60_000; // 00:00
    expect(gate.take(now)).toBe('ok');
  });

  it('after a 429 it waits a minute, then twice as long each time, and never more than an hour', () => {
    const gate = new Gate({ perMinute: 1000, perDay: 100_000 });
    let now = 0;
    const waits: number[] = [];
    for (let i = 0; i < 9; i++) {
      expect(gate.take(now)).toBe('ok');
      gate.report({ kind: 'limited' }, now);
      const from = now;
      while (gate.take(now) === 'paused') now += 1000;
      waits.push((now - from) / 60_000);
      // That probe is itself answered with a 429 on the next round.
    }
    expect(waits).toEqual([1, 2, 4, 8, 16, 32, 60, 60, 60]);
  });

  it('a 429 that says how long to wait is believed, an answer afterwards starts the count again', () => {
    const gate = new Gate({ perMinute: 1000, perDay: 100_000 });
    gate.take(0);
    gate.report({ kind: 'limited', retryAfterMs: 5 * 60_000 }, 0);
    expect(gate.take(4 * 60_000)).toBe('paused');
    expect(gate.take(5 * 60_000)).toBe('ok');
    gate.report({ kind: 'answered' }, 5 * 60_000);
    gate.take(6 * 60_000);
    gate.report({ kind: 'limited' }, 6 * 60_000);
    // Back to one minute, not two.
    expect(gate.take(6 * 60_000 + 59_000)).toBe('paused');
    expect(gate.take(7 * 60_000)).toBe('ok');
  });

  it('reads Retry-After from a 429 and stops asking meanwhile', async () => {
    const { deps, fetch, reply, advance } = setup({ error: 'Rate limit exceeded' }, 429, { 'retry-after': '120' });
    await expect(walking({ from: HERE, to: THREE }, deps)).resolves.toEqual({ status: 'unavailable', reason: 'upstream' });
    advance(119_000);
    await expect(walking({ from: HERE, to: THREE }, deps)).resolves.toEqual({ status: 'unavailable', reason: 'paused' });
    expect(fetch).toHaveBeenCalledTimes(1);
    reply.answer = matrixAnswer([1, 2, 3], [1, 2, 3]);
    reply.status = 200;
    advance(1000);
    await expect(walking({ from: HERE, to: THREE }, deps)).resolves.toMatchObject({ status: 'walks' });
  });

  it('three failures in a row and it stops asking for half a minute, then longer', async () => {
    const { deps, fetch, advance } = setup({}, 503);
    for (let i = 0; i < 3; i++) await expect(walking({ from: HERE, to: THREE }, deps)).resolves.toEqual({ status: 'unavailable', reason: 'upstream' });
    await expect(walking({ from: HERE, to: THREE }, deps)).resolves.toEqual({ status: 'unavailable', reason: 'paused' });
    expect(fetch).toHaveBeenCalledTimes(3);
    advance(30_000);
    // One try: it fails too, and the pause is a minute now.
    await expect(walking({ from: HERE, to: THREE }, deps)).resolves.toEqual({ status: 'unavailable', reason: 'upstream' });
    advance(59_000);
    await expect(walking({ from: HERE, to: THREE }, deps)).resolves.toEqual({ status: 'unavailable', reason: 'paused' });
    advance(1000);
    await walking({ from: HERE, to: THREE }, deps);
    expect(fetch).toHaveBeenCalledTimes(5);
  });

  it('one answer between failures and nothing pauses', async () => {
    const { deps, fetch, reply } = setup({}, 503);
    for (let round = 0; round < 4; round++) {
      reply.status = 503;
      await walking({ from: HERE, to: THREE }, deps);
      await walking({ from: HERE, to: THREE }, deps);
      reply.status = 200;
      reply.answer = matrixAnswer([1, 2, 3], [1, 2, 3]);
      await expect(walking({ from: HERE, to: THREE }, deps)).resolves.toMatchObject({ status: 'walks' });
    }
    expect(fetch).toHaveBeenCalledTimes(12);
  });

  it('a refused key is not tried again for ten minutes', async () => {
    const { deps, fetch, advance } = setup({ error: 'Access to this API has been disallowed' }, 403);
    await expect(walking({ from: HERE, to: THREE }, deps)).resolves.toEqual({ status: 'unavailable', reason: 'upstream' });
    advance(9 * 60_000);
    await expect(walking({ from: HERE, to: THREE }, deps)).resolves.toEqual({ status: 'unavailable', reason: 'paused' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
