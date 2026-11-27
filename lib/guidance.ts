'use client';

/**
 * The prescription guidance arrives when it is needed, and not before (PLAN.md sections 8 and 12).
 *
 * data/countries/ is every pair's sentences, the sources and the counter card's lines in
 * twenty-four languages: some 18 KB as it travels. Most searches are made at home, where none of
 * it is shown. So the results view decides with what it has from the start (the home country,
 * lib/home.ts, and the country of the pharmacy), and asks for the rest here only when the two
 * differ, or when the banner is asked for from the footer. The banner and the counter card
 * come in the same file as the data they read: components/GuidanceParts.ts.
 *
 * No Suspense: the results never wait for it. Until it is there the card is as it is at home,
 * and the banner takes its place in the card when the file has arrived.
 */

import { useEffect, useSyncExternalStore } from 'react';

export type Guidance = typeof import('@/components/GuidanceParts');

let loaded: Guidance | undefined;
let loading: Promise<void> | undefined;
const waiting = new Set<() => void>();

function arrived(parts: Guidance): void {
  loaded = parts;
  for (const tell of waiting) tell();
}

/** Asks for the guidance once. A request that fails is forgotten, so that the next view that needs it asks again. */
export function loadGuidance(): void {
  if (loaded || loading) return;
  loading = import('@/components/GuidanceParts').then(arrived).catch(() => {
    loading = undefined;
  });
}

/**
 * /dev/states and /dev/map only: the guidance is there from the first render, on the server
 * too. Those views are fixtures and are photographed; none may be caught while a file is on
 * its way.
 */
export function primeGuidance(parts: Guidance): void {
  arrived(parts);
}

const listen = (tell: () => void) => {
  waiting.add(tell);
  return () => {
    waiting.delete(tell);
  };
};
const current = () => loaded;

/** The guidance once it has arrived. It is asked for when `wanted` first is true, and never while it is not. */
export function useGuidance(wanted: boolean): Guidance | undefined {
  const parts = useSyncExternalStore(listen, current, current);
  useEffect(() => {
    if (wanted) loadGuidance();
  }, [wanted]);
  return parts;
}
