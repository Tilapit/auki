import { describe, expect, it } from 'vitest';
import { carriesPosition } from '@/lib/requests';
import type { Found, TilePharmacy } from '@/lib/tiles';
import { MAX_DESTINATIONS, WALK_METERS_PER_SECOND, atLeastStraight, byWalking, readLine, readWalks, routeLine, walkMinutes, walkingBody, type Walks } from '@/lib/walking';

const HERE = { lat: 60.1695234, lon: 24.9354478 };

const found = (id: string, meters: number): Found => ({ pharmacy: { id, lat: HERE.lat + meters / 111_320, lon: HERE.lon } as TilePharmacy, meters });
const ids = (list: Found[]) => list.map((entry) => entry.pharmacy.id);
const walks = (entries: Record<string, [meters: number, seconds: number]>): Walks => new Map(Object.entries(entries).map(([id, [meters, seconds]]) => [id, { meters, seconds }]));

describe('the walking request', () => {
  it('carries the position and the destinations, to about a metre, and nothing else', () => {
    const body = JSON.parse(walkingBody(HERE, [{ lat: 60.1706012, lon: 24.9365311 }]));
    expect(body).toEqual({ from: { lat: 60.16952, lon: 24.93545 }, to: [{ lat: 60.1706, lon: 24.93653 }] });
    // It is the one request that may: the privacy test lets this path through and no other.
    expect(carriesPosition(walkingBody(HERE, []), { lat: 60.16952, lon: 24.93545 })).toBe(true);
  });

  it('asks for a route to one place with `route`', () => {
    expect(JSON.parse(walkingBody(HERE, [{ lat: 60.17, lon: 24.94 }], true))).toEqual({ from: { lat: 60.16952, lon: 24.93545 }, to: [{ lat: 60.17, lon: 24.94 }], route: true });
  });

  it('never names more destinations than the server takes', () => {
    const many = Array.from({ length: 30 }, (_, index) => ({ lat: 60 + index / 1000, lon: 24 }));
    expect(JSON.parse(walkingBody(HERE, many)).to).toHaveLength(MAX_DESTINATIONS);
  });
});

describe('reading the answer', () => {
  const candidates = [found('a', 100), found('b', 250), found('c', 400)];

  it('gives each candidate its walk, by id', () => {
    const read = readWalks({ walks: [{ meters: 140, seconds: 101 }, { meters: 300, seconds: 216 }, { meters: 900, seconds: 648 }] }, candidates);
    expect([...read!]).toEqual([
      ['a', { meters: 140, seconds: 101 }],
      ['b', { meters: 300, seconds: 216 }],
      ['c', { meters: 900, seconds: 648 }],
    ]);
  });

  it('leaves out a candidate with no walking route', () => {
    const read = readWalks({ walks: [{ meters: 140, seconds: 101 }, null, { meters: 900, seconds: 648 }] }, candidates);
    expect([...read!.keys()]).toEqual(['a', 'c']);
  });

  it('is no answer at all when it is not what was asked for', () => {
    const wrong: unknown[] = [
      null,
      {},
      { walks: 'soon' },
      // One too few, one too many.
      { walks: [{ meters: 1, seconds: 1 }, null] },
      { walks: [null, null, null, null] },
      { walks: [{ meters: '140', seconds: 101 }, null, null] },
      { walks: [{ meters: -1, seconds: 101 }, null, null] },
      { walks: [{ meters: 140, seconds: Number.POSITIVE_INFINITY }, null, null] },
      { walks: [7, null, null] },
      // No route to any of them: nothing to order the list by.
      { walks: [null, null, null] },
    ];
    for (const answer of wrong) expect(readWalks(answer, candidates), JSON.stringify(answer)).toBeUndefined();
  });

  it('a walk is never shorter than the straight line', () => {
    // The route was measured between two points of the street network that lie closer together.
    const read = readWalks({ walks: [{ meters: 12, seconds: 9 }, null, null] }, candidates);
    expect(read!.get('a')).toEqual({ meters: 100, seconds: Math.round(100 / WALK_METERS_PER_SECOND) });
    expect(atLeastStraight({ meters: 300, seconds: 216 }, 250)).toEqual({ meters: 300, seconds: 216 });
    // 250 m at 5 km/h is three minutes.
    expect(atLeastStraight({ meters: 260, seconds: 100 }, 250)).toEqual({ meters: 260, seconds: 180 });
  });

  it('reads at most as many as it asked about', () => {
    const many = Array.from({ length: 25 }, (_, index) => found(`n${index}`, 100 * (index + 1)));
    const answer = { walks: many.slice(0, MAX_DESTINATIONS).map((entry) => ({ meters: entry.meters * 2, seconds: entry.meters })) };
    expect(readWalks(answer, many)!.size).toBe(MAX_DESTINATIONS);
  });
});

