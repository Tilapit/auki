'use client';

import { lowerFirst } from '@/lib/format';
import { useI18n } from '@/lib/i18n/context';
import { rich } from '@/lib/i18n/rich';
import { appleDirectionsUrl, emailAddress, googleDirectionsUrl, osmNoteUrl, websiteHost } from '@/lib/maps';
import { hoursUnknown } from '@/lib/results';
import { dayHoursText, daysLabel, displayName, glyphFor, statusText } from '@/lib/status';
import { travel, withinWalk } from '@/lib/travel';
import type { CountryInfo, Pharmacy, Scene } from '@/lib/types';
import { Button, IconButton } from './Button';
import { CrossGlyph } from './CrossGlyph';
import { cx } from './cx';
import { Icon } from './Icon';
import { Measure } from './Measure';
import { MedicineLine } from './MedicineDialog';
import { OpenStatus } from './OpenStatus';
import styles from './PharmacySheet.module.css';

interface Props {
  pharmacy: Pharmacy;
  distance: Scene['distance'];
  /** The pharmacy's city, when it is not the place named above the results. */
  city?: string;
  /** id for aria-labelledby on the container. */
  headingId: string;
  /** The next open pharmacy other than this one, for "Ei varastossa?". */
  nextOpen?: Pharmacy;
  nextOpenWithStreet?: boolean;
  /** Abroad: the counter card is offered here too, not only for the nearest pharmacy. */
  country?: CountryInfo;
  onShowCard?: () => void;
  /** Opens the medicine dialog for this pharmacy's country. Left out where the country has no stock search of its own. */
  onMedicine?: () => void;
  onClose?: () => void;
  onSelect?: (pharmacy: Pharmacy) => void;
}

/**
 * Details of one pharmacy and the hand-off to a map app. The route links are real links
 * that carry only the pharmacy's position (PLAN.md 7.6), and so does the link to correct the
 * data in OpenStreetMap. The pharmacy's own email and website are shown when OpenStreetMap
 * has them: emailing a prescription ahead often works (PLAN.md section 2).
 */
