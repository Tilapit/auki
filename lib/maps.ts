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

/** The map apps a route is handed to. */
export type MapApp = 'apple' | 'google';

/**
 * Whose map app the route button opens: Apple's on an iPhone, an iPad and a Mac, where it is
 * the device's own, and Google's everywhere else (Janne, 27 Nov 2026). The other one is a row
 * further down. Read on the device from the name the browser gives itself: nothing is asked,
 * sent or kept. An iPad has called itself a Macintosh since iPadOS 13, and a Mac is one: both
 * get Apple's. A browser that says nothing gets Google's, which opens anywhere.
 */
export function mapAppFor(userAgent: string | undefined): MapApp {
  return /\b(?:iPhone|iPad|iPod|Macintosh)\b/.test(userAgent ?? '') ? 'apple' : 'google';
}

/** The route to a place in that app: the same links as above, by the app's name. */
export function directionsUrl(app: MapApp, lat: number, lon: number, walking = true): string {
  return app === 'apple' ? appleDirectionsUrl(lat, lon, walking) : googleDirectionsUrl(lat, lon, walking);
}

/** A pharmacy search in the map app, for when our own search is down. Carries no location. */
export function googleSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function appleSearchUrl(query: string): string {
  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

/**
 * OpenStreetMap's note form with its marker on a place (PLAN.md section 5): anyone can say
 * there what is wrong, without an account, and a mapper fixes it. The link carries the
 * pharmacy's position and nothing about the user. A fix reaches the tiles the next night.
 */
export function osmNoteUrl(lat: number, lon: number): string {
  return `https://www.openstreetmap.org/note/new?lat=${lat}&lon=${lon}#map=19/${lat}/${lon}`;
}

/** A website as the sheet names it: its host, without "www.". Undefined for anything that is not a web address. */
export function websiteHost(url: string): string | undefined {
  try {
    const { protocol, hostname } = new URL(url);
    return (protocol === 'https:' || protocol === 'http:') && hostname.includes('.') ? hostname.replace(/^www\./, '') : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The address a mailto: link may carry: the first one of the tag, when it is an address and
 * nothing more. OpenStreetMap's value is free text, and a link must not pick up a subject
 * or a second recipient from it.
 */
export function emailAddress(raw: string): string | undefined {
  const first = raw.split(/[;,\s]+/).find(Boolean) ?? '';
  return /^[^\s@?&#%<>"']+@[^\s@?&#%<>"']+\.[^\s@?&#%<>"'.]+$/.test(first) ? first : undefined;
}

export const OSM_COPYRIGHT_URL = 'https://www.openstreetmap.org/copyright';
export const OSM_ADD_PLACE_URL = 'https://www.openstreetmap.org/fixthemap';

/** The credit OpenFreeMap asks for wherever its tiles are shown, next to OpenStreetMap's own. */
export const MAP_CREDITS = [
  { label: 'OpenFreeMap', url: 'https://openfreemap.org' },
  { label: '© OpenMapTiles', url: 'https://www.openmaptiles.org/' },
] as const;
