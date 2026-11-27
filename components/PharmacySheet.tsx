'use client';

import { Fragment } from 'react';
import { lowerFirst } from '@/lib/format';
import { useI18n } from '@/lib/i18n/context';
import { rich } from '@/lib/i18n/rich';
import { appleDirectionsUrl, emailAddress, googleDirectionsUrl, osmNoteUrl, websiteHost } from '@/lib/maps';
import { hoursUnknown } from '@/lib/results';
import { dayHoursText, daysLabel, displayName, glyphFor, statusText } from '@/lib/status';
import { travel, withinWalk } from '@/lib/travel';
import type { Summary } from '@/lib/reports';
import type { CountryInfo, Pharmacy, Scene } from '@/lib/types';
import { ActionBar, ActionButton, Row, RowGroup } from './Actions';
import { IconButton } from './Button';
import { CrossGlyph } from './CrossGlyph';
import { Icon } from './Icon';
import { Measure } from './Measure';
import { ExternalLink, NEW_TAB, NewTabNote } from './NewTab';
import { OpenStatus } from './OpenStatus';
import { ReportNote, ReportRow, ReportSummary } from './ReportDialog';
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
  /** The address of that service, as the row names it: "apteekki.fi". */
  medicineSite?: string;
  /**
   * Visitors' reports (PLAN.md 7.10): what others told, once there are three; the row that
   * offers to tell of one's own visit; and what stands in the row's place after it was used.
   * Left out where there is no report service: then the sheet is as it was without it.
   */
  report?: { summary?: Summary; offered: boolean; note?: 'thanks' | 'limit'; onOpen: () => void; onSkip: () => void };
  onClose?: () => void;
  onSelect?: (pharmacy: Pharmacy) => void;
}

/**
 * An email address or a host name with places to break: after the at sign and before each dot,
 * where one would break it by hand. Nothing is added to the text itself, so it copies as it is.
 */
function breakable(address: string) {
  return address.split(/(@|\.)/).map((part, index) => (
    <Fragment key={index}>
      {part === '.' && <wbr />}
      {part}
      {part === '@' && <wbr />}
    </Fragment>
  ));
}

/**
 * Details of one pharmacy, in the order a person in the street needs them (Janne, 27 Nov 2026):
 *
 * 1. the name, whether it is open and how far it is, large;
 * 2. the main actions as one row of buttons: the route, the call, the medicine search;
 * 3. the hours and the contacts, an inset group of their own;
 * 4. what visitors told, when there are three reports;
 * 5. everything else that can be done, as rows of a list: the next open pharmacy, the other
 *    map app, the counter card, telling of one's own visit.
 *
 * The route links are real links that carry only the pharmacy's position (PLAN.md 7.6), and so
 * does the link to correct the data in OpenStreetMap. The pharmacy's own email and website are
 * shown when OpenStreetMap has them: emailing a prescription ahead often works (PLAN.md section 2).
 */
