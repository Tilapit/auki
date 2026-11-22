'use client';

import { useI18n } from '@/lib/i18n/context';
import type { SkyAt } from '@/lib/sky';
import type { Scene } from '@/lib/types';
import { CrossGlyph } from './CrossGlyph';
import { FirstVisit } from './FirstVisit';
import { ResultsShell } from './ResultsShell';
import { StaticMap } from './StaticMap';
import styles from './ProgressView.module.css';

type Props =
  | { phase: 'locating' | 'waiting'; sky?: SkyAt; onSearch?: () => void }
  /** The user's position is known; only you-are-here is on the map. */
  | { phase: 'searching'; scene: Scene };

const NO_STREETS = new Set<string>();

/**
 * Locating keeps the first-visit window and swaps the button for a status line.
 * Searching shows the map with a fixed-height placeholder, so the results don't jump in.
 */
export function ProgressView(props: Props) {
  const { t } = useI18n();
  if (props.phase !== 'searching') return <FirstVisit phase={props.phase} sky={props.sky} onSearch={props.onSearch} />;
  return (
    <ResultsShell
      title={t.results.title}
      barLine={t.results.searchingShort}
      sheet="static"
      mapLabel={t.map.label}
      map={<StaticMap scene={props.scene} needsStreet={NO_STREETS} userOnly />}
    >
      <p role="status" className={styles.status}>
        {t.results.searching}
      </p>
      {/* Unlit crosses wait in the rows; the open ones light up when the answer arrives. */}
      <div aria-hidden="true" className={styles.placeholder}>
        <div className={styles.card}>
          <CrossGlyph state="mono" size={24} className={styles.unlit} />
          <span className={styles.lines}>
            <span className={styles.bar} style={{ width: '62%', height: 18 }} />
            <span className={styles.bar} style={{ width: '38%' }} />
          </span>
        </div>
        {[54, 40, 48].map((width) => (
          <div key={width} className={styles.row}>
            <CrossGlyph state="mono" size={20} className={styles.unlit} />
            <span className={styles.bar} style={{ width: `${width}%` }} />
          </div>
        ))}
      </div>
    </ResultsShell>
  );
}
