'use client';

import type { SkyAt } from '@/lib/sky';
import type { Scene } from '@/lib/types';
import { FirstVisit } from './FirstVisit';
import { SearchingView } from './SearchingView';

type Props =
  | { phase: 'locating' | 'waiting'; sky?: SkyAt; onSearch?: () => void }
  /** The user's position is known; only you-are-here is on the map. */
  | { phase: 'searching'; scene: Scene };

/**
 * Locating keeps the first-visit window and swaps the button for a status line.
 * Searching shows the map with a fixed-height placeholder, so the results don't jump in.
 */
export function ProgressView(props: Props) {
  if (props.phase !== 'searching') return <FirstVisit phase={props.phase} sky={props.sky} onSearch={props.onSearch} />;
  return <SearchingView scene={props.scene} />;
}