describe('the order of the list', () => {
  const candidates = [found('a', 100), found('b', 250), found('c', 400), found('d', 600)];

  it('is the straight-line order without walking times', () => {
    expect(ids(byWalking(candidates, undefined))).toEqual(['a', 'b', 'c', 'd']);
  });

  it('is by walking time: a pharmacy across the river drops to where it belongs', () => {
    // "a" is 100 m away across the water, and a quarter of an hour on foot.
    expect(ids(byWalking(candidates, walks({ a: [1250, 900], b: [300, 216], c: [520, 374], d: [700, 504] })))).toEqual(['b', 'c', 'd', 'a']);
  });

  it('puts a pharmacy with no walking route after all that have one', () => {
    expect(ids(byWalking(candidates, walks({ b: [300, 216], d: [280, 202] })))).toEqual(['d', 'b', 'a', 'c']);
  });

  it('keeps the straight-line order among equals', () => {
    expect(ids(byWalking(candidates, walks({ a: [300, 216], b: [300, 216], c: [290, 216], d: [300, 216] })))).toEqual(['c', 'a', 'b', 'd']);
  });

  it('changes nothing in what it was given', () => {
    const before = ids(candidates);
    byWalking(candidates, walks({ a: [1250, 900], b: [300, 216] }));
    expect(ids(candidates)).toEqual(before);
  });
});

describe('walking minutes', () => {
  it('rounds up, and is never less than one', () => {
    expect(walkMinutes(0)).toBe(1);
    expect(walkMinutes(20)).toBe(1);
    expect(walkMinutes(60)).toBe(1);
    expect(walkMinutes(61)).toBe(2);
    expect(walkMinutes(158)).toBe(3); // 220 m
    expect(walkMinutes(180)).toBe(3);
    expect(walkMinutes(181)).toBe(4);
  });
});

describe('the route line', () => {
  const line = { type: 'LineString' as const, coordinates: [[24.9356, 60.1697], [24.9361, 60.1701]] as [number, number][] };

  it('is read from the answer, longitude first', () => {
    expect(readLine({ walks: [{ meters: 151, seconds: 109 }], line })).toEqual(line);
  });

  it('is nothing when the answer has no line, or one that is not a line', () => {
    const wrong: unknown[] = [null, {}, { line: null }, { line: { type: 'Point', coordinates: [24.9, 60.1] } }, { line: { type: 'LineString', coordinates: [[24.9, 60.1]] } }, { line: { type: 'LineString', coordinates: [[24.9, 60.1], [24.9, 95]] } }, { line: { type: 'LineString', coordinates: [[24.9, 60.1], ['24.9', 60.2]] } }];
    for (const answer of wrong) expect(readLine(answer), JSON.stringify(answer)).toBeUndefined();
  });

  it('is drawn from the dot to the marker: both ends are joined to the street', () => {
    const to = { lat: 60.1703, lon: 24.9363 };
    expect(routeLine(HERE, line, to).coordinates).toEqual([[HERE.lon, HERE.lat], [24.9356, 60.1697], [24.9361, 60.1701], [24.9363, 60.1703]]);
  });
});
