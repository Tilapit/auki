'use client';

import { useEffect, useRef, useState } from 'react';
import { canLocate, WATCH_OPTIONS } from '@/lib/geolocation';

export interface Fix {
  lat: number;
  lon: number;
  /** Radius in metres, as the device reports it. */
  accuracy: number;
}

/**
 * The device's position while the page is visible (PLAN.md 7.1, step 11): the map's dot
 * follows it, and after about 300 m the list is ranked again. The watch stops when the
 * page is hidden and starts again when it returns. Every fix stays on the device.
 *
 * Only for a position that came from the device: there the user has already allowed it
 * from a button, so the watch brings no prompt of its own.
 */
export function useLivePosition(enabled: boolean, onFix?: (fix: Fix) => void): Fix | undefined {
  const [fix, setFix] = useState<Fix>();
  const listener = useRef(onFix);
  useEffect(() => {
    listener.current = onFix;
  }, [onFix]);

  useEffect(() => {
    if (!enabled || !canLocate()) return;
    const geolocation = navigator.geolocation;
    let watch: number | undefined;
    const start = () => {
      if (watch !== undefined || document.visibilityState !== 'visible') return;
      watch = geolocation.watchPosition(
        ({ coords }) => {
          const next = { lat: coords.latitude, lon: coords.longitude, accuracy: coords.accuracy };
          setFix(next);
          listener.current?.(next);
        },
        // No fix right now: the dot stays where it was last seen.
        () => undefined,
        WATCH_OPTIONS,
      );
    };
    const stop = () => {
      if (watch !== undefined) geolocation.clearWatch(watch);
      watch = undefined;
    };
    const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop());
    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled]);

  return enabled ? fix : undefined;
}