export function PharmacySheet({ pharmacy, distance, city, headingId, nextOpen, nextOpenWithStreet, country, onShowCard, onMedicine, onClose, onSelect }: Props) {
  const i18n = useI18n();
  const { t, f } = i18n;
  const name = displayName(i18n, pharmacy);
  const way = travel(i18n, pharmacy, distance);
  const address = [pharmacy.street, city].filter(Boolean).join(', ');
  // Too far to walk: the links name no way of travel and the map app picks one.
  const walk = withinWalk(pharmacy);
  const hours =
    pharmacy.hours?.map((line) => `${daysLabel(i18n, line.days)} ${dayHoursText(i18n, line.hours)}`) ??
    (pharmacy.status.kind === 'unparseable' || pharmacy.status.kind === 'uncertain' ? [pharmacy.status.raw] : []);
  const access = pharmacy.wheelchair && [t.sheet.wheelchair[pharmacy.wheelchair], pharmacy.wheelchairNote].filter(Boolean).join('. ');
  const nextWay = nextOpen && travel(i18n, nextOpen, distance);
  const email = pharmacy.email && emailAddress(pharmacy.email);
  const website = pharmacy.website && websiteHost(pharmacy.website);
  const fix = (
    <a href={osmNoteUrl(pharmacy.lat, pharmacy.lon)} aria-label={t.sheet.fixLabel(name)}>
      {t.sheet.fix}
    </a>
  );

  return (
    <div className={styles.sheet}>
      <button type="button" className={styles.backLink} onClick={onClose}>
        <Icon name="back" size={18} />
        {t.sheet.backToList}
      </button>

      <div className={styles.head}>
        <span className={styles.glyph}>
          <CrossGlyph state={glyphFor(pharmacy.status)} size={24} />
        </span>
        <div>
          <h2 id={headingId} tabIndex={-1} data-dialog-focus className={styles.name}>
            {name}
          </h2>
          {address && <p className={styles.address}>{address}</p>}
        </div>
        <IconButton icon="close" label={t.app.close} variant="quiet" className={styles.close} onClick={onClose} />
      </div>

      <div className={styles.summary}>
        <div>
          <OpenStatus status={pharmacy.status} strong />
          {/* Hours that are missing or can't be read are the first thing worth correcting. */}
          {hoursUnknown(pharmacy.status) && <p className={styles.fix}>{fix}</p>}
          {pharmacy.dispensing === false && <p className={styles.note}>{t.status.noPrescriptions}</p>}
        </div>
        <p className={styles.travel}>
          <span className={cx(styles.time, 'tnum')}>
            <Measure {...way.primary} />
          </span>
          <span className={cx(styles.distance, 'tnum')}>
            <Measure short={way.secondary.short} long={way.secondary.long || way.secondary.short} />
          </span>
        </p>
      </div>

      {(hours.length > 0 || access || pharmacy.phone || email || website) && (
        <dl className={styles.facts}>
          {hours.length > 0 && (
            <>
              <dt>{t.sheet.hours}</dt>
              <dd className="tnum">
                {hours.map((line) => (
                  <span key={line} className={styles.line}>
                    {line}
                  </span>
                ))}
              </dd>
            </>
          )}
          {access && (
            <>
              <dt>{t.sheet.accessibility}</dt>
              <dd>{access}</dd>
            </>
          )}
          {pharmacy.phone && (
            <>
              <dt>{t.sheet.phone}</dt>
              <dd className="tnum">{pharmacy.phone}</dd>
            </>
          )}
          {email && (
            <>
              <dt>{t.sheet.email}</dt>
              <dd>
                <a href={`mailto:${email}`}>{email}</a>
              </dd>
            </>
          )}
          {website && pharmacy.website && (
            <>
              <dt>{t.sheet.website}</dt>
              <dd>
                <a href={pharmacy.website}>{website}</a>
              </dd>
            </>
          )}
        </dl>
      )}

      <div className={styles.actions}>
        <Button
          variant="primary"
          size="block"
          icon={walk ? 'walk' : 'directions'}
          trailing="external"
          href={googleDirectionsUrl(pharmacy.lat, pharmacy.lon, walk)}
        >
          {t.sheet.google}
        </Button>
        <Button size="block" icon={walk ? 'walk' : 'directions'} trailing="external" href={appleDirectionsUrl(pharmacy.lat, pharmacy.lon, walk)}>
          {t.sheet.apple}
        </Button>
        {pharmacy.phone && (
          <Button size="block" icon="phone" href={`tel:${pharmacy.phone.replace(/\s/g, '')}`} aria-label={t.card.callLabel(name)}>
            {t.card.call}
          </Button>
        )}
        {country && (
          <Button size="block" icon="card" aria-label={t.card.showAtCounterLabel(country.inLanguage[i18n.locale])} onClick={onShowCard}>
            {t.card.showAtCounter}
          </Button>
        )}
      </div>

      {nextOpen && nextWay && (
        <p className={styles.next}>
          {rich(t.card.outOfStock, {
            name: (
              <a
                href={`#${nextOpen.id}`}
                className={styles.nextName}
                onClick={(event) => {
                  event.preventDefault();
                  onSelect?.(nextOpen);
                }}
              >
                {displayName(i18n, nextOpen)}
              </a>
            ),
            details: [nextOpenWithStreet && nextOpen.street, nextWay.primary.short, lowerFirst(statusText(i18n, nextOpen.status))]
              .filter(Boolean)
              .join(', '),
          })}
        </p>
      )}

      {onMedicine && <MedicineLine className={styles.medicine} onOpen={onMedicine} />}

      <p className={styles.footnote}>
        {t.sheet.handOff} {pharmacy.checkDate ? t.sheet.sourceChecked(f.date(pharmacy.checkDate)) : t.sheet.source} {rich(t.sheet.wrong, { link: fix })}
      </p>
    </div>
  );
}
