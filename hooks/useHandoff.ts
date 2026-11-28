'use client';

import { useSyncExternalStore } from 'react';
import { NO_HANDOFF, readHandoff, type Handoff } from '@/lib/handoff';

/**
 * What the hand-off link says (lib/handoff.ts), read from the address's fragment on the device.
 * The fragment is where it stays: it is written to no storage and put in no request, and a tab
 * that is loaded again reads it from its address as the first time (PLAN.md 7.6 and 7.8).
 *
 * Read as an outside store: the page's static shell knows no fragment, and another app may
 * open a new link in a tab that is already here, which changes the fragment and loads nothing.
 */

let seen: { fragment: string; handoff: Handoff } | undefined;

/** The link as the address has it at this moment. The same object for the same fragment. */
export function deviceHandoff(): Handoff {
  const fragment = window.location.hash;
  if (seen?.fragment !== fragment) seen = { fragment, handoff: readHandoff(fragment) };
  return seen.handoff;
}

const listen = (tell: () => void) => {
  window.addEventListener('hashchange', tell);
  return () => window.removeEventListener('hashchange', tell);
};
const nothing = () => NO_HANDOFF;

export function useHandoff(): Handoff {
  return useSyncExternalStore(listen, deviceHandoff, nothing);
}
