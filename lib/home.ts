'use client';

/**
 * The home country: where the user's prescription is from (PLAN.md section 8). Nobody is
 * asked for it. It is taken from the browser's languages and their regions, shown in the
 * "Resepti kotimaasta?" banner, and changed there with one control.
 *
 * A country the user picks is kept on the device, in the browser's local storage, as its
 * two-letter code: so that it is asked once and not at every search. It is never sent
 * anywhere, and it is not kept until it is picked: the browser's own suggestion is worked out
 * again at every visit (PLAN.md 7.6).
 */

import { useCallback, useState, useSyncExternalStore } from 'react';
// From the list of countries alone, not from data/countries as a whole: this file is part of
// the first load, and the guidance is not (lib/guidance.ts).
import { OTHER, homeFromLanguages, homeOf } from '@/data/countries/homes';
import type { Locale } from './i18n';

export const HOME_KEY = 'home-country';

const isHome = (code: string | null | undefined): code is string => !!code && (code === OTHER || homeOf(code) !== undefined);

/** Private windows and blocked storage throw: then the browser's suggestion stands at every visit. */
function storedHome(): string | undefined {
  try {
    const code = globalThis.localStorage?.getItem(HOME_KEY);
    return isHome(code) ? code : undefined;
  } catch {
    return undefined;
  }
}

function rememberHome(code: string): void {
  try {
    globalThis.localStorage?.setItem(HOME_KEY, code);
  } catch {
    // Not kept: the choice holds for this visit.
  }
}

/**
 * What the device suggests, with nothing picked: the browser's languages, and where they name
 * no country the list knows, the language the page is read in. English names none.
 */
export function suggestedHome(languages: readonly string[] | undefined, locale: Locale): string | undefined {
  return homeFromLanguages(languages ?? []) ?? (locale === 'fi' ? 'FI' : undefined);
}

const listen = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
};
const nothing = () => undefined;

/**
 * The home country and the way to change it. `fixed` is a view of /dev/states, which reads
 * and keeps nothing: it starts from that country and a change holds while the view is open.
 * Undefined while it is not known: the banner then asks.
 *
 * What the device says is read as an outside store, so that a page rendered on a server, which
 * knows no device, is taken over on the device without a mismatch.
 */
export function useHome(locale: Locale, fixed?: string | null): [string | undefined, (code: string) => void] {
  const device = useSyncExternalStore(
    listen,
    () => (fixed !== undefined ? undefined : (storedHome() ?? suggestedHome(navigator.languages, locale))),
    nothing,
  );
  const [picked, setPicked] = useState<string>();
  const choose = useCallback(
    (code: string) => {
      if (!isHome(code)) return;
      setPicked(code);
      if (fixed === undefined) rememberHome(code);
    },
    [fixed],
  );
  return [picked ?? (fixed !== undefined ? (fixed ?? undefined) : device), choose];
}
