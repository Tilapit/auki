'use client';

import { useI18n } from '@/lib/i18n/context';
import { rich } from '@/lib/i18n/rich';
import { OSM_COPYRIGHT_URL } from '@/lib/maps';
import { cx } from './cx';
import { ExternalLink } from './NewTab';
import styles from './SiteFooter.module.css';

interface Props {
  variant: 'dusk' | 'panel';
  /** Results views say what the distances are. */
  distance?: 'walking' | 'straight';
  /** The first visit credits the data source here; results credit it on the map. */
  credit?: boolean;
  /** Results carry one small line with the EU emergency number. No advice, only the number. */
  emergency?: boolean;
  /** Results say when their data was fetched from OpenStreetMap (epoch seconds), and link to the data page. */
  dataFrom?: number;
  /**
   * At home the prescription banner is not shown, so its control is not there either. This line
   * brings the banner up for someone whose phone suggests the wrong country (PLAN.md section 5).
   */
  onPrescription?: () => void;
}

/**
 * The footer every screen carries: the privacy line and the not-affiliated line.
 * Rendered by each view, not the layout, because it sits in a different place in each one.
 */
export function SiteFooter({ variant, distance, credit, emergency, dataFrom, onPrescription }: Props) {
  const { t, f, locale } = useI18n();
  return (
    <footer className={cx(styles.footer, styles[variant])}>
      {emergency && <p>{rich(t.footer.emergency, { number: <a href="tel:112">112</a> })}</p>}
      {distance && (
        <p>
          {distance === 'walking' ? t.footer.walking : t.footer.straight} {t.footer.privacy}
        </p>
      )}
      {dataFrom !== undefined && (
        <p>
          {rich(t.footer.fetched, {
            date: <time dateTime={new Date(dataFrom * 1000).toISOString()}>{f.dayOf(dataFrom)}</time>,
            // A plain link: the footer is on the first window too, and the router's link would add to its JavaScript.
            about: <a href={`/${locale}/data`}>{t.footer.aboutData}</a>,
          })}
        </p>
      )}
      {onPrescription && (
        <p>
          <button type="button" className={styles.ask} onClick={onPrescription}>
            {t.footer.prescription}
          </button>
        </p>
      )}
      <p className={styles.project}>
        <span>{t.footer.project}</span> <span>{t.footer.notTreat}</span>
      </p>
      {credit && (
        <p className={styles.credit}>
          {rich(t.footer.data, { osm: <ExternalLink href={OSM_COPYRIGHT_URL}>{t.footer.osm}</ExternalLink> })}
        </p>
      )}
    </footer>
  );
}
