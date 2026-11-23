import type { ReactNode } from 'react';
import { DataView } from '@/components/DataPage';
import { CardCases, ComponentSheet } from '@/components/dev/Sheets';
import { FirstVisit } from '@/components/FirstVisit';
import { PlaceSearch } from '@/components/PlaceSearch';
import { ProblemView } from '@/components/ProblemView';
import { ProgressView } from '@/components/ProgressView';
import { ResultsView } from '@/components/ResultsView';
import { SearchingView } from '@/components/SearchingView';
import { helsinki, helsinkiSearched, helsinkiStraight } from '@/lib/fixtures/helsinki';
import { riga, rigaFarOpen, rigaNothingOpen } from '@/lib/fixtures/riga';
import { stress } from '@/lib/fixtures/stress';
import { HERE, MONDAY_EVENING, NINE_DAYS_LATER, farOpen, indexOf, kamppi, kamppiClosed, resultOf } from '@/lib/fixtures/tiles';
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
  helsinki: () => <ResultsView scene={helsinki} sheet="expanded" />,
  'riga-peek': () => <ResultsView scene={riga} sheet="peek" />,
  riga: () => <ResultsView scene={riga} sheet="expanded" />,
  'riga-closed': () => <ResultsView scene={riga} sheet="expanded" closedOpen />,
  'far-open-peek': () => <ResultsView scene={rigaFarOpen} sheet="peek" />,
  'far-open': () => <ResultsView scene={rigaFarOpen} sheet="expanded" />,
  'nothing-open-peek': () => <ResultsView scene={rigaNothingOpen} sheet="peek" />,
  'nothing-open': () => <ResultsView scene={rigaNothingOpen} sheet="expanded" />,
  searched: () => <ResultsView scene={helsinkiSearched} sheet="peek" />,
  straight: () => <ResultsView scene={helsinkiStraight} sheet="expanded" />,
  'stress-peek': () => <ResultsView scene={stress} sheet="peek" />,
  stress: () => <ResultsView scene={stress} sheet="expanded" />,

  sheet: () => <ResultsView scene={helsinki} sheet="peek" detailId="yliopiston" />,
  'sheet-sparse': () => <ResultsView scene={helsinki} sheet="peek" detailId="kaartin" />,
  'sheet-far': () => <ResultsView scene={rigaFarOpen} sheet="peek" detailId="meness-marupe" />,
  counter: () => <ResultsView scene={riga} sheet="expanded" counter="ePrescription" />,
  'counter-paper': () => <ResultsView scene={riga} sheet="expanded" counter="paper" />,

  'tiles-peek': () => <ResultsView scene={fromTiles(resultOf(kamppi))} sheet="peek" placeControl />,
  tiles: () => <ResultsView scene={fromTiles(resultOf(kamppi))} sheet="expanded" placeControl />,
  'tiles-far': () => <ResultsView scene={fromTiles(resultOf(kamppiClosed, { farOpen: far }))} sheet="expanded" placeControl />,
  'tiles-edge': () => <ResultsView scene={fromTiles(resultOf(kamppi, { missing: ['RU'] }))} sheet="expanded" placeControl />,
  stale: () => <ResultsView scene={fromTiles(resultOf(kamppi), NINE_DAYS_LATER)} sheet="expanded" placeControl />,
  'place-current': () => <ResultsView scene={fromTiles(resultOf(kamppi))} sheet="peek" />,
  'place-proposed': () => <ResultsView scene={fromTiles(resultOf(kamppi))} sheet="peek" placeControl />,

  'not-covered': () => <ProblemView kind="notCovered" scene={sceneAt({ source: 'search', lat: 48.8566, lon: 2.3522, label: 'Pariisi' }, '20:41')} country="FR" />,
  'not-covered-unknown': () => <ProblemView kind="notCovered" scene={sceneAt(HERE, '20:41')} />,
  data: () => <DataView loaded={{ status: 'ready', index: indexOf([]) }} />,
  'data-failed': () => <DataView loaded={{ status: 'failed' }} />,

  none: () => <ProblemView kind="none" scene={helsinki} />,
  offline: () => <ProblemView kind="offline" scene={helsinki} />,
  error: () => <ProblemView kind="error" scene={helsinki} />,

  components: () => <ComponentSheet />,
  'card-cases': () => <CardCases />,

};
