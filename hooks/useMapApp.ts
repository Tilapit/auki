'use client';

import { useSyncExternalStore } from 'react';
import { mapAppFor, type MapApp } from '@/lib/maps';

/** The device does not turn into another one while the page is open: nothing to listen for. */
const never = () => () => undefined;

/**
 * The map app the route button opens on this device (lib/maps.ts). On the server, and in the
 * page as the server wrote it, it is Google's: the answer for a device nothing is known of.
 * The app's own views are made in the browser, after a search, so nobody sees it change.
 */
export function useMapApp(): MapApp {
  return useSyncExternalStore<MapApp>(
    never,
    () => mapAppFor(navigator.userAgent),
    () => 'google',
  );
}
