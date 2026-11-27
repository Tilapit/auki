'use client';

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useReport, useReportFilter, type FilterTopic } from '@/hooks/useReport';
import type { RouteFor } from '@/hooks/useRouteLine';
import { COUNTRY_CODES } from '@/lib/countries';
import { useGuidance } from '@/lib/guidance';
import { useHome } from '@/lib/home';
import { useI18n } from '@/lib/i18n/context';
import { rich } from '@/lib/i18n/rich';
import type { Answers, Reports } from '@/lib/reports';
import { arrange, cityIfElsewhere, placeLabel } from '@/lib/results';
import { displayName, fullName, glyphFor, isOpenNow, opensWhen, statusText } from '@/lib/status';
import { providerFor, providerForReview } from '@/lib/stock/providers';
import { travel, withinWalk } from '@/lib/travel';
import type { AreaLayer, Bounds } from '@/lib/map/area';
import type { CardVariant, Pharmacy, Scene } from '@/lib/types';
import { ApproximateNotice } from './ApproximateNotice';
import { Button } from './Button';
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
import { MedicineDialog, MedicineRow } from './MedicineDialog';
import { ReportDialog } from './ReportDialog';
import { ReportFilters } from './ReportFilters';
import styles from './ResultsView.module.css';

export interface ResultsOptions {
  /**
   * Phone: where the sheet starts. By default at its lowest, the one row; at the card when
   * nothing is open, so that the emergency number is in view from the start.
   */
  sheet?: 'peek' | 'half' | 'expanded';
  /** 'classic' shows the sheet as it was before the compact one, for the comparison in /dev/states. */
  sheetStyle?: 'classic';
  /** Start with a pharmacy's details open. */
  detailId?: string;
  /** Start with the counter card open. */
  counter?: CardVariant;
  /** /dev/states only, which asks the browser for nothing: the card as it is with the screen kept awake, or without. */
  counterAwake?: boolean;
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
  /** Where the walking route to a pharmacy comes from. Without it no route is drawn: /dev/states calls no service. */
  routeFor?: RouteFor;
  /** Told which pharmacy's details are open, and when none is: the tab keeps it (lib/session.ts). */
  onDetail?: (id: string | undefined) => void;
  /**
   * Medicine availability (provisional, DESIGN-LOG.md 25 Nov 2026). false leaves it out, for the
   * comparison in /dev/states. A country code starts with that country's dialog open.
   */
  medicine?: false | string;
  /** /dev/states only: a name in the dialog's field, and what stands under its link. */
  medicineValue?: string;
  medicineExample?: ReactNode;
  /** /dev/states only: the dialog may also be that of a provider that waits for its operator's agreement. */
  medicineReview?: boolean;
  /**
   * Visitors' reports (provisional, DESIGN-LOG.md 26 Nov 2026). Where they come from and go to,
   * and the device's memory of what it has offered. Without it nothing is offered, shown or
   * asked for: /dev/states calls no service.
   */
  reports?: Reports;
  /** /dev/states only: the report dialog open from the start, with these chips pressed, or after a sending that failed. */
  reportOpen?: boolean;
  reportAnswers?: Answers;
  reportFailed?: boolean;
  /** /dev/states only: the line that stands in the row's place after a report was sent. */
  reportNote?: 'thanks' | 'limit';
  /** /dev/states only: the reports are invented, and the summary says so on its face. */
  reportExample?: boolean;
  /** /dev/states only: the list's filters that are on from the start. In the live app both are off until pressed. */
  reportFilter?: FilterTopic[];
  /**
   * /dev/states only: the country the prescription is from. null: the device suggests none, and
   * the banner asks. Left out, the scene's own; the live app takes it from the device (lib/home.ts).
   */
  home?: string | null;
  /** /dev/states only: the banner's details open from the start. */
  bannerOpen?: boolean;
  /** /dev/states only: a pharmacy's details as another component draws them, for a before and after of the sheet. */
  detailAs?: typeof PharmacySheet;
  /** /dev/map only: another limit for the map's device pixels per CSS pixel. */
  mapPixels?: number;
  /** /dev/map only: the map under a finger as MapLibre has it, to compare with ours on a phone. */
  mapPlainTouch?: boolean;
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
  const classic = options.sheetStyle === 'classic';

