'use client';

/*
 * FROZEN COPY, for the comparison in /dev/states only ("The sheet and the card: before and
 * after", 27 Nov 2026): this component as it was before its hierarchy was reworked. Nothing in
 * the app imports it. Delete this folder, and the "before" views with it, once the new one is
 * accepted.
 */

import { useId, type ReactNode } from 'react';
import { isTightSlack } from '@/lib/ehditko';
import { lowerFirst } from '@/lib/format';
import { useI18n } from '@/lib/i18n/context';
import { rich } from '@/lib/i18n/rich';
import { displayName, fullName, glyphFor, statusText } from '@/lib/status';
import { travel, withinWalk } from '@/lib/travel';
import type { CountryInfo, Ehditko, Pharmacy, Scene } from '@/lib/types';
import { Button } from '../../Button';
import { CrossGlyph } from '../../CrossGlyph';
import { cx } from '../../cx';
import { Measure } from '../../Measure';
import { OpenStatus } from '../../OpenStatus';
import styles from './NearestOpenCard.module.css';

interface Props {
  pharmacy: Pharmacy;
  /** The pharmacy's city, when it is not the place named above the results. */
  city?: string;
  distance: Scene['distance'];
  ehditko: Ehditko;
  nextOpen?: Pharmacy;
  nextOpenWithStreet?: boolean;
  /**
   * Nothing nearby is open and this pharmacy is the farther one from the 24-hour search:
   * the nearby pharmacy that opens first, shown under it as the other way forward.
   */
  firstToOpen?: Pharmacy;
  /** Night case: how many nearer pharmacies are closed, and when most of them open. */
  closerClosed?: number;
  closedOpens?: Scene['closedOpens'];
  /** How many nearer pharmacies have hours we can't read: this one is then only the nearest we know to be open. */
  closerUnknown?: number;
  /** Abroad: offers the counter card. */
  country?: CountryInfo;
  onRoute?: (pharmacy: Pharmacy) => void;
  onSelect?: (pharmacy: Pharmacy) => void;
  onShowCard?: () => void;
  /** More sections of the same surface: the prescription banner abroad. */
  children?: ReactNode;
}

/**
 * "Lähin auki nyt". Ehditkö appears only when it tells something (PLAN.md section 5):
 * a timeline when closing is within the hour, a warning when you'd arrive too late,
 * otherwise just the status line.
 */
