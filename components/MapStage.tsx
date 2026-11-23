'use client';

import { useEffect, useMemo } from 'react';
import { useLivePosition, type Fix } from '@/hooks/useLivePosition';
import { useNow } from '@/hooks/useNow';
import { noneShownOpen, staysOpen, toScene } from '@/lib/live';
import { sceneAt } from '@/lib/scene';
import type { MapView } from '@/lib/state';
import { ProblemView } from './ProblemView';
import { ResultsView } from './ResultsView';
import { SearchingView } from './SearchingView';

interface Props {
  state: MapView;
  onRefresh: () => void;
  /** Opens the place search. */
  onSearch: () => void;
  /** Looks a place name up, from a view that has its own search box. */
  onSearchFor: (query: string) => void;
  onRetry: () => void;
  onFarOpen: (now: number) => void;
  /** Every fix while the device's position is followed. */
  onFix: (fix: Fix) => void;
}

/**
 * Every view that comes once the position is known: searching, results, and the problems
 * the tiles can bring. One chunk, loaded while the browser asks for permission.
 */
export function MapStage({ state, onRefresh, onSearch, onSearchFor, onRetry, onFarOpen, onFix }: Props) {
  const empty = useMemo(() => sceneAt(state.position, state.at), [state.position, state.at]);

  switch (state.view) {
    case 'searching':
      return <SearchingView scene={empty} onRefresh={onRefresh} onSearch={onSearch} focusTitle />;
    case 'results':
      return <LiveResults state={state} onRefresh={onRefresh} onSearch={onSearch} onFarOpen={onFarOpen} onFix={onFix} />;
    case 'none':
      return <ProblemView kind="none" scene={empty} onSearch={onSearchFor} />;
    case 'notCovered':
      return <ProblemView kind="notCovered" scene={empty} country={state.country} onSearch={onSearchFor} />;
    case 'failed':
      return <ProblemView kind={state.offline ? 'offline' : 'error'} scene={empty} onRetry={onRetry} onOpenSearch={onSearch} />;
  }
}

/** Results that keep time: every minute the statuses are worked out again from the intervals on the device. */
function LiveResults({ state, onRefresh, onSearch, onFarOpen, onFix }: { state: Extract<MapView, { view: 'results' }> } & Pick<Props, 'onRefresh' | 'onSearch' | 'onFarOpen' | 'onFix'>) {
  const now = useNow();
  const deviceZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const { position, result } = state;
  const scene = useMemo(() => toScene({ position, result, now, deviceZone }), [position, result, now, deviceZone]);
  // The dot follows the device while the page is visible. A searched place is not where the user is: no watch there.
  const fix = useLivePosition(position.source === 'device', onFix);

  // The moment the first result is on screen, for the measurement of PLAN.md section 12.
  useEffect(() => {
    performance.mark('first-result');
  }, []);

  // When the last open one nearby closes, look farther. The tiles are mostly on the device already.
  useEffect(() => {
    if (noneShownOpen(result, now) && !(result.farOpen && staysOpen(result.farOpen.pharmacy, now))) onFarOpen(now);
  }, [result, now, onFarOpen]);

  return <ResultsView scene={scene} onRefresh={onRefresh} onSearch={onSearch} focusTitle reveal basemap now={now} you={fix} />;
}