  // Nothing open at all: the card, with 112 prominent, is what the user meets first (PLAN.md 7.6).
  const nothingOpen = !unlisted && !nearestOpen && !!firstToOpen;
  const [sheet, setSheet] = useState<SheetState>(options.sheet ?? (options.detailId || (nothingOpen && !classic) ? 'half' : 'peek'));
  const [detailId, setDetailId] = useState(options.detailId);
  const { onDetail } = options;
  useEffect(() => onDetail?.(detailId), [onDetail, detailId]);
  /** Where the phone's sheet was before a pharmacy's details took it over: closed, it goes back there. */
  const sheetBefore = useRef<SheetState>(options.sheet ?? (nothingOpen && !classic ? 'half' : 'peek'));
  /** How much of the details the phone's sheet shows at its middle height: down to the row of main actions, or to the facts under it when they fit too. */
  const [detailFold, setDetailFold] = useState<number>();
  /** What opened the details: the row's button, a marker, a row of the list. Focus goes back there. */
  const opener = useRef<Element | null>(null);
  /** The control pressed last. Safari gives a button no focus when it is pressed, so focus alone can't say what opened the details. */
  const pressed = useRef<Element | null>(null);
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      pressed.current = event.target instanceof Element ? event.target.closest('button, a[href]') : null;
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
  const [counterOpen, setCounterOpen] = useState(options.counter !== undefined);
  // Closed, the counter card gives the keyboard back to the button that opened it. The browser does
  // that by itself only when the button had the focus, and Safari gives a pressed button none.
  const counterOpener = useRef<Element | null>(null);
  const showCard = () => {
    counterOpener.current = pressed.current ?? document.activeElement;
    setCounterOpen(true);
  };
  useEffect(() => {
    if (counterOpen) return;
    const from = counterOpener.current;
    counterOpener.current = null;
    if (from instanceof HTMLElement && from.isConnected) from.focus();
  }, [counterOpen]);
  // Which country's stock search the medicine dialog is open for: that of the pharmacy it was opened from.
  const [medicineFor, setMedicineFor] = useState(typeof options.medicine === 'string' ? options.medicine : undefined);
  const detailRef = useRef<HTMLDialogElement>(null);
  // Which pharmacy the report dialog was opened for. It is open only while that pharmacy's details are:
  // it can never come up by itself over another pharmacy's.
  const [reportFor, setReportFor] = useState(options.reportOpen ? options.detailId : undefined);

