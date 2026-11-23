'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { rich } from '@/lib/i18n/rich';
import { arrange, cityIfElsewhere, placeLabel } from '@/lib/results';
import { displayName, fullName, glyphFor, isOpenNow, opensWhen, statusText } from '@/lib/status';
import { travel, withinWalk } from '@/lib/travel';
import type { AreaLayer, Bounds } from '@/lib/map/area';
import type { Pharmacy, Scene } from '@/lib/types';
import { ApproximateNotice } from './ApproximateNotice';
import { Button } from './Button';
import { CounterCard } from './CounterCard';
import { CountryBanner } from './CountryBanner';
import { CrossGlyph } from './CrossGlyph';
import { cx } from './cx';
import { LiveStatus } from './LiveStatus';
import { Measure } from './Measure';
import { HoursUnknownCard, NearestOpenCard, NothingOpenCard } from './NearestOpenCard';
import { OpenStatus } from './OpenStatus';
import { ClosedGroup, PharmacyList } from './PharmacyList';
import { PharmacySheet } from './PharmacySheet';
import { ResultsNotice } from './ResultsNotice';
import { ResultsShell, type SheetState } from './ResultsShell';
import { MapView } from './MapView';
import styles from './ResultsView.module.css';

export interface ResultsOptions {
  /** Phone: start with the sheet collapsed (the default) or expanded. */
  sheet?: 'peek' | 'expanded';
  /** Start with a pharmacy's details open. */
  detailId?: string;
  /** Start with the counter card open. */
  counter?: 'ePrescription' | 'paper';
  closedOpen?: boolean;
  onRefresh?: () => void;
  /** Opens the place search: from the place name, and from the approximate-location notice. */
  onSearch?: () => void;
  /** Draw the map's streets on real tiles. Off in /dev/states, which calls no service. */
  basemap?: boolean;
  /** The current instant, epoch seconds: the map's light follows the sun at it. */
  now?: number;
  /** The device's latest position while it is followed: the map's dot. */
  you?: { lat: number; lon: number; accuracy?: number };
  /** In the real flow focus moves to the title when the results arrive. */
  focusTitle?: boolean;
  /** The crosses of the open pharmacies switch on one after another (PLAN.md section 6, "Motion"). */
  reveal?: boolean;
  /** false shows the results as they were before the hours-coverage proposal, for the comparison in /dev/states. */
  coverage?: boolean;
  /** Every other pharmacy on the tiles the device holds, for the map's own layer (lib/map/area.ts). */
  area?: AreaLayer;
  /** One of them, worded like a result: a pharmacy picked on the map opens the same sheet as one from the list. */
  findInArea?: (id: string) => Pharmacy | undefined;
  /** The map was moved by hand to here. */
  onArea?: (bounds: Bounds) => void;
}

const DESKTOP = '(min-width: 900px)';
const NO_ACTION = () => undefined;

