import type { ReactNode } from 'react';
import { DataView } from '@/components/DataPage';
import { CardCases, ComponentSheet } from '@/components/dev/Sheets';
import { StockExample } from '@/components/dev/StockExample';
import { FirstVisit } from '@/components/FirstVisit';
import { PlaceSearch } from '@/components/PlaceSearch';
import { ProblemView } from '@/components/ProblemView';
import { ProgressView } from '@/components/ProgressView';
import { ResultsView } from '@/components/ResultsView';
import { SearchingView } from '@/components/SearchingView';
import { helsinki, helsinkiSearched, helsinkiStraight } from '@/lib/fixtures/helsinki';
import { malaga, malagaLate, malagaNear, malagaNoPhone } from '@/lib/fixtures/malaga';
import { riga, rigaFarOpen, rigaNothingOpen } from '@/lib/fixtures/riga';
import { EXAMPLE_MEDICINE } from '@/lib/fixtures/stock';
import { stress } from '@/lib/fixtures/stress';
import { HERE, MONDAY_EVENING, NINE_DAYS_LATER, daily, farOpen, indexOf, kamppi, kamppiClosed, resultOf, walkedResultOf, weekly } from '@/lib/fixtures/tiles';
import { toScene } from '@/lib/live';
import type { SearchResult } from '@/lib/live';
import { distanceMeters } from '@/lib/geo';
import { sceneAt } from '@/lib/scene';
import type { SkyAt } from '@/lib/sky';

/** Fixed moments for the sky. Nothing in /dev/states reads the clock. */
const at = (iso: string): SkyAt => ({ at: iso, zone: 'Europe/Helsinki' });
const TWILIGHT = at('2026-11-19T14:10:00Z');

/** A scene as the live app builds it, from tile data at a fixed instant. */
const fromTiles = (result: SearchResult, now = MONDAY_EVENING) => toScene({ position: HERE, result, now, deviceZone: 'Europe/Helsinki' });
const far = { pharmacy: farOpen, meters: distanceMeters(HERE, farOpen) };
/** Monday 20.57: the nearest open pharmacy closes at 21, three minutes' walk away. */
const TOO_LATE = MONDAY_EVENING + 16 * 60;
/** The nearest by straight line is across the tracks: sixteen minutes on foot. */
const ACROSS = { n101: { meters: 1300, seconds: 936 } };
/** Around Kamppi with one pharmacy open, until 21. */
/** The same, with a week that has three kinds of day: the sheet lists them as a door sign would. */
const withWeek = kamppi.map((pharmacy, index) => (index === 0 ? { ...pharmacy, hours: weekly(['08:00', '21:00'], ['10:00', '18:00']) } : pharmacy));
const oneOpen = kamppi.map((pharmacy, index) => (index > 0 && pharmacy.hours.kind === 'parsed' ? { ...pharmacy, hours: daily('09:00', '18:00') } : pharmacy));

