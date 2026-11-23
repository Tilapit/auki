'use client';

import dynamic from 'next/dynamic';
import { usePharmacySearch } from '@/hooks/usePharmacySearch';
import { useI18n } from '@/lib/i18n/context';
import { FirstVisit } from './FirstVisit';
import { PlaceSearch } from './PlaceSearch';

// The map views are not needed for the first paint. They load while the browser asks for
// permission, or while the place is looked up.
const loadMapStage = () => import('./MapStage').then((module) => module.MapStage);
const MapStage = dynamic(loadMapStage, { ssr: false });

/** Owns the state and picks the view (PLAN.md 7.3). One view per state. */
export function PharmacyFinder() {
  const { locale } = useI18n();
  const { state, locate, openSearch, search, searchFrom, retry, checkFarOpen, back } = usePharmacySearch(locale);

  const start = () => {
    void loadMapStage();
    locate();
  };

  switch (state.view) {
    case 'ready':
      return <FirstVisit onLocate={start} onSearch={openSearch} />;
    case 'locating':
      return <FirstVisit phase={state.waiting ? 'waiting' : 'locating'} onSearch={openSearch} />;
    case 'search':
      return (
        <PlaceSearch
          problem={state.problem}
          lookup={state.lookup}
          onSearch={(query) => {
            void loadMapStage();
            search(query);
          }}
          onRetry={start}
          onBack={back}
          // Without location support the page opens here by itself: don't take focus on load.
          takeFocus={state.problem !== 'unsupported'}
        />
      );
    default:
      return <MapStage state={state} onRefresh={start} onSearch={openSearch} onSearchFor={searchFrom} onRetry={retry} onFarOpen={checkFarOpen} />;
  }
}
