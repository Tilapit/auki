/**
 * Everything the app keeps on the device (PLAN.md 7.6), in one place: the "what the app sends"
 * page is built from it, with the keys the code itself writes under. A unit test reads the
 * source and fails when a key is written that this list does not have.
 *
 * No cookies, and nothing for offline use: there is no service worker.
 */

import { LOCATED_KEY } from './geolocation';
import { HOME_KEY } from './home';
import { REPORTS_DONE_KEY } from './reports';
import { LAST_DETAIL_KEY, LAST_SEARCH_KEY } from './session';

export interface Kept {
  id: 'lastSearch' | 'lastDetail' | 'locatedBefore' | 'reportsDone' | 'homeCountry';
  /** The key, as the browser's own storage view shows it. */
  key: string;
  /** session: this tab alone, until it is closed. local: this browser, until the site's data is cleared. */
  store: 'session' | 'local';
}

export const KEPT: Kept[] = [
  { id: 'lastSearch', key: LAST_SEARCH_KEY, store: 'session' },
  { id: 'lastDetail', key: LAST_DETAIL_KEY, store: 'session' },
  { id: 'locatedBefore', key: LOCATED_KEY, store: 'local' },
  { id: 'reportsDone', key: REPORTS_DONE_KEY, store: 'local' },
  { id: 'homeCountry', key: HOME_KEY, store: 'local' },
];
