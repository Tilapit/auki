/**
 * Every view and state shown in /dev/states. Plain data, so the Playwright
 * screenshot test can import it without touching any component.
 * Labels here are developer-facing, not UI copy.
 */
export type Size = 'phone' | 'desktop';
export type Theme = 'light' | 'dark';

export interface ViewInfo {
  id: string;
  title: string;
  note?: string;
  /** Defaults to both. */
  sizes?: Size[];
  /** Defaults to both. The sky scenes look the same in both themes, so they show one. */
  themes?: Theme[];
  /** A selector that must be visible before a screenshot is taken. */
  ready?: string;
  /** Review sheets are taller than one screen: capture the whole page. */
  fullPage?: boolean;
}

export interface ViewGroup {
  id: string;
  title: string;
  note?: string;
  views: ViewInfo[];
}

export const SIZES: Record<Size, { width: number; height: number }> = {
  phone: { width: 390, height: 844 },
  desktop: { width: 1440, height: 900 },
};

const SKY: Theme[] = ['light'];

export const groups: ViewGroup[] = [
  {
    id: 'sky',
    title: 'First visit: the sky follows the sun',
    note: 'Fixed moments in Helsinki. Night, twilight, golden hour and day are blended by sun altitude; windows follow the clock. The theme does not change these scenes.',
    views: [
      { id: 'sky-night', title: 'Night, Thu 19 Nov 20.41 (many windows)', themes: SKY },
      { id: 'sky-late', title: 'Night, Fri 20 Nov 02.30 (few windows)', themes: SKY },
      { id: 'sky-morning', title: 'Morning twilight, 19 Nov 08.10 (some windows)', themes: SKY },
      { id: 'sky-golden', title: 'Golden hour, 19 Nov 15.10', themes: SKY },
      { id: 'sky-twilight', title: 'Twilight, 19 Nov 16.10 (dark by four)', themes: SKY },
      { id: 'sky-day', title: 'Day, 21 Jun 13.20', themes: SKY },
      { id: 'sky-june-night', title: 'Midsummer, 21 Jun 23.00 (still light)', themes: SKY },
    ],
  },
  {
    id: 'start',
    title: 'Start, location and place search',
    note: 'Shown at twilight (19 Nov 16.10).',
    views: [
      { id: 'locating', title: 'Locating', themes: SKY },
      { id: 'waiting', title: 'Waiting for permission (after 8 s)', themes: SKY },
      { id: 'place-search', title: 'Place search', themes: SKY },
      { id: 'denied', title: 'Permission denied', themes: SKY },
      { id: 'denied-how', title: 'Permission denied, steps open', themes: SKY, sizes: ['phone'] },
      { id: 'unavailable', title: 'Position unavailable', themes: SKY },
      { id: 'timeout', title: 'Timeout', themes: SKY },
      { id: 'unsupported', title: 'Unsupported or not HTTPS', themes: SKY },
    ],
  },
  {
    id: 'results',
    title: 'Results',
    views: [
      { id: 'searching', title: 'Searching' },
      { id: 'helsinki-peek', title: 'Helsinki, Thu 20.41: sheet collapsed', note: 'Desktop has no sheet; it shows the panel.' },
      { id: 'helsinki', title: 'Helsinki, Thu 20.41: card with timeline, full list' },
      { id: 'riga-peek', title: 'Riga, Fri 23.40: sheet collapsed' },
      { id: 'riga', title: 'Riga, Fri 23.40: one open, closed ones in one row, banner in the card, edge chip' },
      { id: 'riga-closed', title: 'Riga: "Kiinni nyt" opened (same names with streets)' },
      { id: 'far-open-peek', title: 'Nothing open nearby, a farther one is: sheet collapsed' },
      {
        id: 'far-open',
        title: 'Nothing open nearby, a farther one is: it leads as "Lähin auki nyt", "Avautuu ensimmäisenä" below it',
        note: 'The 24-hour search within 30 km found one, 6.3 km away in the next town. No walking time, and the route names no way of travel.',
      },
      { id: 'nothing-open-peek', title: 'Nothing open within 30 km: sheet collapsed' },
      { id: 'nothing-open', title: 'Nothing open within 30 km: the first to open, 112 kept prominent' },
      { id: 'searched', title: 'Searched place: the name from the search, however long' },
      { id: 'straight', title: 'Straight-line fallback (no walking times)' },
      { id: 'stress-peek', title: 'Stress data, Tue 13.15: sheet collapsed' },
      { id: 'stress', title: 'Stress data: ten results, long and repeated names, unclear hours, approximate location' },
    ],
  },
  {
    id: 'details',
    title: 'Pharmacy sheet and counter card',
    views: [
      { id: 'sheet', title: 'Pharmacy sheet, full data', ready: 'dialog[open]' },
      { id: 'sheet-sparse', title: 'Pharmacy sheet, sparse data', ready: 'dialog[open]' },
      { id: 'sheet-far', title: 'Pharmacy sheet, the farther open one: city in the address, route without walking', ready: 'dialog[open]' },
      { id: 'counter', title: 'Counter card, e-prescription', ready: 'dialog[open]' },
      { id: 'counter-paper', title: 'Counter card, paper (drafted, unreviewed)', ready: 'dialog[open]' },
    ],
  },
  {
    id: 'problems',
    title: 'Problems after the position is known',
    views: [
      { id: 'none', title: 'None found' },
      { id: 'offline', title: 'Offline' },
      { id: 'error', title: 'Service error' },
    ],
  },
  {
    id: 'components',
    title: 'Components',
    views: [
      { id: 'components', title: 'Glyphs, status lines, buttons, markers', sizes: ['phone'], fullPage: true },
      { id: 'card-cases', title: 'Lähin auki nyt: the ehditkö cases', sizes: ['phone'], fullPage: true },
    ],
  },
];

export interface Proposal {
  id: string;
  title: string;
  reason: string;
  current: ViewInfo;
  proposed: ViewInfo;
}

/** Open proposals, each shown as current and proposed side by side. Decided ones move to DESIGN-LOG.md. */
export const proposals: Proposal[] = [];

export const allViews: ViewInfo[] = [...groups.flatMap((group) => group.views), ...proposals.flatMap((p) => [p.current, p.proposed])];
