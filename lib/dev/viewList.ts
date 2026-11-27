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
    note: 'Built from tile data at a fixed moment, Monday 23 Nov 2026 at 20.41, through the same code as the live app. Straight-line distances: what the app shows when walking times did not come within a second and a half.',
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
    id: 'walking',
    title: 'Walking times and ehditkö from tiles (M5)',
    note: 'The same tile data with walking times, through the same code as the live app: each walk three tenths longer than the straight line, at 5 km/h. The route line is a layer of the real map and shows on /dev/map.',
    views: [
      { id: 'walking-peek', title: 'On foot: sheet at its lowest, the row leads with the minutes' },
      { id: 'walking-half', title: 'On foot: sheet at the card, with the timeline', sizes: PHONE },
      { id: 'walking', title: 'On foot, Mon 20.41: three minutes away and closing at 21, the timeline; the list by walking time' },
      { id: 'walking-order', title: 'The nearest by straight line is sixteen minutes on foot: it drops down the list, and the card leads with another' },
      { id: 'walking-no-route', title: 'One pharmacy has no walking route: last in the list, with its straight line', sizes: PHONE },
      { id: 'walking-late-peek', title: 'Mon 20.57, too late for the nearest open one: the row says so', sizes: PHONE },
      { id: 'walking-late', title: 'Too late: the warning, the call, and the next open one with its route' },
      { id: 'walking-late-far', title: 'Too late, and nothing else open nearby: the farther open one is the next, and its button promises no walk' },
      { id: 'walking-sheet', title: 'Pharmacy sheet from tiles: the week\'s hours with equal days grouped, website, email, and the link to correct the data', ready: 'dialog[open]' },
      { id: 'walking-sheet-unknown', title: 'Pharmacy sheet, hours missing: the link to correct them under the status', ready: 'dialog[open]', sizes: PHONE },
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
    id: 'medicine',
    title: 'Medicine availability (provisional): where to check, never whether',
    note: 'The app hands the question to the country\'s own stock search. The line that opens the dialog is in the card and in every pharmacy sheet of a country that has such a service (see "Proposals" and the sheet views below); Riga has none, so its views are as they were. The dialogs of the other countries are shown over the Helsinki results: only the dialog differs. The last view is the seam for live stock, on invented figures: nothing of it is in the live app.',
    views: [
      { id: 'medicine-fi', title: 'Finland: the field, the link to apteekki.fi, what is sent and what is not', ready: 'dialog[open]' },
      { id: 'medicine-fi-typed', title: 'Finland, a name typed: the link now carries it', ready: 'dialog[open]', sizes: PHONE },
      { id: 'medicine-de', title: 'Germany: no national stock search; a reservation service that under half of the pharmacies have joined, and the dialog says so', ready: 'dialog[open]', sizes: PHONE },
      { id: 'medicine-at', title: 'Austria: the lookup is in an app, so there is no field: the link leads to the Chamber\'s page about the app', ready: 'dialog[open]', sizes: PHONE },
      { id: 'medicine-no', title: 'Norway: no national stock search; the pharmacy association\'s page on how to check each chain', ready: 'dialog[open]', sizes: PHONE },
      { id: 'medicine-se', title: 'Sweden, not in the live app: ready, and waiting for Lif\'s free linking agreement (Fass terms 4.5)', ready: 'dialog[open]', sizes: PHONE, themes: ['light'] },
      { id: 'medicine-stock', title: 'The seam: live stock from a provider, on example data, labelled as such', ready: '[data-stock-example]' },
    ],
  },
  {
    id: 'reports',
    title: 'Visitors\' reports (provisional): offered in a pharmacy\'s details, never asked',
    note: 'A row under the medicine search, with "Ohita" always in view; one screen of chips with no text field; and what others told, shown from three reports on with the count and the days. Stored: the pharmacy, its country, the day and the chips. On example data here: no service is called.',
    views: [
      { id: 'report-row', title: 'The offer: a row in the details, "Ohita" beside it', ready: '[data-report-shown]' },
      { id: 'report-summary', title: 'Five reports of this pharmacy: the counts, how many and when, then the offer', ready: '[data-report-shown]' },
      { id: 'report-open', title: 'One screen of chips, two pressed: at most one of a pair, none required', ready: '[data-report-dialog][open]' },
      { id: 'report-failed', title: 'The sending failed: the chips stay as they were, and it can be tried again', ready: '[data-report-dialog][open]', sizes: PHONE, themes: ['light'] },
      { id: 'report-thanks', title: 'After sending: thanks in the row\'s place, and no second offer for the same visit', ready: '[data-report-shown]', sizes: PHONE },
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
      { id: 'counter-doctor', title: 'Counter card where a Finnish e-prescription can\'t be used: paper and "the doctor sends it" (Germany\'s card, on the Riga fixture), without the wake lock', ready: 'dialog[open]', sizes: PHONE },
      { id: 'counter-one', title: 'Counter card with one variant and English as the pharmacy\'s language (Malta\'s, on the Riga fixture): no switch, no second language', ready: 'dialog[open]', sizes: PHONE, themes: ['light'] },
      { id: 'counter-visitor', title: 'Counter card in Finnish, for a visitor with an e-prescription from Estonia (on the Helsinki fixture)', ready: 'dialog[open]', sizes: PHONE, themes: ['light'] },
      { id: 'abroad-visitor', title: 'The banner for a prescription from Germany in Latvia: not on Latvia\'s list, paper recognised, the trip\'s line labelled as Finnish', fullPage: true },
      { id: 'abroad-finland', title: 'The banner in Finland for a prescription from Estonia, details and sources open', fullPage: true },
      { id: 'abroad-ask', title: 'The banner when the device suggests no country: it asks', sizes: PHONE, themes: ['light'], fullPage: true },
      { id: 'abroad', title: 'Every country\'s banner and counter-card lines, for reading through', sizes: PHONE, themes: ['light'], fullPage: true },
      { id: 'abroad-pairs', title: 'A pair for each kind of answer, and the footer\'s line at home, for reading through', sizes: PHONE, themes: ['light'], fullPage: true },
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
    ],
  },
  {
    id: 'card',
    title: 'Lähin auki nyt: the ehditkö cases',
    note: 'One case to a page: the card is a landmark with a name, and no page of the app has two of them.',
    views: [
      { id: 'card-timeline', title: '1. Closes within the hour: timeline', sizes: PHONE },
      { id: 'card-tight', title: '1b. Tight slack: under 5 min', sizes: PHONE },
      { id: 'card-tight-far', title: '1c. Tight slack: under a fifth of the walk (5 min after a 30 min walk)', sizes: PHONE },
      { id: 'card-late', title: '2. Arrival after closing: the closing one keeps Soita, the next open one has the main actions', sizes: PHONE },
      { id: 'card-later', title: '3. Closes later: status line only', sizes: PHONE },
      { id: 'card-abroad', title: '4. Open 24 hours, abroad, nearer ones closed, no phone number', sizes: PHONE, fullPage: true },
      { id: 'card-long', title: '5. Long name, three actions, no prescriptions', sizes: PHONE },
      { id: 'card-straight', title: '6. Straight-line fallback: metres lead, no timeline', sizes: PHONE },
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

/** Medicine availability, Janne's note for the night of 24 Nov 2026: built provisionally, waiting for a look. */
const medicineLine: Proposal = {
  id: 'medicine',
  title: 'A way to check a medicine\'s stock: one line under the card and in the pharmacy sheet',
  reason:
    'Janne approved the scope change on 24 Nov 2026: where a country has its own stock search, the app hands over to it. Since 26 Nov 2026 a row of its own, "Tarkista lääkkeen saatavuus" with the service\'s address under it, as the card\'s last section and under "Ei varastossa?" in every pharmacy sheet (until then one quiet line there). It opens a dialog that names the service, takes the medicine\'s name where the service\'s address can carry one, and says what is sent and to whom. Nothing is asked before the line is pressed. Provisional: the placement, the wording, and the link opening in a tab of its own.',
  current: { id: 'medicine-current', title: 'Current: the card ends with "Ei varastossa? Seuraava auki"' },
  proposed: { id: 'medicine-proposed', title: 'Proposed: the line is the card\'s last section' },
};

/** The hierarchy of a pharmacy's details, Janne's brief of 27 Nov 2026: decided by him and built, shown here as before and after. */
const detailsHierarchy: Proposal = {
  id: 'details-hierarchy',
  title: 'A pharmacy\'s details: before and after',
  reason:
    'Janne on his iPhone, 27 Nov 2026: everything was the same small text on the same dark ground. Now the name, the status and the walking time are large at the top; the route, the call and the medicine search are one row of buttons; the hours and the contacts are an inset group on a lighter surface; everything else is a list of rows, each with an icon and a mark at its end; and the dark sheet is a step lighter than the map, with a lit top edge. The "before" is a frozen copy of the old component, kept for this comparison only.',
  current: { id: 'details-before', title: 'Before: facts, then four buttons one under the other, then sentences and rows', ready: 'dialog[open]' },
  proposed: { id: 'details-after', title: 'After: large head, a row of main actions, an inset group of facts, a list of rows', ready: 'dialog[open]' },
};

/** The same for the card. */
const cardHierarchy: Proposal = {
  id: 'card-hierarchy',
  title: 'The card: before and after',
  reason:
    'The card takes the same two forms as the details: the main actions as one row of equal buttons with the medicine search among them, and "Ei varastossa? Seuraava auki" and "Näytä apteekissa" as rows of a list. Shown with every part a card can have at once (a timeline, a next open pharmacy, the counter card, a stock search), which no one place has.',
  current: { id: 'card-before', title: 'Before: buttons in a line, a sentence with a link, the medicine row last' },
  proposed: { id: 'card-after', title: 'After: a row of main actions, then a list of rows' },
};

/** Proposals and decided changes still worth a look, each shown as before and after side by side. Decided ones move to DESIGN-LOG.md. */
export const proposals: Proposal[] = [detailsHierarchy, cardHierarchy, medicineLine, compactSheet, hoursCoverage];

export const allViews: ViewInfo[] = [...groups.flatMap((group) => group.views), ...proposals.flatMap((p) => [p.current, p.proposed])];
