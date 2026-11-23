'use client';

import { useId, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import type { Pharmacy, Scene } from '@/lib/types';
import { earliestToOpen } from '@/lib/results';
import { opensWhen } from '@/lib/status';
import { CrossGlyph } from './CrossGlyph';
import { Icon } from './Icon';
import { PharmacyRow } from './PharmacyRow';
import styles from './PharmacyList.module.css';

interface RowsProps {
  pharmacies: Pharmacy[];
  distance: Scene['distance'];
  needsStreet: Set<string>;
  selectedId?: string;
  onSelect?: (pharmacy: Pharmacy) => void;
}

/** "Muut lähellä": one surface with hairline dividers, in distance order. Every row is shown; the panel scrolls. Never reorders. */
export function PharmacyList({ pharmacies, distance, needsStreet, selectedId, onSelect, alone }: RowsProps & { /** No card above: these are not "the others". */ alone?: boolean }) {
  const { t } = useI18n();
  const id = useId();
  return (
    <section aria-labelledby={`${id}-h`}>
      <div className={styles.head}>
        <h2 id={`${id}-h`} className={styles.title}>
          {alone ? t.results.nearest : t.results.others}
        </h2>
        <span className={styles.sort}>{distance === 'walking' ? t.results.byWalking : t.results.byStraight}</span>
      </div>
      <ol className={styles.list}>
        {pharmacies.map((pharmacy) => (
          <PharmacyRow
            key={pharmacy.id}
            pharmacy={pharmacy}
            distance={distance}
            withStreet={needsStreet.has(pharmacy.id)}
            selected={pharmacy.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </ol>
    </section>
  );
}

interface GroupProps extends RowsProps {
  initiallyOpen?: boolean;
  /** The pharmacy that opens first is named in the card above: these are the others. */
  firstShownAbove?: boolean;
}

/** "Kiinni nyt": at night, when everything nearer than the open one is closed, the closed ones fold into one plain row. */
export function ClosedGroup({ pharmacies, distance, needsStreet, selectedId, onSelect, initiallyOpen = false, firstShownAbove = false }: GroupProps) {
  const i18n = useI18n();
  const { t } = i18n;
  const id = useId();
  const [open, setOpen] = useState(initiallyOpen);
  // At night the useful fact is not how many are closed but when the first one opens.
  const first = earliestToOpen(pharmacies)?.opens;
  const firstWhen = first && opensWhen(i18n, first);
  return (
    <section className={styles.group} aria-labelledby={`${id}-h`}>
      <div className={styles.groupHead}>
        <CrossGlyph state="closed" />
        <div className={styles.groupText}>
          <h2 id={`${id}-h`} className={styles.title}>
            {t.results.closedNow}
          </h2>
          <p className={styles.count}>
            {firstShownAbove
              ? t.results.closedOthers(pharmacies.length)
              : firstWhen
                ? t.results.closedFirstOpens(pharmacies.length, firstWhen)
                : t.results.closedCount(pharmacies.length)}
          </p>
        </div>
        <button type="button" className={styles.toggle} aria-expanded={open} aria-controls={`${id}-list`} onClick={() => setOpen(!open)}>
          {open ? t.results.hide : t.results.show}
          <Icon name={open ? 'chevronDown' : 'chevron'} size={18} />
        </button>
      </div>
      <ol id={`${id}-list`} hidden={!open} className={styles.groupList}>
        {pharmacies.map((pharmacy) => (
          <PharmacyRow
            key={pharmacy.id}
            pharmacy={pharmacy}
            distance={distance}
            withStreet={needsStreet.has(pharmacy.id)}
            selected={pharmacy.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </ol>
    </section>
  );
}
