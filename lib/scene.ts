import type { Position } from './state';
import type { Scene } from './types';

/**
 * What the map views need before any pharmacy is known: the position in the middle of the
 * map, and the place name when it came from a search.
 */
export function sceneAt(position: Position, at: string): Scene {
  const center: [number, number] = [position.lat, position.lon];
  return {
    id: 'live',
    searched: position.source === 'search' ? position.label : undefined,
    updated: at,
    user: { lat: position.lat, lon: position.lon, approximate: position.source === 'device' && position.approximate },
    distance: 'straight',
    pharmacies: [],
    ehditko: { kind: 'none' },
    views: { phone: { center, zoom: 15 }, desktop: { center, zoom: 16 } },
  };
}
