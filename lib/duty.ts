'use client';

/**
 * The duty-pharmacy lookup arrives when it is needed, and not before (PLAN.md sections 5 and 12).
 *
 * data/countries/duty.ts is each country's lookup, its phone number and its source. It is shown
 * only where pharmacies take turns and the nearer ones are closed, or their hours aren't known:
 * a small part of all searches. So the results view asks for it here only then, as it does for
 * the prescription guidance (lib/guidance.ts). What draws it comes in the same file as the data:
 * components/DutyParts.tsx.
 *
 * One thing has to be known at the first render, before that file is there: whether the
 * country is one where pharmacies take turns, because the phone's sheet then starts at the
 * card. That is the list of codes below, and nothing more.
 *
 * No Suspense: the results never wait for it. Until it is there the card is as it is where
 * duty doesn't rotate.
 */

import { useEffect, useSyncExternalStore } from 'react';

export type DutyParts = typeof import('@/components/DutyParts');

/**
 * The countries where pharmacies take turns out of hours, by an official page read for this
 * app: `kind: 'rotating'` in data/countries/duty.ts, and a unit test holds the two equal.
 */
export const DUTY_ROTATES: readonly string[] = ['DE', 'AT', 'ES', 'GR', 'FR', 'BE', 'LU', 'SK', 'HU', 'CY', 'MT', 'PT'];

/** True where the pharmacy on duty changes by the day, so that our opening hours can't show it. */
export const dutyRotates = (country: string | undefined): boolean => country !== undefined && DUTY_ROTATES.includes(country);

let loaded: DutyParts | undefined;
let loading: Promise<void> | undefined;
const waiting = new Set<() => void>();

function arrived(parts: DutyParts): void {
  loaded = parts;
  for (const tell of waiting) tell();
}

/** Asks for the lookups once. A request that fails is forgotten, so that the next view that needs them asks again. */
export function loadDuty(): void {
  if (loaded || loading) return;
  loading = import('@/components/DutyParts').then(arrived).catch(() => {
    loading = undefined;
  });
}

/** /dev/states and /dev/map only: the lookups are there from the first render, on the server too (see primeGuidance). */
export function primeDuty(parts: DutyParts): void {
  arrived(parts);
}

const listen = (tell: () => void) => {
  waiting.add(tell);
  return () => {
    waiting.delete(tell);
  };
};
const current = () => loaded;

/** The lookups once they have arrived. They are asked for when `wanted` first is true, and never while it is not. */
export function useDuty(wanted: boolean): DutyParts | undefined {
  const parts = useSyncExternalStore(listen, current, current);
  useEffect(() => {
    if (wanted) loadDuty();
  }, [wanted]);
  return parts;
}