  const everyone = useMemo(() => [...scene.pharmacies, ...(scene.farOpen ? [scene.farOpen] : [])], [scene]);
  const listed = everyone.find((p) => p.id === detailId);
  const detail = listed ?? (detailId ? options.findInArea?.(detailId) : undefined);
  const selectedId = detailId ?? (unlisted?.lead ?? nearestOpen ?? firstToOpen)?.id;
  // A pharmacy's details open in the phone's sheet at its middle height, whatever it showed
  // before, so that the map and the pharmacy's marker are in view above them.
  const open = (pharmacyId: string) => {
    if (!detailId) {
      sheetBefore.current = sheet;
      opener.current = pressed.current ?? document.activeElement;
    }
    setDetailId(pharmacyId);
    setSheet('half');
  };
  const select = (pharmacy: Pharmacy) => open(pharmacy.id);
  // Closed from the details themselves, the sheet shows what it showed before them.
  const close = () => {
    if (!detailId) return;
    setDetailId(undefined);
    setSheet(sheetBefore.current);
  };
  // Dragged down to the row, the sheet has let the details go.
  const moveSheet = (next: SheetState) => {
    if (next === 'peek') setDetailId(undefined);
    setSheet(next);
  };
  // The walking route is drawn to the selected pharmacy when it is one of the list's and its walk
  // is known and is a walk. Unasked, only to the card's own pharmacy while it is open and in
  // reach: the line is the card's "Reitti" on the map, and no line leads to a closed door.
  const routeTo = useMemo(() => {
    const target = scene.distance === 'walking' ? scene.pharmacies.find((p) => p.id === selectedId) : undefined;
    if (!target || target.walkMin === undefined || !withinWalk(target)) return undefined;
    return detailId || (isOpenNow(target.status) && !target.tooLate) ? target : undefined;
  }, [scene, selectedId, detailId]);
  const fullNameOf = (pharmacy: Pharmacy) => fullName(i18n, pharmacy, pharmacy.name === null);
  // A prescription from another country than the pharmacy's: what works here, and the card to
  // show at the counter (PLAN.md section 8). The home country is the device's own suggestion
  // until the user changes it in the banner; a fixture names its own.
  const [home, setHome] = useHome(i18n.locale, options.home !== undefined ? options.home : scene.home);
  // The country of the pharmacy, where it is one the app covers (data/countries/here.ts has the same list).
  const here = scene.here !== undefined && (COUNTRY_CODES as readonly string[]).includes(scene.here) ? scene.here : undefined;
  // One surface: the banner is a section of the card. Not at home, where there is nothing to say,
  // unless it is asked for from the footer: the phone's suggestion can be wrong at home too.
  const atHome = !!here && home === here;
  const [asked, setAsked] = useState(false);
  // How many times the banner was asked for from a pharmacy's reports: each time the keyboard goes to it again.
  const [guidanceAsked, setGuidanceAsked] = useState(0);
  const abroad = !!here && (!atHome || asked);
  // The guidance itself (the sentences, the sources, the card's lines) is not part of the first
  // load: it is fetched when the two countries differ, and at home never (lib/guidance.ts).
  // Until it has arrived the card is as it is at home.
  const guidance = useGuidance(abroad);
  const guide = useMemo(() => guidance?.guideFor(home, here), [guidance, home, here]);
  // "Näytä apteekissa" is offered only where the card has something to ask for (data/countries: not where the paper answer is a no).
  const country = guide?.card && { code: guide.here, inLanguage: guide.inLanguage };
  const banner = guidance && abroad && <guidance.CountryBanner home={home} onHome={setHome} guide={guide} open={options.bannerOpen} takeFocus={guidanceAsked || asked} />;
  // Where to check a medicine's stock: the service of the country the card's pharmacy is in
  // (PLAN.md 7.1, step 9). Only where that country has one; elsewhere nothing is offered.
  const offered = options.medicine !== false;
  const cardProvider = offered ? providerFor((unlisted?.lead ?? nearestOpen ?? firstToOpen ?? scene.pharmacies[0])?.country) : undefined;
  const openMedicine = cardProvider && (() => setMedicineFor(cardProvider.country));
  // The service's own address, as the medicine search is named with it: "apteekki.fi".
  const siteOf = (country: string | undefined) => {
    const provider = offered ? providerFor(country) : undefined;
    return provider && t.medicine.services[provider.id as keyof typeof t.medicine.services].site;
  };
  const cardSite = siteOf(cardProvider?.country);

  // The details take the list's place: in the desktop's panel, and in the phone's sheet. Not a
  // modal: the map above them stays usable, as it does around the results.
  useEffect(() => {
    const dialog = detailRef.current;
    if (!dialog) return;
    if (detailId && !dialog.open) dialog.show();
    // Start reading from the pharmacy's name, also when moving from one pharmacy to the next.
    if (detailId) dialog.querySelector<HTMLElement>('[data-dialog-focus]')?.focus({ preventScroll: true });
    if (!detailId && dialog.open) {
      dialog.close();
      // The details were not a modal, so the browser does not hand focus back: it goes to what
      // opened them, which is on screen again by now.
      const from = opener.current;
      opener.current = null;
      if (from instanceof HTMLElement && from.isConnected && from !== document.body) from.focus({ preventScroll: true });
    }
  }, [detailId]);

