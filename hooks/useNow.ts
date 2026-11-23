'use client';

import { useEffect, useState } from 'react';

const seconds = (): number => Math.floor(Date.now() / 1000);

/**
 * The current instant in epoch seconds, renewed on every full minute and whenever the page
 * comes back into view (PLAN.md 7.1, step 11). Statuses are worked out from it and from
 * the intervals already on the device: a tick costs no request.
 */
export function useNow(): number {
  const [now, setNow] = useState(seconds);

  useEffect(() => {
    let timer = 0;
    const schedule = () => {
      // Just after the minute turns, so "closes soon" appears on time.
      timer = window.setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50);
    };
    const tick = () => {
      setNow(seconds());
      schedule();
    };
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      window.clearTimeout(timer);
      tick();
    };
    schedule();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return now;
}
