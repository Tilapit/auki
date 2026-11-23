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
const PHONE: Size[] = ['phone'];

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
      { id: 'place-finding', title: 'Place search: looking the name up', themes: SKY, sizes: ['phone'] },
      { id: 'place-not-found', title: 'Place search: no place by that name', themes: SKY },
      { id: 'place-failed', title: 'Place search: the lookup failed', themes: SKY, sizes: ['phone'] },
      { id: 'place-offline', title: 'Place search: offline', themes: SKY, sizes: ['phone'] },
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
      { id: 'searching-place', title: 'Searching: a searched place, named in the bar and the title' },
      { id: 'searching-approximate', title: 'Searching: approximate location, with the way to place search' },
      { id: 'helsinki-peek', title: 'Helsinki, Thu 20.41: sheet at its lowest, one row', note: 'Desktop has no sheet; it shows the panel.' },
      { id: 'helsinki-half', title: 'Helsinki, Thu 20.41: sheet at the card', sizes: PHONE },
      { id: 'helsinki', title: 'Helsinki, Thu 20.41: card with timeline, full list' },
      { id: 'riga-peek', title: 'Riga, Fri 23.40: sheet at its lowest' },
      { id: 'riga-half', title: 'Riga, Fri 23.40: sheet at the card, which is taller than the 60 % it may take', sizes: PHONE },
      { id: 'riga', title: 'Riga, Fri 23.40: one open, closed ones in one row, banner in the card, edge chip' },
      { id: 'riga-closed', title: 'Riga: "Kiinni nyt" opened (same names with streets)' },
      { id: 'far-open-peek', title: 'Nothing open nearby, a farther one is: sheet at its lowest' },
      { id: 'far-open-half', title: 'Nothing open nearby, a farther one is: sheet at the card', sizes: PHONE },
      {
        id: 'far-open',
        title: 'Nothing open nearby, a farther one is: it leads as "Lähin auki nyt", "Avautuu ensimmäisenä" below it',
        note: 'The 24-hour search within 30 km found one, 6.3 km away in the next town. No walking time, and the route names no way of travel.',
      },
      { id: 'nothing-open-peek', title: 'Nothing open within 30 km: sheet pulled down to its lowest, 112 is the row\'s button' },
      { id: 'nothing-open-half', title: 'Nothing open within 30 km: sheet at the card, where it starts', sizes: PHONE },
      { id: 'nothing-open', title: 'Nothing open within 30 km: the first to open, 112 kept prominent' },
      { id: 'searched', title: 'Searched place: the name from the search, however long' },
      { id: 'straight', title: 'Straight-line fallback (no walking times)' },
      { id: 'stress-peek', title: 'Stress data, Tue 13.15: sheet at its lowest' },
      { id: 'stress-half', title: 'Stress data, Tue 13.15: sheet at the card', sizes: PHONE },
      { id: 'stress', title: 'Stress data: ten results, long and repeated names, unclear hours, approximate location' },
    ],
  },
  {
    id: 'tiles',
    title: 'Results from tiles (M3)',
    note: 'Built from tile data at a fixed moment, Monday 23 Nov 2026 at 20.41, through the same code as the live app. Straight-line distances: walking times arrive in M5.',
    views: [
      { id: 'tiles-peek', title: 'From tiles: sheet at its lowest, the place name is the way to another place' },
      { id: 'tiles-half', title: 'From tiles: sheet at the card', sizes: PHONE },
      { id: 'tiles', title: 'From tiles: one closing soon leads, the data date in the footer' },
      { id: 'tiles-far', title: 'From tiles: nothing nearby open, one 14 km away is' },
      { id: 'tiles-edge', title: 'From tiles: near the edge of the coverage, the note names what is missing' },
      { id: 'stale', title: 'Data older than seven days: a notice in place of the card, nothing reads open' },
    ],
  },
  {
    id: 'hours',
    title: 'Hours coverage (provisional): most nearby pharmacies have no listed hours',
    note: 'Málaga on Mon 23 Nov 2026, from tile data: in Spain 18 % of pharmacies have opening hours in OpenStreetMap. The main case is under "Proposals", current and proposed side by side.',
    views: [
      { id: 'hours-peek', title: 'Sheet at its lowest: the nearest pharmacy leads, and the call is the row\'s button', sizes: ['phone'] },
      { id: 'hours-half', title: 'Sheet at the card: the call comes first, the one known to be open is a line', sizes: ['phone'] },
      { id: 'hours-none', title: '22.30, no pharmacy known to be open: no claim that all are closed, 112 kept prominent' },
      { id: 'hours-no-phone', title: 'The nearest has no phone number either: the route leads, and the text says why', sizes: ['phone'] },
      { id: 'hours-near', title: 'The open one is 220 m past the nearest: it leads as before, and the card says what lies nearer', sizes: ['phone'] },
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
      { id: 'not-covered', title: 'Outside the covered countries, country known' },
      { id: 'not-covered-unknown', title: 'Outside the covered countries, country not known', sizes: ['phone'] },
    ],
  },
  {
    id: 'pages',
    title: 'Pages',
    views: [
      { id: 'data', title: 'The data page: the numbers of the last run, one country kept from an earlier run', fullPage: true },
      { id: 'data-failed', title: 'The data page: the numbers did not load', sizes: ['phone'], themes: ['light'] },
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

/** Hours coverage, Janne's decision 1 of 23 Nov 2026 on the M3 report: built provisionally, waiting for a look. */
const hoursCoverage: Proposal = {
  id: 'hours',
  title: 'Where most nearby pharmacies have no listed hours, the card does not send people past them',
  reason:
    'In Southern Europe most pharmacies have no opening hours in OpenStreetMap (Greece 7 %, Spain 18 %). Today the card leads with the nearest pharmacy whose hours say it is open, here 1.9 km away past seven that may well be open. Proposed: when most of the nearer pharmacies have hours we can\'t read and the open one is more than 500 m farther than the nearest of them, the nearest leads. The card says how many there are, puts the call first, and keeps the one known to be open as a line. The heading stops counting open pharmacies. Provisional: waiting for Janne.',
  current: { id: 'hours-current', title: 'Current: the far one with known hours leads' },
  proposed: { id: 'hours-proposed', title: 'Proposed: the nearest leads, call first, the known open one as a line' },
};

/** The phone's sheet, from Janne's notes of 23 Nov 2026 after trying M4 on an iPhone: built provisionally, waiting for a look. */
const compactSheet: Proposal = {
  id: 'sheet',
  title: 'The phone\'s sheet rests on one row, and has three places',
  reason:
    'On an iPhone the collapsed "Lähin auki nyt" took a quarter of the screen, and the sheet could not go lower. Proposed: at its lowest the sheet is the handle and one row (the cross, the name, the distance and the status, and the route as the row\'s button), so the map has the screen. One pull up is the card, the next is the list, nearly full height. Provisional: waiting for Janne.',
  current: { id: 'sheet-current', title: 'Current: the collapsed sheet is the answer in three lines with two buttons', sizes: PHONE },
  proposed: { id: 'sheet-proposed', title: 'Proposed: one row; the card and the list are one and two pulls up', sizes: PHONE },
};

/** Open proposals, each shown as current and proposed side by side. Decided ones move to DESIGN-LOG.md. */
export const proposals: Proposal[] = [compactSheet, hoursCoverage];

export const allViews: ViewInfo[] = [...groups.flatMap((group) => group.views), ...proposals.flatMap((p) => [p.current, p.proposed])];