  // The middle height of the phone's sheet follows the details: their top down to a place they mark (data-fold).
  useEffect(() => {
    const dialog = detailRef.current;
    if (!dialog || !detailId) return;
    const measure = () => {
      const folds = [...dialog.querySelectorAll<HTMLElement>('[data-fold]')];
      if (!folds.length || !dialog.offsetHeight) return;
      const top = dialog.getBoundingClientRect().top;
      const bottoms = folds.map((fold) => Math.round(fold.getBoundingClientRect().bottom - top) + 16);
      // The sheet never takes more than 60 % of the screen (ResultsShell's stylesheet), and its
      // handle is 26 px of that. The edge rests under the last section that fits whole: a
      // section cut in half would look like a sheet that failed to open.
      const room = window.innerHeight * 0.6 - 26;
      setDetailFold(bottoms.filter((bottom) => bottom <= room).pop() ?? bottoms[0]);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(dialog);
    return () => observer.disconnect();
  }, [detailId]);

  useEffect(() => {
    const query = window.matchMedia(DESKTOP);
    const onChange = () => {
      setDetailId(undefined);
      setSheet(sheetBefore.current);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
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
        ? t.results.found(arranged.total, displayName(i18n, nearestOpen), way.distance?.long ?? way.primary.spoken, statusText(i18n, nearestOpen.status))
        : t.results.foundNoneOpen(arranged.total);
  const missing = (scene.missing ?? []).map((code) => f.countryName(code));
  const firstWay = firstToOpen && travel(i18n, firstToOpen, scene.distance);
  // The sheet as it was, for the comparison in /dev/states: the answer in three lines, with
  // its buttons under it. The three blocks below are that sheet's collapsed content.
  const allButton = (
    <Button trailing="chevron" onClick={() => setSheet('expanded')}>
      {t.results.allPharmacies(arranged.total)}
    </Button>
  );

  const openPeek = nearestOpen && way && (
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
  const classicPeek = unlistedPeek || openPeek || nothingOpenPeek || undefined;

  // The sheet at its lowest (PLAN.md section 5): the answer in one row, and the one thing to
  // do about it. The second lines of the old collapsed sheet and "Kaikki N apteekkia" are in
  // the card, one pull up.
  // The row's button is its word alone ("Reitti", "Soita"): an icon would cost the line beside
  // it the room that keeps the status of a pharmacy open around the clock on one line. The icons are in the card.
  const routeButton = (pharmacy: Pharmacy, name: string) => (
    <Button variant="primary" className={styles.rowAction} aria-label={(withinWalk(pharmacy) ? t.card.routeLabel : t.card.directionsLabel)(name)} onClick={() => select(pharmacy)}>
      {t.card.route}
    </Button>
  );
  const row = lead ? (
    // Hours unknown: the call is the one way to know before the walk, as in the card.
    <SheetRow
      id={`${id}-peek`}
      label={t.results.nearestUnlisted}
      pharmacy={lead}
      distance={scene.distance}
      reveal={options.reveal}
      action={
        lead.phone ? (
          <Button variant="primary" className={styles.rowAction} href={`tel:${lead.phone.replace(/\s/g, '')}`} aria-label={t.card.callLabel(fullNameOf(lead))}>
            {t.card.call}
          </Button>
        ) : (
          routeButton(lead, fullNameOf(lead))
        )
      }
    />
  ) : nearestOpen ? (
    <SheetRow
      id={`${id}-peek`}
      label={t.results.nearestOpen}
      pharmacy={nearestOpen}
      distance={scene.distance}
      reveal={options.reveal}
      // Too late to make it: the row has to say so. The timeline, arrival against closing, is in
      // the card: "Perillä 20.44, sulkeutuu 21.00" after the distance is wider than the row.
      status={ehditko.kind === 'tooLate' ? <span className={styles.late}>{t.card.tooLate}</span> : undefined}
      action={
        // Too late for it on foot: as in the card, what is left is the call, which can ask them to wait.
        ehditko.kind === 'tooLate' && nearestOpen.phone ? (
          <Button variant="primary" className={styles.rowAction} href={`tel:${nearestOpen.phone.replace(/\s/g, '')}`} aria-label={t.card.callLabel(displayName(i18n, nearestOpen))}>
            {t.card.call}
          </Button>
        ) : (
          routeButton(nearestOpen, displayName(i18n, nearestOpen))
        )
      }
    />
  ) : firstToOpen ? (
    // Nothing open: no route to a closed door. The number that always works is the row's one action.
    <SheetRow
      id={`${id}-peek`}
      label={t.results.opensFirst}
      pharmacy={firstToOpen}
      distance={scene.distance}
      reveal={options.reveal}
      action={
        <Button icon="phone" className={styles.rowAction} href="tel:112" aria-label={t.footer.emergency.replace('{number}', '112')}>
          112
        </Button>
      }
    />
  ) : undefined;

  const hasNotices = !!scene.user.approximate || (stale && scene.dataFrom !== undefined) || missing.length > 0;
  const hasCard = !!lead || !!nearestOpen || !!firstToOpen;
  // Without a card (out-of-date data has a notice in its place) the line stands by itself, under the notices.
  const lineAlone = !!openMedicine && !!cardSite && !hasCard;
  const hasLists = others.length > 0 || closedGroup.length > 0;

  const nextFor = (pharmacy: Pharmacy) => everyone.find((p) => p.id !== pharmacy.id && isOpenNow(p.status) && !p.tooLate);
  const detailNext = detail && nextFor(detail);
  const Details = options.detailAs ?? PharmacySheet;
  // What visitors told of the pharmacy whose details are open, and the offer to tell of one's own visit.
  const report = useReport(options.reports, detail);
  // The row goes when it is used, and the keyboard would be left on a button that is gone: it is
  // put on the pharmacy's name, where the sheet starts. In an effect, which runs after the report's
  // dialog has closed and handed the focus back to that button.
  const [reportUsed, setReportUsed] = useState(0);
  // Closed without being used, the dialog gives the keyboard back to the row that opened it. The
  // browser does that by itself only when the row had the focus, and Safari gives a pressed button none.
  const reportOpen = !!detail && reportFor === detail.id;
  const reportOpener = useRef<Element | null>(null);
  useEffect(() => {
    if (reportOpen) return;
    const opener = reportOpener.current;
    reportOpener.current = null;
    if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
  }, [reportOpen]);
  useEffect(() => {
    if (reportUsed > 0) document.getElementById(`${id}-detail`)?.focus();
  }, [reportUsed, id]);
  const afterReport = () => setReportUsed((count) => count + 1);
  // From a pharmacy's reports to what the two countries' own pages say: the details close, the
  // sheet opens on the card, and the banner there takes the keyboard (not what opened the details).
  const toGuidance = () => {
    opener.current = null;
    setAsked(true);
    setGuidanceAsked((count) => count + 1);
    setDetailId(undefined);
    setSheet('expanded');
  };
  // The list's two filters, off until pressed. They take rows away; the order and the card are never touched.
  const filter = useReportFilter(options.reports, scene.pharmacies, options.reportFilter);
  const shownOthers = others.filter(filter.passes);
  const shownClosed = closedGroup.filter(filter.passes);

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
      // Out-of-date data has a notice where the card would be, in a sheet that doesn't move. A pharmacy's details move like any.
      sheet={stale && !detail ? 'static' : sheet}
      onSheetChange={moveSheet}
      sheetStyle={options.sheetStyle}
      peek={stale ? undefined : classic ? classicPeek : row}
      status={<LiveStatus message={message} />}
      // The card is the sheet's middle place. Under it, the way to the list, when there is more to see.
      listLabel={!stale && hasCard && hasLists ? t.results.allPharmacies(arranged.total) : undefined}
      lead={
        hasNotices || hasCard || lineAlone ? (
          <div className={styles.content} data-reveal={options.reveal || undefined}>
            {scene.user.approximate && <ApproximateNotice onSearch={options.onSearch} />}

            {stale && scene.dataFrom !== undefined && <ResultsNotice title={t.results.staleTitle}>{t.results.staleBody(f.dayOf(scene.dataFrom))}</ResultsNotice>}

            {missing.length > 0 && <ResultsNotice>{missing.length === 1 ? t.results.missingOne(missing[0]) : t.results.missingMany(f.list(missing))}</ResultsNotice>}

            {lead && unlisted && (
              <HoursUnknownCard
                pharmacy={lead}
                city={cityIfElsewhere(lead, place, i18n.locale)}
                distance={scene.distance}
                count={unlisted.count}
                knownOpen={nearestOpen}
                knownOpenWithStreet={nearestOpen && needsStreet.has(nearestOpen.id)}
                hoursListed={scene.hoursListed}
                country={country}
                onRoute={select}
                onSelect={select}
                onShowCard={showCard}
                onMedicine={openMedicine}
                medicineSite={cardSite}
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
                country={country}
                onRoute={select}
                onSelect={select}
                onShowCard={showCard}
                onMedicine={openMedicine}
                medicineSite={cardSite}
              >
                {banner}
              </NearestOpenCard>
            )}

            {!lead && !nearestOpen && firstToOpen && (
              <NothingOpenCard pharmacy={firstToOpen} distance={scene.distance} onSelect={select} onMedicine={openMedicine} medicineSite={cardSite}>
                {banner}
              </NothingOpenCard>
            )}

            {lineAlone && openMedicine && cardSite && <MedicineRow onOpen={openMedicine} site={cardSite} />}
          </div>
        ) : undefined
      }
      emergencyInFooter={!!nearestOpen}
      onRefresh={options.onRefresh}
      onPlace={options.onSearch ?? NO_ACTION}
      dataFrom={scene.dataFrom}
      onPrescription={atHome && !asked ? () => setAsked(true) : undefined}
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
          keepSelected={!!detail}
          onPick={open}
          onView={options.onArea}
          routeTo={routeTo}
          routeFor={options.routeFor}
          pixels={options.mapPixels}
          plainTouch={options.mapPlainTouch}
        />
      }
      detailOpen={!!detail}
      detailFold={detailFold}
      detail={
        <dialog
          ref={detailRef}
          className={styles.detail}
          aria-labelledby={`${id}-detail`}
          // The dialog says it has closed a moment after it did. If another pharmacy was opened in
          // that moment, the sheet is open again and this is old news.
          onClose={(event) => {
            if (!event.currentTarget.open) close();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') close();
          }}
        >
          {detail && (
            <Details
              pharmacy={detail}
              city={cityIfElsewhere(detail, place, i18n.locale)}
              distance={scene.distance}
              headingId={`${id}-detail`}
              nextOpen={detailNext}
              nextOpenWithStreet={detailNext && needsStreet.has(detailNext.id)}
              country={country}
              onShowCard={showCard}
              onMedicine={offered && providerFor(detail.country) ? () => setMedicineFor(detail.country) : undefined}
              medicineSite={siteOf(detail.country)}
              report={
                options.reports && {
                  known: report.known,
                  summary: report.summary,
                  example: options.reportExample,
                  // Only where the app has guidance to open: a pharmacy in a covered country.
                  onGuidance: here ? toGuidance : undefined,
                  offered: report.offered && !options.reportNote,
                  note: report.note ?? options.reportNote,
                  onOpen: () => {
                    reportOpener.current = pressed.current ?? document.activeElement;
                    setReportFor(detail.id);
                  },
                  onSkip: () => {
                    report.skip();
                    afterReport();
                  },
                }
              }
              onClose={close}
              onSelect={select}
            />
          )}
        </dialog>
      }
      overlays={
        <>
          {guidance && guide?.card && <guidance.CounterCard card={guide.card} open={counterOpen} onClose={() => setCounterOpen(false)} initialVariant={options.counter} fixedAwake={options.counterAwake} />}
          {options.reports && (
            <ReportDialog
              name={detail ? displayName(i18n, detail) : ''}
              open={reportOpen}
              onClose={() => setReportFor(undefined)}
              onSend={async (answers) => {
                const result = await report.send(answers);
                if (result !== 'failed') {
                  setReportFor(undefined);
                  afterReport();
                }
                return result;
              }}
              onSkip={() => {
                report.skip();
                afterReport();
              }}
              initialAnswers={options.reportAnswers}
              initialFailed={options.reportFailed}
            />
          )}
          {offered && (
            <MedicineDialog provider={(options.medicineReview ? providerForReview : providerFor)(medicineFor)} open={medicineFor !== undefined} onClose={() => setMedicineFor(undefined)} initialValue={options.medicineValue}>
              {options.medicineExample}
            </MedicineDialog>
          )}
        </>
      }
    >
      {hasLists && (
        <div className={styles.content} data-reveal={options.reveal || undefined}>
          {options.reports && <ReportFilters filter={filter} none={filter.state === 'ready' && shownOthers.length + shownClosed.length === 0} />}

          {shownOthers.length > 0 && (
            <PharmacyList
              pharmacies={shownOthers}
              distance={scene.distance}
              needsStreet={needsStreet}
              selectedId={detailId}
              onSelect={select}
              alone={!lead && !nearestOpen && !firstToOpen}
            />
          )}

          {shownClosed.length > 0 && (
            <ClosedGroup
              pharmacies={shownClosed}
              distance={scene.distance}
              needsStreet={needsStreet}
              selectedId={detailId}
              onSelect={select}
              initiallyOpen={options.closedOpen}
              firstShownAbove={!!firstToOpen}
            />
          )}
        </div>
      )}
    </ResultsShell>
  );
}

interface SheetRowProps {
  /** The id of the row's heading. */
  id: string;
  /** What the row is, for screen readers: "Lähin auki nyt". On screen the lit cross and the bar's count say it. */
  label: string;
  pharmacy: Pharmacy;
  distance: Scene['distance'];
  /** In place of the pharmacy's status line, where another line says more: ehditkö. */
  status?: ReactNode;
  /** The row's one button. */
  action: ReactNode;
  /** The row's cross switches on with the markers (PLAN.md section 6, "Motion"). */
  reveal?: boolean;
}

/**
 * The phone's sheet at its lowest: one pharmacy in one row. The cross, the name, how far
 * and whether it is open, and one button. The second line starts with the distance, so it
 * is in the same place in every row, and wraps when a status is long: no status is cut off.
 */
function SheetRow({ id, label, pharmacy, distance, status, action, reveal }: SheetRowProps) {
  const i18n = useI18n();
  const way = travel(i18n, pharmacy, distance);
  return (
    <section aria-labelledby={id} className={styles.row} data-reveal={reveal || undefined}>
      <CrossGlyph state={glyphFor(pharmacy.status)} size={24} className={styles.rowGlyph} />
      <div className={styles.rowWho}>
        <h2 id={id} className="visually-hidden">
          {label}
        </h2>
        <h3 className={styles.rowName}>{displayName(i18n, pharmacy)}</h3>
        <p className={styles.rowLine}>
          <span className={cx(styles.rowDistance, 'tnum')}>
            <Measure {...way.primary} />
          </span>
          <span aria-hidden="true"> · </span>
          <span className="visually-hidden">, </span>
          {status ?? <OpenStatus status={pharmacy.status} inline />}
        </p>
      </div>
      {action}
    </section>
  );
}
