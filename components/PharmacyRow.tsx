'use client';

import { useI18n } from '@/lib/i18n/context';
import { displayName, glyphFor } from '@/lib/status';
import { travel } from '@/lib/travel';
import type { Pharmacy, Scene } from '@/lib/types';
import { CrossGlyph } from './CrossGlyph';
import { cx } from './cx';
import { Measure } from './Measure';
import { OpenStatus } from './OpenStatus';
import styles from './PharmacyRow.module.css';

interface Props {
  pharmacy: Pharmacy;
  distance: Scene['distance'];
  /** Shown next to the name when another result has the same name. */
  withStreet?: boolean;
  selected?: boolean;
  onSelect?: (pharmacy: Pharmacy) => void;
}

/**
 * One result. The name is the button; its hit area is stretched over the row.
 * It is the only control in the row, so nothing interactive is nested.
 */
export function PharmacyRow({ pharmacy, distance, withStreet, selected, onSelect }: Props) {
  const i18n = useI18n();
  const way = travel(i18n, pharmacy, distance);
  return (
    <li id={pharmacy.id} className={cx(styles.row, selected && styles.selected)}>
      <span className={styles.glyph}>
        <CrossGlyph state={glyphFor(pharmacy.status)} />
      </span>
      <div className={styles.body}>
        <h3 className={styles.name}>
          <button type="button" className={styles.button} aria-current={selected ? 'true' : undefined} onClick={() => onSelect?.(pharmacy)}>
            {displayName(i18n, pharmacy)}
            {withStreet && pharmacy.street && <span className={styles.street}> {pharmacy.street}</span>}
          </button>
        </h3>
        <OpenStatus status={pharmacy.status} />
        {pharmacy.dispensing === false && <p className={styles.note}>{i18n.t.status.noPrescriptions}</p>}
      </div>
      <div className={styles.travel}>
        <p className={cx(styles.time, 'tnum')}>
          <Measure {...way.primary} />
        </p>
        {way.distance && (
          <p className={cx(styles.distance, 'tnum')}>
            <Measure {...way.distance} />
          </p>
        )}
      </div>
    </li>
  );
}
