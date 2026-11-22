'use client';

import { useI18n } from '@/lib/i18n/context';
import { rich } from '@/lib/i18n/rich';
import { OSM_COPYRIGHT_URL } from '@/lib/maps';
import { cx } from './cx';
import styles from './SiteFooter.module.css';

interface Props {
  variant: 'dusk' | 'panel';
  /** Results views say what the distances are. */
  distance?: 'walking' | 'straight';
  /** The first visit credits the data source here; results credit it on the map. */
  credit?: boolean;
  /** Results carry one small line with the EU emergency number. No advice, only the number. */
  emergency?: boolean;
}

/**
 * The footer every screen carries: the privacy line and the not-affiliated line.
 * Rendered by each view, not the layout, because it sits in a different place in each one.
 */
export function SiteFooter({ variant, distance, credit, emergency }: Props) {
  const { t } = useI18n();
  return (
    <footer className={cx(styles.footer, styles[variant])}>
      {emergency && <p>{rich(t.footer.emergency, { number: <a href="tel:112">112</a> })}</p>}
      {distance && (
        <p>
          {distance === 'walking' ? t.footer.walking : t.footer.straight} {t.footer.privacy}
        </p>
      )}
      <p className={styles.project}>
        <span>{t.footer.project}</span> <span>{t.footer.notTreat}</span>
      </p>
      {credit && (
        <p className={styles.credit}>
          {rich(t.footer.data, { osm: <a href={OSM_COPYRIGHT_URL}>{t.footer.osm}</a> })}
        </p>
      )}
    </footer>
  );
}
