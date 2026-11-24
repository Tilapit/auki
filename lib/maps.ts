/**
 * Route hand-off links. They carry only the pharmacy's position:
 * the map app uses its own location for the start (PLAN.md 7.6).
 * Without `walking` the link names no way of travel and the map app picks one.
 */
export function googleDirectionsUrl(lat: number, lon: number, walking = true): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}${walking ? '&travelmode=walking' : ''}`;
}

export function appleDirectionsUrl(lat: number, lon: number, walking = true): string {
  return `https://maps.apple.com/?daddr=${lat},${lon}${walking ? '&dirflg=w' : ''}`;
}

/** A pharmacy search in the map app, for when our own search is down. Carries no location. */
export function googleSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function appleSearchUrl(query: string): string {
  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

export const OSM_COPYRIGHT_URL = 'https://www.openstreetmap.org/copyright';
export const OSM_ADD_PLACE_URL = 'https://www.openstreetmap.org/fixthemap';

/** The credit OpenFreeMap asks for wherever its tiles are shown, next to OpenStreetMap's own. */
export const MAP_CREDITS = [
  { label: 'OpenFreeMap', url: 'https://openfreemap.org' },
  { label: '© OpenMapTiles', url: 'https://www.openmaptiles.org/' },
] as const;
