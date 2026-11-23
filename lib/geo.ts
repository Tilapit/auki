const TILE = 256;

/** Web Mercator: latitude and longitude to world pixels at a zoom level. */
export function project(lat: number, lon: number, zoom: number): [number, number] {
  const scale = TILE * 2 ** zoom;
  const rad = (lat * Math.PI) / 180;
  const x = ((lon + 180) / 360) * scale;
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * scale;
  return [x, y];
}

/** The eight points of the compass, for saying where something off the map lies. */
export type Compass = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

const EARTH_RADIUS_METERS = 6371008.8;

/** Great-circle distance in metres (haversine). */
export function distanceMeters(from: { lat: number; lon: number }, to: { lat: number; lon: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lon - from.lon);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
}
