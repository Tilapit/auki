'use client';

import { useI18n } from '@/lib/i18n/context';
import { glyphFor } from '@/lib/status';
import { travel } from '@/lib/travel';
import type { Pharmacy, Scene } from '@/lib/types';
import { CrossGlyph } from './CrossGlyph';
import { cx } from './cx';
import styles from './MapMarker.module.css';

interface Props {
  pharmacy: Pharmacy;
  distance: Scene['distance'];
  /** Named like the list row: "Töölön apteekki, sulkeutuu pian, klo 21, 3 minuuttia kävellen". */
  label: string;
  selected?: boolean;
  onSelect?: (pharmacy: Pharmacy) => void;
}

/**
 * A pharmacy on the map. Open or closing: a capsule with the cross and the walking time.
 * Closed: a small unlit disc without a time. Hours unknown: a dashed cross.
 */
export function MapMarker({ pharmacy, distance, label, selected, onSelect }: Props) {
  const i18n = useI18n();
  const glyph = glyphFor(pharmacy.status);
  const lit = glyph === 'open' || glyph === 'soon';
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      className={cx(styles.marker, styles[glyph], selected && styles.selected)}
      onClick={() => onSelect?.(pharmacy)}
    >
      {lit ? (
        <span className={cx(styles.capsule, 'tnum')}>
          <CrossGlyph state="mono" size={selected ? 17 : 15} />
          {travel(i18n, pharmacy, distance).primary.short}
        </span>
      ) : (
        <span className={styles.disc}>
          <CrossGlyph state={glyph} size={selected ? 17 : 14} stroke={2.2} />
        </span>
      )}
    </button>
  );
}

/**
 * You are here: cobalt dot, white ring, accuracy halo. The halo's width is `--halo`, which
 * the map sets from the accuracy the device reports; `approximate` is for where no map does.
 */
export function YouAreHere({ approximate }: { approximate?: boolean }) {
  return (
    <span aria-hidden="true" className={cx(styles.you, approximate && styles.approximate)}>
      <span className={styles.halo} />
      <span className={styles.dot} />
    </span>
  );
}
