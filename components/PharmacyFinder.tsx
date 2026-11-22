'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { usePharmacySearch } from '@/hooks/usePharmacySearch';
import { useI18n } from '@/lib/i18n/context';
import { sceneAt } from '@/lib/scene';
import { FirstVisit } from './FirstVisit';
import { PlaceSearch } from './PlaceSearch';

// The map views are not needed for the first paint. They load while the browser asks for
// permission, or while the place is looked up.
const loadSearchingView = () => import('./SearchingView').then((module) => module.SearchingView);
const SearchingView = dynamic(loadSearchingView, { ssr: false });

/** Owns the state and picks the view (PLAN.md 7.3). One view per state. */
export function PharmacyFinder() {
  const { locale } = useI18n();
  const { state, locate, openSearch, search, back } = usePharmacySearch(locale);
  const scene = useMemo(() => (state.view === 'searching' ? sceneAt(state.position, state.at) : undefined), [state]);

  const start = () => {
    void loadSearchingView();
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
            void loadSearchingView();
            search(query);
          }}
          onRetry={start}
          onBack={back}
          // Without location support the page opens here by itself: don't take focus on load.
          takeFocus={state.problem !== 'unsupported'}
        />
      );
    case 'searching':
      return scene ? <SearchingView scene={scene} onRefresh={start} onSearch={openSearch} focusTitle /> : null;
  }
}