export function NearestOpenCard({
  pharmacy,
  city,
  distance,
  ehditko,
  nextOpen,
  nextOpenWithStreet,
  firstToOpen,
  closerClosed = 0,
  closedOpens,
  closerUnknown = 0,
  country,
  onRoute,
  onSelect,
  onShowCard,
  children,
}: Props) {
  const i18n = useI18n();
  const { t, f } = i18n;
  const id = useId();
  const label = fullName(i18n, pharmacy, pharmacy.name === null);
  const address = [pharmacy.street, city].filter(Boolean).join(', ');
  // Too far to walk: the route button stops promising a walk.
  const walk = withinWalk(pharmacy);
  const tooLate = ehditko.kind === 'tooLate';
  const tight = ehditko.kind === 'timeline' && pharmacy.walkMin !== undefined && isTightSlack(ehditko.slackMin, pharmacy.walkMin);

  const nextWay = nextOpen && travel(i18n, nextOpen, distance);
  const nextDetails =
    nextOpen &&
    nextWay &&
    [nextOpenWithStreet && nextOpen.street, nextWay.primary.short, lowerFirst(statusText(i18n, nextOpen.status))]
      .filter(Boolean)
      .join(', ');

  return (
    <section className={styles.card} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className={styles.label}>
        {t.results.nearestOpen}
      </h2>

      <CardHead pharmacy={pharmacy} address={address} distance={distance} onSelect={onSelect}>
        {ehditko.kind === 'none' && <OpenStatus status={pharmacy.status} strong className={styles.status} />}
      </CardHead>

      {ehditko.kind === 'timeline' && (
        <div className={cx(styles.timeline, tight && styles.tight)}>
          <p className="visually-hidden">
            {t.card.arrive} <time dateTime={ehditko.arrive}>{f.clock(ehditko.arrive)}</time>. {t.card.closes}{' '}
            <time dateTime={ehditko.closes}>{f.clock(ehditko.closes)}</time>. {t.card.slack(f.minutes(ehditko.slackMin, true))}.
          </p>
          <div aria-hidden="true">
            <div className={styles.ends}>
              <span>{t.card.arrive}</span>
              <span>{t.card.closes}</span>
            </div>
            <div className={styles.line}>
              <span className={cx(styles.clock, 'tnum')}>{f.clock(ehditko.arrive)}</span>
              <span className={styles.track}>
                <span className={styles.bar} />
                <span className={styles.closing} />
                <span className={styles.arrival} />
              </span>
              <span className={cx(styles.clock, 'tnum')}>{f.clock(ehditko.closes)}</span>
            </div>
            <p className={styles.slack}>{t.card.slack(f.minutes(ehditko.slackMin))}</p>
          </div>
        </div>
      )}

      {pharmacy.dispensing === false && <p className={styles.context}>{t.status.noPrescriptions}</p>}

      {/* With the first one to open named below, when the others open would only repeat it. */}
      {closerClosed > 0 && (firstToOpen || closedOpens) && (
        <p className={styles.context}>
          {t.results.closerClosed(closerClosed)}
          {!firstToOpen && closedOpens && ` ${t.results.mostOpenTomorrow(f.hourRange(closedOpens.from, closedOpens.to))}`}
        </p>
      )}

      {closerUnknown > 0 && <p className={styles.context}>{t.results.closerUnknown(closerUnknown)}</p>}

      {tooLate ? (
        <>
          <div className={styles.late}>
            <p className={styles.lateTitle}>{t.card.tooLate}</p>
            <p className={styles.lateDetail}>
              {rich(t.card.tooLateDetail, {
                closes: <time dateTime={ehditko.closes}>{f.clockShort(ehditko.closes)}</time>,
                arrive: <time dateTime={ehditko.arrive}>{f.clock(ehditko.arrive)}</time>,
              })}
            </p>
            {/* A call can ask them to wait. */}
            {pharmacy.phone && (
              <div className={styles.actions}>
                <Button icon="phone" href={`tel:${pharmacy.phone.replace(/\s/g, '')}`} aria-label={t.card.callLabel(label)}>
                  {t.card.call}
                </Button>
              </div>
            )}
          </div>
          {nextOpen && nextWay && (
            <div className={styles.promoted}>
              <p className={styles.promotedLabel}>{t.card.nextOpen}</p>
              <div className={styles.head}>
                <span className={styles.glyph}>
                  <CrossGlyph state={glyphFor(nextOpen.status)} size={24} />
                </span>
                <div className={styles.who}>
                  <h3 className={styles.name}>{displayName(i18n, nextOpen)}</h3>
                  <OpenStatus status={nextOpen.status} />
                </div>
                <div className={styles.travel}>
                  <p className={cx(styles.timeSmall, 'tnum')}>
                    <Measure {...nextWay.primary} />
                  </p>
                  {nextWay.distance && (
                    <p className={cx(styles.distance, 'tnum')}>
                      <Measure {...nextWay.distance} />
                    </p>
                  )}
                </div>
              </div>
              <div className={styles.actions}>
                {/* The next one may be the far one from the wider search: too far to promise a walk. */}
                <Button
                  variant="primary"
                  icon={withinWalk(nextOpen) ? 'walk' : 'directions'}
                  aria-label={(withinWalk(nextOpen) ? t.card.routeLabel : t.card.directionsLabel)(fullName(i18n, nextOpen, !!nextOpenWithStreet))}
                  onClick={() => onRoute?.(nextOpen)}
                >
                  {t.card.route}
                </Button>
                {nextOpen.phone && (
                  <Button
                    icon="phone"
                    href={`tel:${nextOpen.phone.replace(/\s/g, '')}`}
                    aria-label={t.card.callLabel(displayName(i18n, nextOpen))}
                  >
                    {t.card.call}
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className={styles.actions}>
            <Button
              variant="primary"
              icon={walk ? 'walk' : 'directions'}
              aria-label={(walk ? t.card.routeLabel : t.card.directionsLabel)(label)}
              onClick={() => onRoute?.(pharmacy)}
            >
              {t.card.route}
            </Button>
            {pharmacy.phone && (
              <Button icon="phone" href={`tel:${pharmacy.phone.replace(/\s/g, '')}`} aria-label={t.card.callLabel(label)}>
                {t.card.call}
              </Button>
            )}
            {country && (
              <Button icon="card" aria-label={t.card.showAtCounterLabel(country.inLanguage[i18n.locale])} onClick={onShowCard}>
                {t.card.showAtCounter}
              </Button>
            )}
          </div>
          {nextOpen && nextDetails && (
            <div className={styles.next}>
              <span className={styles.nextGlyph}>
                <CrossGlyph state={glyphFor(nextOpen.status)} size={18} />
              </span>
              <p>
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
                  details: nextDetails,
                })}
              </p>
            </div>
          )}
          {firstToOpen && <FirstToOpen pharmacy={firstToOpen} distance={distance} onSelect={onSelect} />}
        </>
      )}
      {children}
    </section>
  );
}

interface HeadProps {
  pharmacy: Pharmacy;
  address?: string;
  distance: Scene['distance'];
  onSelect?: (pharmacy: Pharmacy) => void;
  /** The status line, where the card has one right under the head: it belongs to the same press. */
  children?: ReactNode;
}

/**
 * The head of a card: the cross, the name, the address and how far. The name is the one
 * control, with its hit area stretched over the head and the status line under it, as in the
 * list's rows: a press opens the pharmacy's details (hours, contacts, routes, the medicine
 * search, the report row), which the card itself has no room for.
 */
function CardHead({ pharmacy, address, distance, onSelect, children }: HeadProps) {
  const i18n = useI18n();
  const name = displayName(i18n, pharmacy);
  const way = travel(i18n, pharmacy, distance);
  return (
    <div className={styles.opener}>
      <div className={styles.head}>
        <span className={styles.glyph}>
          <CrossGlyph state={glyphFor(pharmacy.status)} size={24} />
        </span>
        <div className={styles.who}>
          <h3 className={styles.name}>
            {onSelect ? (
              <button type="button" className={styles.nameButton} onClick={() => onSelect(pharmacy)}>
                {name}
              </button>
            ) : (
              name
            )}
          </h3>
          {address && <p className={styles.address}>{address}</p>}
        </div>
        <div className={styles.travel}>
          <p className={cx(styles.time, 'tnum')}>
            <Measure {...way.primary} />
          </p>
          <p className={cx(styles.distance, 'tnum')}>
            <Measure short={way.secondary.short} long={way.secondary.long || way.secondary.short} />
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

/**
 * "Avautuu ensimmäisenä" under a far open pharmacy: go there now, or wait for this one nearby.
 * The name is the one control, with its hit area stretched over the block, as in the list rows.
 */
function FirstToOpen({ pharmacy, distance, onSelect }: { pharmacy: Pharmacy; distance: Scene['distance']; onSelect?: (pharmacy: Pharmacy) => void }) {
  const i18n = useI18n();
  const id = useId();
  const way = travel(i18n, pharmacy, distance);
  return (
    <section className={styles.first} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className={styles.label}>
        {i18n.t.results.opensFirst}
      </h2>
      <div className={styles.firstRow}>
        <span className={styles.firstGlyph}>
          <CrossGlyph state={glyphFor(pharmacy.status)} />
        </span>
        <div className={styles.who}>
          <h3 className={styles.firstName}>
            <button type="button" className={styles.firstButton} onClick={() => onSelect?.(pharmacy)}>
              {displayName(i18n, pharmacy)}
              {pharmacy.street && <span className={styles.firstStreet}> {pharmacy.street}</span>}
            </button>
          </h3>
          <OpenStatus status={pharmacy.status} />
        </div>
        <div className={styles.travel}>
          <p className={cx(styles.timeSmall, 'tnum')}>
            <Measure {...way.primary} />
          </p>
          {way.distance && (
            <p className={cx(styles.distance, 'tnum')}>
              <Measure {...way.distance} />
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

interface HoursUnknownProps {
  /** The nearest pharmacy whose hours we can't read. */
  pharmacy: Pharmacy;
  city?: string;
  distance: Scene['distance'];
  /** How many of the pharmacies shown have hours we can't read, this one included. */
  count: number;
  /** The nearest pharmacy whose hours say it is open now, when there is one. */
  knownOpen?: Pharmacy;
  knownOpenWithStreet?: boolean;
  /** The country's share of pharmacies with opening hours in OpenStreetMap. */
  hoursListed?: Scene['hoursListed'];
  country?: CountryInfo;
  onRoute?: (pharmacy: Pharmacy) => void;
  onSelect?: (pharmacy: Pharmacy) => void;
  onShowCard?: () => void;
  children?: ReactNode;
}

/**
 * Hours coverage (provisional, DESIGN-LOG.md 23 Nov 2026). Where most nearby pharmacies have
 * no hours we can read, the card doesn't send anyone past them to a far one that has: the
 * nearest leads, with what we don't know said plainly and the call button first. The nearest
 * one known to be open stays as a line under it. Nothing here guesses at hours.
 */
export function HoursUnknownCard({ pharmacy, city, distance, count, knownOpen, knownOpenWithStreet, hoursListed, country, onRoute, onSelect, onShowCard, children }: HoursUnknownProps) {
  const i18n = useI18n();
  const { t, f, locale } = i18n;
  const id = useId();
  const label = fullName(i18n, pharmacy, pharmacy.name === null);
  const address = [pharmacy.street, city].filter(Boolean).join(', ');
  const walk = withinWalk(pharmacy);
  const knownWay = knownOpen && travel(i18n, knownOpen, distance);
  const knownDetails = knownOpen && knownWay && [knownOpenWithStreet && knownOpen.street, knownWay.primary.short, lowerFirst(statusText(i18n, knownOpen.status))].filter(Boolean).join(', ');

  return (
    <section className={styles.card} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className={styles.label}>
        {t.results.nearestUnlisted}
      </h2>

      <CardHead pharmacy={pharmacy} address={address} distance={distance} onSelect={onSelect}>
        <OpenStatus status={pharmacy.status} strong className={styles.status} />
      </CardHead>

      {pharmacy.dispensing === false && <p className={styles.context}>{t.status.noPrescriptions}</p>}

      <p className={styles.context}>
        {t.results.unlistedNearby(count)} {pharmacy.phone ? t.results.unlistedCall : t.results.unlistedNoPhone}
      </p>

      {/* The call comes first: it is the one way to know before the walk. */}
      <div className={styles.actions}>
        {pharmacy.phone && (
          <Button variant="primary" icon="phone" href={`tel:${pharmacy.phone.replace(/\s/g, '')}`} aria-label={t.card.callLabel(label)}>
            {t.card.call}
          </Button>
        )}
        <Button
          variant={pharmacy.phone ? 'secondary' : 'primary'}
          icon={walk ? 'walk' : 'directions'}
          aria-label={(walk ? t.card.routeLabel : t.card.directionsLabel)(label)}
          onClick={() => onRoute?.(pharmacy)}
        >
          {t.card.route}
        </Button>
        {country && (
          <Button icon="card" aria-label={t.card.showAtCounterLabel(country.inLanguage[locale])} onClick={onShowCard}>
            {t.card.showAtCounter}
          </Button>
        )}
      </div>

      {knownOpen && knownDetails && (
        <div className={styles.next}>
          <span className={styles.nextGlyph}>
            <CrossGlyph state={glyphFor(knownOpen.status)} size={18} />
          </span>
          <p>
            {rich(t.results.knownOpen, {
              name: (
                <a
                  href={`#${knownOpen.id}`}
                  className={styles.nextName}
                  onClick={(event) => {
                    event.preventDefault();
                    onSelect?.(knownOpen);
                  }}
                >
                  {displayName(i18n, knownOpen)}
                </a>
              ),
              details: knownDetails,
            })}
          </p>
        </div>
      )}

      {/* M6: where night duty rotates, the country's official duty-pharmacy lookup goes here (PLAN.md section 5). */}

      {hoursListed && (
        <p className={styles.coverage}>
          {t.results.hoursListed(f.countryName(hoursListed.country), f.percent(hoursListed.share, 0))} <a href={`/${locale}/data`}>{t.footer.aboutData}</a>
        </p>
      )}

      {/* With no pharmacy known to be open, the one number that always works stays in view. */}
      {!knownOpen && <p className={styles.emergency}>{rich(t.footer.emergency, { number: <a href="tel:112">112</a> })}</p>}
      {children}
    </section>
  );
}

interface NothingOpenProps {
  /** The pharmacy that opens first. */
  pharmacy: Pharmacy;
  distance: Scene['distance'];
  onSelect?: (pharmacy: Pharmacy) => void;
  children?: ReactNode;
}

/**
 * When nothing is open and the 24-hour search within 30 km found nothing either: the pharmacy
 * that opens first, and the emergency number kept prominent. No route button: it would lead
 * to a closed door.
 */
export function NothingOpenCard({ pharmacy, distance, onSelect, children }: NothingOpenProps) {
  const i18n = useI18n();
  const { t } = i18n;
  const id = useId();
  return (
    <section className={styles.card} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className={styles.label}>
        {t.results.opensFirst}
      </h2>
      <CardHead pharmacy={pharmacy} address={pharmacy.street} distance={distance} onSelect={onSelect}>
        <OpenStatus status={pharmacy.status} strong className={styles.status} />
      </CardHead>
      <div className={styles.actions}>
        <Button aria-label={t.card.details(fullName(i18n, pharmacy, true))} onClick={() => onSelect?.(pharmacy)}>
          {t.card.showDetails}
        </Button>
      </div>
      <p className={styles.emergency}>{rich(t.footer.emergency, { number: <a href="tel:112">112</a> })}</p>
      {children}
    </section>
  );
}