export function PharmacySheet({ pharmacy, distance, city, headingId, nextOpen, nextOpenWithStreet, country, onShowCard, onMedicine, medicineSite, report, onClose, onSelect }: Props) {
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
    <ExternalLink href={osmNoteUrl(pharmacy.lat, pharmacy.lon)} aria-label={t.sheet.fixLabel(name)}>
      {t.sheet.fix}
    </ExternalLink>
  );

  return (
    <div className={styles.sheet}>
      <button type="button" className={styles.backLink} onClick={onClose}>
        <Icon name="back" size={18} />
        {t.sheet.backToList}
      </button>

      <div className={styles.head}>
        <span className={styles.glyph}>
          <CrossGlyph state={glyphFor(pharmacy.status)} size={26} />
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
          <OpenStatus status={pharmacy.status} strong className={styles.status} />
          {/* Hours that are missing or can't be read are the first thing worth correcting. */}
          {hoursUnknown(pharmacy.status) && <p className={styles.fix}>{fix}</p>}
          {pharmacy.dispensing === false && <p className={styles.note}>{t.status.noPrescriptions}</p>}
        </div>
        <p className={styles.travel}>
          <span className={styles.time}>
            <Measure {...way.primary} />
          </span>
          <span className={styles.distance}>
            <Measure short={way.secondary.short} long={way.secondary.long || way.secondary.short} />
          </span>
        </p>
      </div>

      {/* The phone's sheet rests with its edge under this row, or under the facts when they fit too (data-fold). */}
      <ActionBar fold>
        <ActionButton
          primary
          external
          icon={walk ? 'walk' : 'directions'}
          sub={t.sheet.googleIn}
          note={<NewTabNote />}
          href={googleDirectionsUrl(pharmacy.lat, pharmacy.lon, walk)}
          {...NEW_TAB}
        >
          {t.card.route}
        </ActionButton>
        {pharmacy.phone && (
          <ActionButton icon="phone" href={`tel:${pharmacy.phone.replace(/\s/g, '')}`} aria-label={t.card.callLabel(name)}>
            {t.card.call}
          </ActionButton>
        )}
        {onMedicine && medicineSite && (
          <ActionButton icon="search" aria-haspopup="dialog" aria-label={`${t.medicine.title} ${medicineSite}`} onClick={onMedicine}>
            {t.medicine.short}
          </ActionButton>
        )}
      </ActionBar>

      {(hours.length > 0 || access || pharmacy.phone || email || website) && (
        <dl className={styles.facts} data-fold>
          {hours.length > 0 && (
            <>
              <dt>{t.sheet.hours}</dt>
              <dd>
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
              <dd>{pharmacy.phone}</dd>
            </>
          )}
          {email && (
            <>
              <dt>{t.sheet.email}</dt>
              <dd>
                <a href={`mailto:${email}`}>{breakable(email)}</a>
              </dd>
            </>
          )}
          {website && pharmacy.website && (
            <>
              <dt>{t.sheet.website}</dt>
              <dd>
                <ExternalLink href={pharmacy.website}>{breakable(website)}</ExternalLink>
              </dd>
            </>
          )}
        </dl>
      )}

      {/* What visitors told stands with the facts; the offer to tell is the last of the rows. Never above the route. */}
      {report?.summary && <ReportSummary summary={report.summary} />}

      <RowGroup>
        {nextOpen && nextWay && (
          <Row
            icon={<CrossGlyph state={glyphFor(nextOpen.status)} size={20} />}
            title={t.card.outOfStockTitle}
            sub={[displayName(i18n, nextOpen), nextOpenWithStreet && nextOpen.street, nextWay.primary.short, lowerFirst(statusText(i18n, nextOpen.status))].filter(Boolean).join(', ')}
            onClick={() => onSelect?.(nextOpen)}
          />
        )}
        <Row
          icon={walk ? 'walk' : 'directions'}
          title={t.sheet.apple}
          ends="external"
          href={appleDirectionsUrl(pharmacy.lat, pharmacy.lon, walk)}
          {...NEW_TAB}
          aria-label={`${t.sheet.apple} ${t.app.newTab}`}
        />
        {country && (
          <Row
            icon="card"
            title={t.card.showAtCounter}
            sub={t.card.counterCardIn(country.inLanguage[i18n.locale])}
            aria-haspopup="dialog"
            onClick={onShowCard}
          />
        )}
        {report?.offered && <ReportRow name={name} onOpen={report.onOpen} onSkip={report.onSkip} />}
      </RowGroup>

      {report?.note && <ReportNote kind={report.note} />}

      <p className={styles.footnote}>
        {t.sheet.handOff} {pharmacy.checkDate ? t.sheet.sourceChecked(f.date(pharmacy.checkDate)) : t.sheet.source} {rich(t.sheet.wrong, { link: fix })}
      </p>
    </div>
  );
}