/** id from viewList.ts to what it renders. Fixtures only: no network, no clock. */
export const renderers: Record<string, () => ReactNode> = {
  'sky-night': () => <FirstVisit sky={at('2026-11-19T18:41:00Z')} />,
  'sky-late': () => <FirstVisit sky={at('2026-11-20T00:30:00Z')} />,
  'sky-morning': () => <FirstVisit sky={at('2026-11-19T06:10:00Z')} />,
  'sky-golden': () => <FirstVisit sky={at('2026-11-19T13:10:00Z')} />,
  'sky-twilight': () => <FirstVisit sky={TWILIGHT} />,
  'sky-day': () => <FirstVisit sky={at('2026-06-21T10:20:00Z')} />,
  'sky-june-night': () => <FirstVisit sky={at('2026-06-21T20:00:00Z')} />,

  locating: () => <ProgressView phase="locating" sky={TWILIGHT} />,
  waiting: () => <ProgressView phase="waiting" sky={TWILIGHT} />,
  'place-search': () => <PlaceSearch sky={TWILIGHT} />,
  'place-finding': () => <PlaceSearch sky={TWILIGHT} lookup={{ status: 'pending', query: 'Kamppi' }} />,
  'place-not-found': () => <PlaceSearch sky={TWILIGHT} lookup={{ status: 'notFound', query: 'Kampi keskus' }} />,
  'place-failed': () => <PlaceSearch sky={TWILIGHT} lookup={{ status: 'failed', query: 'Kamppi', offline: false }} />,
  'place-offline': () => <PlaceSearch sky={TWILIGHT} problem="denied" lookup={{ status: 'failed', query: 'Kamppi', offline: true }} />,
  denied: () => <ProblemView kind="denied" sky={TWILIGHT} />,
  'denied-how': () => <PlaceSearch problem="denied" sky={TWILIGHT} stepsOpen />,
  unavailable: () => <ProblemView kind="unavailable" sky={TWILIGHT} />,
  timeout: () => <ProblemView kind="timeout" sky={TWILIGHT} />,
  unsupported: () => <ProblemView kind="unsupported" sky={TWILIGHT} />,

  searching: () => <ProgressView phase="searching" scene={helsinki} />,
  'searching-place': () => (
    <SearchingView scene={sceneAt({ source: 'search', lat: 60.1689, lon: 24.9325, label: 'Kampin keskus, Helsinki' }, '20:41')} />
  ),
  'searching-approximate': () => (
    <SearchingView scene={sceneAt({ source: 'device', lat: 60.1689, lon: 24.9325, accuracy: 2400, approximate: true }, '20:41')} />
  ),
  'helsinki-peek': () => <ResultsView scene={helsinki} sheet="peek" />,
  'helsinki-half': () => <ResultsView scene={helsinki} sheet="half" />,
  helsinki: () => <ResultsView scene={helsinki} sheet="expanded" />,
  'riga-peek': () => <ResultsView scene={riga} sheet="peek" />,
  'riga-half': () => <ResultsView scene={riga} sheet="half" />,
  riga: () => <ResultsView scene={riga} sheet="expanded" />,
  'riga-closed': () => <ResultsView scene={riga} sheet="expanded" closedOpen />,
  'far-open-peek': () => <ResultsView scene={rigaFarOpen} sheet="peek" />,
  'far-open-half': () => <ResultsView scene={rigaFarOpen} sheet="half" />,
  'far-open': () => <ResultsView scene={rigaFarOpen} sheet="expanded" />,
  'nothing-open-peek': () => <ResultsView scene={rigaNothingOpen} sheet="peek" />,
  // No sheet given: with nothing open it starts at the card.
  'nothing-open-half': () => <ResultsView scene={rigaNothingOpen} />,
  'nothing-open': () => <ResultsView scene={rigaNothingOpen} sheet="expanded" />,
  searched: () => <ResultsView scene={helsinkiSearched} sheet="peek" />,
  straight: () => <ResultsView scene={helsinkiStraight} sheet="expanded" />,
  'stress-peek': () => <ResultsView scene={stress} sheet="peek" />,
  'stress-half': () => <ResultsView scene={stress} sheet="half" />,
  stress: () => <ResultsView scene={stress} sheet="expanded" />,

  sheet: () => <ResultsView scene={helsinki} sheet="peek" detailId="yliopiston" />,
  'sheet-sparse': () => <ResultsView scene={helsinki} sheet="peek" detailId="kaartin" />,
  'sheet-far': () => <ResultsView scene={rigaFarOpen} sheet="peek" detailId="meness-marupe" />,
  counter: () => <ResultsView scene={riga} sheet="expanded" counter="ePrescription" />,
  'counter-paper': () => <ResultsView scene={riga} sheet="expanded" counter="paper" />,

  'tiles-peek': () => <ResultsView scene={fromTiles(resultOf(kamppi))} sheet="peek" />,
  'tiles-half': () => <ResultsView scene={fromTiles(resultOf(kamppi))} sheet="half" />,
  tiles: () => <ResultsView scene={fromTiles(resultOf(kamppi))} sheet="expanded" />,
  'tiles-far': () => <ResultsView scene={fromTiles(resultOf(kamppiClosed, { farOpen: far }))} sheet="expanded" />,
  'tiles-edge': () => <ResultsView scene={fromTiles(resultOf(kamppi, { missing: ['RU'] }))} sheet="expanded" />,
  stale: () => <ResultsView scene={fromTiles(resultOf(kamppi), NINE_DAYS_LATER)} sheet="expanded" />,

  'walking-peek': () => <ResultsView scene={fromTiles(walkedResultOf(kamppi))} sheet="peek" />,
  'walking-half': () => <ResultsView scene={fromTiles(walkedResultOf(kamppi))} sheet="half" />,
  walking: () => <ResultsView scene={fromTiles(walkedResultOf(kamppi))} sheet="expanded" />,
  'walking-order': () => <ResultsView scene={fromTiles(walkedResultOf(kamppi, {}, ACROSS))} sheet="expanded" />,
  'walking-no-route': () => <ResultsView scene={fromTiles(walkedResultOf(kamppi, {}, { n103: null }))} sheet="expanded" />,
  'walking-late-peek': () => <ResultsView scene={fromTiles(walkedResultOf(kamppi), TOO_LATE)} sheet="peek" />,
  'walking-late': () => <ResultsView scene={fromTiles(walkedResultOf(kamppi), TOO_LATE)} sheet="expanded" />,
  'walking-late-far': () => <ResultsView scene={fromTiles(walkedResultOf(oneOpen, { farOpen: far }), TOO_LATE)} sheet="expanded" />,
  'walking-sheet': () => <ResultsView scene={fromTiles(walkedResultOf(withWeek))} sheet="peek" detailId="n101" />,
  'walking-sheet-unknown': () => <ResultsView scene={fromTiles(walkedResultOf(kamppi))} sheet="peek" detailId="n104" />,

  'not-covered': () => <ProblemView kind="notCovered" scene={sceneAt({ source: 'search', lat: 48.8566, lon: 2.3522, label: 'Pariisi' }, '20:41')} country="FR" />,
  'not-covered-unknown': () => <ProblemView kind="notCovered" scene={sceneAt(HERE, '20:41')} />,
  data: () => <DataView loaded={{ status: 'ready', index: indexOf([]) }} zone="Europe/Helsinki" />,
  'data-failed': () => <DataView loaded={{ status: 'failed' }} />,

  none: () => <ProblemView kind="none" scene={helsinki} />,
  offline: () => <ProblemView kind="offline" scene={helsinki} />,
  error: () => <ProblemView kind="error" scene={helsinki} />,

  components: () => <ComponentSheet />,
  'card-cases': () => <CardCases />,

  // Medicine availability (provisional): the dialog per country, and the seam on example data.
  'medicine-fi': () => <ResultsView scene={helsinki} sheet="peek" medicine="FI" />,
  'medicine-fi-typed': () => <ResultsView scene={helsinki} sheet="peek" medicine="FI" medicineValue={EXAMPLE_MEDICINE} />,
  'medicine-stock': () => (
    <ResultsView
      scene={helsinki}
      sheet="peek"
      medicine="FI"
      medicineValue={EXAMPLE_MEDICINE}
      medicineExample={<StockExample medicine={EXAMPLE_MEDICINE} pharmacies={helsinki.pharmacies} zone="Europe/Helsinki" />}
    />
  ),
  'medicine-current': () => <ResultsView scene={helsinki} sheet="expanded" medicine={false} />,
  'medicine-proposed': () => <ResultsView scene={helsinki} sheet="expanded" />,

  // The phone's sheet (provisional): as it was, and at its lowest as proposed.
  'sheet-current': () => <ResultsView scene={helsinki} sheet="peek" sheetStyle="classic" />,
  'sheet-proposed': () => <ResultsView scene={helsinki} sheet="peek" />,

  // Hours coverage (provisional): most nearby pharmacies have no hours in OpenStreetMap.
  'hours-current': () => <ResultsView scene={malaga} sheet="expanded" coverage={false} />,
  'hours-proposed': () => <ResultsView scene={malaga} sheet="expanded" />,
  'hours-peek': () => <ResultsView scene={malaga} sheet="peek" />,
  'hours-half': () => <ResultsView scene={malaga} sheet="half" />,
  'hours-none': () => <ResultsView scene={malagaLate} sheet="expanded" />,
  'hours-no-phone': () => <ResultsView scene={malagaNoPhone} sheet="expanded" />,
  'hours-near': () => <ResultsView scene={malagaNear} sheet="expanded" />,

};
