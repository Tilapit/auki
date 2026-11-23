const TILE = 256;

/** Web Mercator: latitude and longitude to world pixels at a zoom level. */
export function project(lat: number, lon: number, zoom: number): [number, number] {
  const scale = TILE * 2 ** zoom;
  const rad = (lat * Math.PI) / 180;
  const x = ((lon + 180) / 360) * scale;
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * scale;
  return [x, y];
}

/** Pixel offset of a point from the centre of a map view, x to the east and y to the south. */
export function offsetFromCenter(
  center: [number, number],
  zoom: number,
  lat: number,
  lon: number,
): { dx: number; dy: number } {
  const [cx, cy] = project(center[0], center[1], zoom);
  const [px, py] = project(lat, lon, zoom);
  return { dx: Math.round((px - cx) * 10) / 10, dy: Math.round((py - cy) * 10) / 10 };
}

/** Initial bearing from one point to another, degrees clockwise from north. */
export function bearing(from: { lat: number; lon: number }, to: { lat: number; lon: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const p1 = toRad(from.lat);
  const p2 = toRad(to.lat);
  const dl = toRad(to.lon - from.lon);
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export type Compass = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export function compass(degrees: number): Compass {
  const points: Compass[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
  return points[Math.round((((degrees % 360) + 360) % 360) / 45) % 8];
}

const EARTH_RADIUS_METERS = 6371008.8;

/** Great-circle distance in metres (haversine). */
export function distanceMeters(from: { lat: number; lon: number }, to: { lat: number; lon: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lon - from.lon);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
}
