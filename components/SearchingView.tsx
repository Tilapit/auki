'use client';

import { useI18n } from '@/lib/i18n/context';
import type { Scene } from '@/lib/types';
import { ApproximateNotice } from './ApproximateNotice';
import { CrossGlyph } from './CrossGlyph';
import { ResultsShell } from './ResultsShell';
import { MapView } from './MapView';
import styles from './ProgressView.module.css';

interface Props {
  /** The position, and the place name when it came from a search. No pharmacies yet. */
  scene: Scene;
  onRefresh?: () => void;
  onSearch?: () => void;
  /** In the real flow focus moves to the title when the view opens. */
  focusTitle?: boolean;
}

const NO_STREETS = new Set<string>();

/**
 * The position is known and the pharmacies are on their way: the map with only you-are-here,
 * and a fixed-height placeholder so that the results don't jump in.
 */
export function SearchingView({ scene, onRefresh, onSearch, focusTitle }: Props) {
  const { t } = useI18n();
  return (
    <ResultsShell
      place={scene.searched}
      updated={scene.updated}
      title={t.results.title}
      barLine={t.results.searchingShort}
      sheet="static"
      mapLabel={t.map.label}
      map={<MapView scene={scene} needsStreet={NO_STREETS} userOnly />}
      onRefresh={onRefresh}
      focusTitle={focusTitle}
    >
      {scene.user.approximate && <ApproximateNotice onSearch={onSearch} />}
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
