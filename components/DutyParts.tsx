'use client';

/**
 * The duty-pharmacy lookup: the data and what draws it, in one file that arrives when a card
 * needs it (lib/duty.ts). Nothing else imports this file, or data/countries/duty.ts.
 *
 * Every way out is a plain link or a phone number, as the country's official page gives it.
 * A link carries nothing: no position, no place, no referrer. Nothing is fetched from a lookup.
 */

import { useId } from 'react';
import { dutyFor, dutyHasWay, type Duty } from '@/data/countries/duty';
import { useI18n } from '@/lib/i18n/context';
import { rich } from '@/lib/i18n/rich';
import { Row, RowGroup } from './Actions';
import { ExternalLink, NEW_TAB } from './NewTab';
import styles from './NearestOpenCard.module.css';

export { dutyFor, dutyHasWay };

/** The official lookup as a row: a link that leaves the app. In the card's own list it also says why it is there. */
function LookupRow({ duty, explain }: { duty: Duty; explain?: boolean }) {
  const { t, locale } = useI18n();
  if (!duty.lookup) return null;
  const { url, site, covers } = duty.lookup;
  const title = covers === 'regions' ? t.duty.regions : t.duty.find;
  const sub = explain ? `${site}: ${t.duty.turns}` : site;
  return (
    <Row
      icon="search"
      title={title}
      sub={sub}
      ends="external"
      href={url[locale]}
      {...NEW_TAB}
      aria-label={`${title} ${sub} ${t.app.newTab}`}
      rowProps={{ 'data-duty': 'lookup' }}
    />
  );
}

/**
 * The number that tells which pharmacy is on duty, with the call's price where the official
 * page states one. In the card's own list it also says what the number is for; under the
 * lookup's heading that is said already.
 */
function PhoneRow({ duty, explain }: { duty: Duty; explain?: boolean }) {
  const { t, locale } = useI18n();
  if (!duty.phone) return null;
  const { tel, shown, price } = duty.phone;
  const sub = [explain && t.duty.callSub, price?.[locale]].filter(Boolean).join('. ');
  return <Row icon="phone" title={t.duty.call(shown)} sub={sub || undefined} href={`tel:${tel}`} rowProps={{ 'data-duty': 'phone' }} />;
}

/**
 * One row for a card's own list, where our answer stays first: the lookup, or the number where
 * there is no lookup. Nothing where the country has neither: `DutyNote` says the rest.
 */
export function DutyRow({ duty }: { duty: Duty }) {
  return duty.lookup ? <LookupRow duty={duty} explain /> : <PhoneRow duty={duty} explain />;
}

/** Why the list may miss the one on duty, and where no lookup exists, what an official page says a closed door shows. */
function Why({ duty }: { duty: Duty }) {
  const { t, f } = useI18n();
  return (
    <p className={styles.context} data-duty="why">
      {t.duty.why(f.countryName(duty.code))}
      {!duty.lookup && duty.door && ` ${t.duty.door}`}
    </p>
  );
}

/** Where a country has neither a lookup nor a number: the one line, in a card where our answer stays first. */
export function DutyNote({ duty }: { duty: Duty }) {
  return <Why duty={duty} />;
}

/**
 * Nothing nearby is open: the country's lookup leads the card, above the farther open
 * pharmacy and the first one to open (PLAN.md section 5). The pharmacy on duty tonight may
 * be nearer than either, and only the lookup knows which it is.
 */
export function DutyLead({ duty }: { duty: Duty }) {
  const { t, f, locale } = useI18n();
  const id = useId();
  return (
    <section className={styles.duty} aria-labelledby={`${id}-h`} data-duty="lead">
      <h2 id={`${id}-h`} className={styles.label}>
        {t.duty.title}
      </h2>
      <Why duty={duty} />
      {dutyHasWay(duty) && (
        <RowGroup>
          <LookupRow duty={duty} />
          <PhoneRow duty={duty} />
        </RowGroup>
      )}
      <p className={styles.dutySource}>
        {rich(t.duty.source, {
          by: <ExternalLink href={duty.source.url}>{duty.source.by[locale]}</ExternalLink>,
          checked: <time dateTime={duty.source.checked}>{f.date(duty.source.checked)}</time>,
        })}
      </p>
    </section>
  );
}