/** Results: map first, with the "Lähin auki nyt" card and the list. */
export function ResultsView({ scene, ...options }: { scene: Scene } & ResultsOptions) {
  const i18n = useI18n();
  const { t, f } = i18n;
  const id = useId();
  const arranged = useMemo(() => arrange(scene, { coverage: options.coverage }), [scene, options.coverage]);
  const { nearestOpen, far, firstToOpen, others, closedGroup, closerClosed, nextOpen, needsStreet, unlisted, closerUnknown } = arranged;
  const place = placeLabel(scene, i18n.locale);

  const [sheet, setSheet] = useState<SheetState>(options.sheet ?? 'peek');
  const [detailId, setDetailId] = useState(options.detailId);
  const [counterOpen, setCounterOpen] = useState(options.counter !== undefined);
  const detailRef = useRef<HTMLDialogElement>(null);

  const everyone = useMemo(() => [...scene.pharmacies, ...(scene.farOpen ? [scene.farOpen] : [])], [scene]);
  const listed = everyone.find((p) => p.id === detailId);
  const detail = listed ?? (detailId ? options.findInArea?.(detailId) : undefined);
  const selectedId = detailId ?? (unlisted?.lead ?? nearestOpen ?? firstToOpen)?.id;
  const select = (pharmacy: Pharmacy) => setDetailId(pharmacy.id);
  const fullNameOf = (pharmacy: Pharmacy) => fullName(i18n, pharmacy, pharmacy.name === null);
  // One surface: abroad, the prescription banner is a section of the card.
  const banner = scene.country && <CountryBanner country={scene.country} />;

  // Phone: a modal bottom sheet. Desktop: the details take the list's place in the panel.
  useEffect(() => {
    const dialog = detailRef.current;
    if (!dialog) return;
    if (detailId && !dialog.open) {
      if (window.matchMedia(DESKTOP).matches) dialog.show();
      else dialog.showModal();
    }
    // Start reading from the pharmacy's name, also when moving from one pharmacy to the next.
    if (detailId) dialog.querySelector<HTMLElement>('[data-dialog-focus]')?.focus();
    if (!detailId && dialog.open) dialog.close();
  }, [detailId]);

  useEffect(() => {
    const query = window.matchMedia(DESKTOP);
    const close = () => setDetailId(undefined);
    query.addEventListener('change', close);
    return () => query.removeEventListener('change', close);
  }, []);

  // The far open one counts: it is the answer, although it is not in the list.
  const openCount = scene.pharmacies.filter((p) => isOpenNow(p.status)).length + (far ? 1 : 0);
  const hour = Number(scene.updated.split(':')[0]);
  const night = hour >= 22 || hour < 6;
  const way = nearestOpen && travel(i18n, nearestOpen, scene.distance);
  const ehditko = scene.ehditko;
  const stale = scene.stale === true;
  const message = stale
    ? t.results.foundStale(arranged.total)
    : unlisted
      ? t.results.foundUnlisted(arranged.total, unlisted.count)
      : nearestOpen && way
        ? t.results.found(arranged.total, displayName(i18n, nearestOpen), way.distance?.long ?? way.primary.long, statusText(i18n, nearestOpen.status))
        : t.results.foundNoneOpen(arranged.total);
  const missing = (scene.missing ?? []).map((code) => f.countryName(code));
  const firstWay = firstToOpen && travel(i18n, firstToOpen, scene.distance);
  const allButton = (
    <Button trailing="chevron" onClick={() => setSheet('expanded')}>
      {t.results.allPharmacies(arranged.total)}
    </Button>
  );

  const peek = nearestOpen && way && (
    <section aria-labelledby={`${id}-peek`} className={styles.peek}>
      <h2 id={`${id}-peek`} className={styles.label}>
        {t.results.nearestOpen}
      </h2>
      <div className={styles.peekRow}>
        <CrossGlyph state={glyphFor(nearestOpen.status)} size={24} />
        <div className={styles.peekWho}>
          <h3 className={styles.peekName}>{displayName(i18n, nearestOpen)}</h3>
          {ehditko.kind === 'timeline' && (
            <p className={cx(styles.peekSub, 'tnum')}>
              {rich(t.card.arriveCloses, {
                arrive: <time dateTime={ehditko.arrive}>{f.clock(ehditko.arrive)}</time>,
                closes: <time dateTime={ehditko.closes}>{f.clock(ehditko.closes)}</time>,
              })}
            </p>
          )}
          {ehditko.kind === 'tooLate' && <p className={cx(styles.peekSub, styles.late)}>{t.card.tooLate}</p>}
          {ehditko.kind === 'none' && <OpenStatus status={nearestOpen.status} />}
        </div>
        <p className={cx(styles.peekTime, 'tnum')}>
          <Measure {...way.primary} />
        </p>
      </div>
      {/* Nothing nearby is open: the other way forward is to wait for the one that opens first. */}
      {firstToOpen && firstWay && firstToOpen.status.kind === 'closed' && firstToOpen.status.opens && (
        <div className={styles.peekFirst}>
          <CrossGlyph state="closed" />
          <p>{t.results.opensFirstWhen(opensWhen(i18n, firstToOpen.status.opens))}</p>
          <p className={cx(styles.peekFirstTime, 'tnum')}>
            <Measure {...firstWay.primary} />
          </p>
        </div>
      )}
      <div className={styles.peekActions}>
        <Button
          variant="primary"
          icon={withinWalk(nearestOpen) ? 'walk' : 'directions'}
          aria-label={(withinWalk(nearestOpen) ? t.card.routeLabel : t.card.directionsLabel)(displayName(i18n, nearestOpen))}
          onClick={() => select(nearestOpen)}
        >
          {t.card.route}
        </Button>
        {allButton}
      </div>
    </section>
  );

  // Nothing open at all: the peek names the one that opens first and keeps the emergency number in view.
  const nothingOpenPeek = !nearestOpen && firstToOpen && firstWay && (
    <section aria-labelledby={`${id}-peek`} className={styles.peek}>
      <h2 id={`${id}-peek`} className={styles.label}>
        {t.results.opensFirst}
      </h2>
      <div className={styles.peekRow}>
        <CrossGlyph state={glyphFor(firstToOpen.status)} size={24} />
        <div className={styles.peekWho}>
          <h3 className={styles.peekName}>{displayName(i18n, firstToOpen)}</h3>
          <OpenStatus status={firstToOpen.status} />
        </div>
        <p className={cx(styles.peekTime, 'tnum')}>
          <Measure {...firstWay.primary} />
        </p>
      </div>
      <div className={styles.peekActions}>{allButton}</div>
      <p className={styles.peekEmergency}>{rich(t.footer.emergency, { number: <a href="tel:112">112</a> })}</p>
    </section>
  );

  // Hours coverage (provisional): the nearest pharmacy leads although we can't say that it is open.
  const lead = unlisted?.lead;
  const leadWay = lead && travel(i18n, lead, scene.distance);
  const unlistedPeek = lead && leadWay && (
    <section aria-labelledby={`${id}-peek`} className={styles.peek}>
      <h2 id={`${id}-peek`} className={styles.label}>
        {t.results.nearestUnlisted}
      </h2>
      <div className={styles.peekRow}>
        <CrossGlyph state={glyphFor(lead.status)} size={24} />
        <div className={styles.peekWho}>
          <h3 className={styles.peekName}>{displayName(i18n, lead)}</h3>
          <OpenStatus status={lead.status} />
        </div>
        <p className={cx(styles.peekTime, 'tnum')}>
          <Measure {...leadWay.primary} />
        </p>
      </div>
      {nearestOpen && way && (
        <div className={styles.peekFirst}>
          <CrossGlyph state={glyphFor(nearestOpen.status)} />
          <p>{t.results.knownOpenShort(displayName(i18n, nearestOpen))}</p>
          <p className={cx(styles.peekFirstTime, 'tnum')}>
            <Measure {...way.primary} />
          </p>
        </div>
      )}
      <div className={styles.peekActions}>
        {lead.phone ? (
          <Button variant="primary" icon="phone" href={`tel:${lead.phone.replace(/\s/g, '')}`} aria-label={t.card.callLabel(fullNameOf(lead))}>
            {t.card.call}
          </Button>
        ) : (
          <Button
            variant="primary"
            icon={withinWalk(lead) ? 'walk' : 'directions'}
            aria-label={(withinWalk(lead) ? t.card.routeLabel : t.card.directionsLabel)(fullNameOf(lead))}
            onClick={() => select(lead)}
          >
            {t.card.route}
          </Button>
        )}
        {allButton}
      </div>
      {!nearestOpen && <p className={styles.peekEmergency}>{rich(t.footer.emergency, { number: <a href="tel:112">112</a> })}</p>}
    </section>
  );

  const nextFor = (pharmacy: Pharmacy) => everyone.find((p) => p.id !== pharmacy.id && isOpenNow(p.status));
  const detailNext = detail && nextFor(detail);

  return (
    <ResultsShell
      place={place}
      updated={scene.updated}
      // Out-of-date data says nothing about what is open: neither does the heading.
      // Nor do unknown hours: where they lead, the heading counts nothing as open or closed.
      title={stale ? t.results.title : unlisted ? t.results.unlistedTitle : t.results.openNow(openCount, night)}
      barLine={
        stale
          ? t.results.staleShort
          : unlisted
            ? t.results.unlistedShort
            : rich(t.results.openAt(openCount), {
                time: <time dateTime={scene.updated}>{f.clock(scene.updated)}</time>,
              })
      }
      sheet={stale ? 'static' : sheet}
      onSheetChange={setSheet}
      peek={stale ? undefined : unlistedPeek || peek || nothingOpenPeek || undefined}
      emergencyInFooter={!!nearestOpen}
      onRefresh={options.onRefresh}
      onPlace={options.onSearch ?? NO_ACTION}
      dataFrom={scene.dataFrom}
      focusTitle={options.focusTitle}
      distance={scene.distance}
      mapLabel={t.map.label}
      map={
        <MapView
          scene={scene}
          needsStreet={needsStreet}
          selectedId={selectedId}
          nearestOpenId={nearestOpen?.id}
          onSelect={select}
          basemap={options.basemap}
          now={options.now}
          you={options.you}
          reveal={options.reveal}
          area={options.area}
          extra={listed ? undefined : detail}
          onPick={setDetailId}
          onView={options.onArea}
        />
      }
      detailOpen={!!detail}
      detail={
        <dialog
          ref={detailRef}
          className={styles.detail}
          aria-labelledby={`${id}-detail`}
          onClose={() => setDetailId(undefined)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setDetailId(undefined);
          }}
        >
          {detail && (
            <PharmacySheet
              pharmacy={detail}
              city={cityIfElsewhere(detail, place, i18n.locale)}
              distance={scene.distance}
              headingId={`${id}-detail`}
              nextOpen={detailNext}
              nextOpenWithStreet={detailNext && needsStreet.has(detailNext.id)}
              country={scene.country}
              onShowCard={() => setCounterOpen(true)}
              onClose={() => setDetailId(undefined)}
              onSelect={select}
            />
          )}
        </dialog>
      }
      overlays={
        scene.card && (
          <CounterCard
            card={scene.card}
            open={counterOpen}
            onClose={() => setCounterOpen(false)}
            initialVariant={options.counter}
          />
        )
      }
    >
      <LiveStatus message={message} />

      <div className={styles.content} data-reveal={options.reveal || undefined}>
        {scene.user.approximate && <ApproximateNotice onSearch={options.onSearch} />}

        {stale && scene.dataFrom !== undefined && <ResultsNotice title={t.results.staleTitle}>{t.results.staleBody(f.dayOf(scene.dataFrom))}</ResultsNotice>}

        {missing.length > 0 && <ResultsNotice>{missing.length === 1 ? t.results.missingOne(missing[0]) : t.results.missingMany(f.list(missing))}</ResultsNotice>}

        {lead && (
          <HoursUnknownCard
            pharmacy={lead}
            city={cityIfElsewhere(lead, place, i18n.locale)}
            distance={scene.distance}
            count={unlisted.count}
            knownOpen={nearestOpen}
            knownOpenWithStreet={nearestOpen && needsStreet.has(nearestOpen.id)}
            hoursListed={scene.hoursListed}
            country={scene.country}
            onRoute={select}
            onSelect={select}
            onShowCard={() => setCounterOpen(true)}
          >
            {banner}
          </HoursUnknownCard>
        )}

        {!lead && nearestOpen && (
          <NearestOpenCard
            pharmacy={nearestOpen}
            city={cityIfElsewhere(nearestOpen, place, i18n.locale)}
            distance={scene.distance}
            ehditko={ehditko}
            nextOpen={nextOpen}
            nextOpenWithStreet={nextOpen && needsStreet.has(nextOpen.id)}
            firstToOpen={firstToOpen}
            closerClosed={closedGroup.length > 0 ? closerClosed : 0}
            closedOpens={scene.closedOpens}
            closerUnknown={closerUnknown}
            country={scene.country}
            onRoute={select}
            onSelect={select}
            onShowCard={() => setCounterOpen(true)}
          >
            {banner}
          </NearestOpenCard>
        )}

        {!lead && !nearestOpen && firstToOpen && (
          <NothingOpenCard pharmacy={firstToOpen} distance={scene.distance} onSelect={select}>
            {banner}
          </NothingOpenCard>
        )}

        {others.length > 0 && (
          <PharmacyList
            pharmacies={others}
            distance={scene.distance}
            needsStreet={needsStreet}
            selectedId={detailId}
            onSelect={select}
            alone={!lead && !nearestOpen && !firstToOpen}
          />
        )}

        {closedGroup.length > 0 && (
          <ClosedGroup
            pharmacies={closedGroup}
            distance={scene.distance}
            needsStreet={needsStreet}
            selectedId={detailId}
            onSelect={select}
            initiallyOpen={options.closedOpen}
            firstShownAbove={!!firstToOpen}
          />
        )}
      </div>
    </ResultsShell>
  );
}
