'use client';

import { useEffect, useRef, useState, type CSSProperties, type DragEvent as ReactDragEvent, type FocusEvent as ReactFocusEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { rich } from '@/lib/i18n/rich';
import { AppMark } from './AppMark';
import { Button, IconButton } from './Button';
import { Icon } from './Icon';
import { Wordmark } from './FirstVisit';
import { LanguageSwitch } from './LanguageSwitch';
import { SiteFooter } from './SiteFooter';
import styles from './ResultsShell.module.css';

/**
 * Where the phone's sheet rests. `peek`: the handle and one row, so the map has the screen.
 * `half`: the card. `expanded`: the card and the list, nearly the whole screen. `static`: a
 * sheet as tall as its content that doesn't move (searching, a problem, out-of-date data).
 */
export type SheetState = 'peek' | 'half' | 'expanded' | 'static';
type Stop = Exclude<SheetState, 'static'>;

const DESKTOP = '(min-width: 900px)';
/** A press has to travel this far before it is a drag: under it, it is still a tap on whatever is there. */
const DRAG_FROM_PX = 6;
/**
 * A thumb rolls as it taps. The sheet follows it from 6 px on, but a finger that has gone no
 * farther than this and leaves the sheet where it was has tapped: when the browser makes a
 * click of it, as browsers do for a touch that moved this little, the click is the button's.
 */
const FINGER_TAP_PX = 12;
/** Let go faster than this, in pixels a millisecond, and the sheet goes the way it was thrown. */
const FLING = 0.5;
/** Pulled this far above the card, the sheet already shows the list it is on its way to. */
const LIST_FROM_PX = 24;
/** A mouse that lets go after a drag clicks whatever is under it, within this time of letting go. */
const CLICK_AFTER_DRAG_MS = 400;

interface Drag {
  pointer: number;
  startY: number;
  /** Where the sheet was when the drag began, in pixels down from fully open. */
  from: number;
  /** The places it can rest, from fully open downwards. */
  stops: { at: Stop; offset: number }[];
  active: boolean;
  lastY: number;
  lastTime: number;
  velocity: number;
  /** The farthest the press has been from where it began. */
  far: number;
  /** What the sheet shows right now: it changes when the drag passes the middle between two places. */
  over: Stop;
}

interface Props {
  /** Place name. Left out when it isn't known: the shell then says "Lähelläsi". */
  place?: string;
  /** Local time of the search, "HH:mm". */
  updated?: string;
  /** Phone top bar, second line, when it says more than the update time. */
  barLine?: ReactNode;
  /** The page title. Visible on desktop; for screen readers only on the phone, where the bar names the place. */
  title: string;
  sheet: SheetState;
  onSheetChange?: (sheet: SheetState) => void;
  /**
   * 'classic' is the sheet as it was before the compact one: two places, a tall collapsed
   * answer, and an open list that leaves the upper half of the map. Kept for the comparison
   * in /dev/states until the compact sheet is decided (DESIGN-LOG.md, 24 Nov 2026).
   */
  sheetStyle?: 'classic';
  /** The live region that announces the results. Outside everything the sheet hides, so it is heard at every place of the sheet. */
  status?: ReactNode;
  /** Phone, sheet at its lowest: one row. */
  peek?: ReactNode;
  /** The notices and the card: what the phone's sheet shows at `half`. */
  lead?: ReactNode;
  /** Phone, sheet at `half`: the label of the button under the card that opens the list. Left out when there is no list to open. */
  listLabel?: string;
  /** The lists, under the lead. */
  children?: ReactNode;
  distance?: 'walking' | 'straight';
  map: ReactNode;
  mapLabel: string;
  /**
   * Pharmacy details. They take the list's place while detailOpen is true: in the panel on
   * the desktop, and in the phone's sheet, which then rests at a middle height with the map
   * above it, or fully up. Dragged down to the row, the sheet says so and the details close.
   */
  detail?: ReactNode;
  detailOpen?: boolean;
  /** Phone: how much of the details the sheet shows at its middle height, in pixels from their top. */
  detailFold?: number;
  /** Dialogs. */
  overlays?: ReactNode;
  /** False where the view already shows the emergency number prominently. */
  emergencyInFooter?: boolean;
  onRefresh?: () => void;
  /**
   * Opens the place search, to look somewhere else. With it the place name in the phone's
   * bar is a button, and the desktop panel gets the same action in words.
   */
  onPlace?: () => void;
  /** When the data shown was fetched from OpenStreetMap, epoch seconds: the footer says so. */
  dataFrom?: number;
  /** The footer's way to the prescription banner, where the banner is not shown by itself. */
  onPrescription?: () => void;
  /** After a search the user started, focus moves to the title (PLAN.md section 9). */
  focusTitle?: boolean;
}

/**
 * The frame every map view shares. Phone: full-screen map, floating bar, bottom sheet.
 * Desktop: list panel on the left, map on the right. The list comes before the map in
 * the document, so it is first in the tab order (PLAN.md section 9).
 */
export function ResultsShell({ place, updated, barLine, title, sheet, onSheetChange, sheetStyle, status, peek, lead, listLabel, children, distance, map, mapLabel, detail, detailOpen, detailFold, overlays, emergencyInFooter = true, onRefresh, onPlace, dataFrom, onPrescription, focusTitle }: Props) {
  const { t, f } = useI18n();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const peekRef = useRef<HTMLDivElement>(null);
  const leadRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const listsRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLElement>(null);
  const peekProbe = useRef<HTMLSpanElement>(null);
  const halfProbe = useRef<HTMLSpanElement>(null);
  const drag = useRef<Drag | null>(null);
  /** When a drag ended, on the events' own clock: the click that the same press may bring is not a press. */
  const dragged = useRef<number | null>(null);
  /** What took focus below the fold: it is brought into view once the sheet has opened for it. */
  const focused = useRef<Element | null>(null);
  /** The list was opened from "Kaikki N apteekkia", which then goes away: focus moves on to the list. */
  const toList = useRef(false);
  /** How far the open list was scrolled: a pharmacy's details take its place for a while, and it comes back where it was. */
  const listTop = useRef(0);

  useEffect(() => {
    if (focusTitle) titleRef.current?.focus();
  }, [focusTitle]);

  const classic = sheetStyle === 'classic' && !detailOpen;
  const hasPeek = peek !== undefined;
  const hasLead = lead !== undefined;
  const hasMore = listLabel !== undefined && !classic;
  // A pharmacy's details rest at the middle or fully up. Otherwise: without a row to show, the
  // sheet's lowest place is the card, and the classic sheet has no card stop.
  const at: SheetState = detailOpen ? (sheet === 'expanded' ? 'expanded' : 'half') : sheet === 'peek' && !hasPeek ? 'half' : sheet === 'half' && classic ? 'peek' : sheet;

  // The lowest sheet is exactly as tall as its row, whatever the text size.
  const [peekHeight, setPeekHeight] = useState<number>();
  useEffect(() => {
    const element = peekRef.current;
    if (!element) return;
    // Out of sight the row keeps its box (classic: it doesn't, and its last real height stands).
    const measure = () => setPeekHeight((last) => element.offsetHeight || last);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasPeek]);

  // At `half` the sheet is as tall as the card and the button under it. Measured at every
  // place the sheet rests in, so it is known before the sheet is pulled up to it.
  const [leadHeight, setLeadHeight] = useState<number>();
  useEffect(() => {
    const element = leadRef.current;
    if (!element) return;
    const measure = () => {
      const more = moreRef.current;
      // From the top of the card to the bottom of the button under it, the gap between them included.
      const height = more ? more.getBoundingClientRect().bottom - element.getBoundingClientRect().top : element.offsetHeight;
      setLeadHeight((last) => (element.offsetHeight ? Math.round(height) : last));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (moreRef.current) observer.observe(moreRef.current);
    return () => observer.disconnect();
  }, [hasLead, hasMore]);

  // A sheet that doesn't collapse (searching, a problem, out-of-date data) is as tall as its
  // content: the map is told how much of it that covers, so that the dot stays in view above it.
  const [staticHeight, setStaticHeight] = useState<number>();
  useEffect(() => {
    const panel = panelRef.current;
    if (sheet !== 'static' || !panel) return;
    const measure = () => setStaticHeight(panel.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [sheet]);

  // Only the open sheet scrolls: anywhere else the content starts from its top again. When the
  // list opens, focus is kept in sight: what took it below the fold is brought into view, and
  // from "Kaikki N apteekkia", which goes away, it moves on to the list that button promised.
  // A list that a pharmacy's details had taken the place of comes back where it was left.
  useEffect(() => {
    if (window.matchMedia(DESKTOP).matches) return;
    const scroll = scrollRef.current;
    if (at !== 'expanded' || detailOpen) scroll?.scrollTo({ top: 0 });
    // The first pharmacy of the list, which is what the button promised: not the list's filters, which stand above it.
    else if (toList.current) (listsRef.current?.querySelector<HTMLElement>('ol button, ol a[href]') ?? listsRef.current?.querySelector<HTMLElement>('button, a[href]'))?.focus();
    else if (focused.current) focused.current.scrollIntoView({ block: 'nearest' });
    else scroll?.scrollTo({ top: listTop.current });
    if (at !== 'expanded' && !detailOpen) listTop.current = 0;
    focused.current = null;
    toList.current = false;
  }, [at, detailOpen]);

  const time = updated && <time dateTime={updated}>{f.clock(updated)}</time>;
  const toggles = at !== 'static';
  const expanded = at === 'expanded';

  /** The places the sheet can rest in, lowest first. */
  const stops: Stop[] = detailOpen ? ['half', 'expanded'] : classic ? ['peek', 'expanded'] : hasPeek ? ['peek', 'half', 'expanded'] : ['half', 'expanded'];
  // A press on the handle goes one place up, and from the top back to the lowest.
  const next = stops[(stops.indexOf(at as Stop) + 1) % stops.length];
  const handleLabel = detailOpen ? (next === 'expanded' ? t.results.showMore : t.results.showLess) : next === 'half' ? t.results.showMore : next === 'expanded' ? t.results.expandSheet : t.results.collapseSheet;

  // What the listeners below read: always the latest, without being set up again.
  const current = { at, detailOpen: !!detailOpen };
  const latest = useRef(current);
  useEffect(() => {
    latest.current = current;
  });

  // Fully up, the sheet's content scrolls like any list. At its top, a finger that pulls
  // down has nothing left to scroll: it takes the sheet down with it (the drag below), and the
  // browser must not scroll or stretch anything meanwhile. It is told so on the first move of
  // such a pull, which is the only moment it asks; every other touch stays the scroller's own.
  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    let from: { x: number; y: number } | null = null;
    let pull: boolean | null = false;
    const start = (event: TouchEvent) => {
      const [touch] = event.touches;
      const armed = event.touches.length === 1 && latest.current.at === 'expanded' && scroll.scrollTop <= 0 && !window.matchMedia(DESKTOP).matches;
      from = armed ? { x: touch.clientX, y: touch.clientY } : null;
      pull = armed ? null : false;
    };
    const move = (event: TouchEvent) => {
      if (pull === null && from) {
        const [touch] = event.touches;
        const down = touch.clientY - from.y;
        pull = down > 0 && down > Math.abs(touch.clientX - from.x);
      }
      if (pull && event.cancelable) event.preventDefault();
    };
    scroll.addEventListener('touchstart', start, { passive: true });
    scroll.addEventListener('touchmove', move, { passive: false });
    return () => {
      scroll.removeEventListener('touchstart', start);
      scroll.removeEventListener('touchmove', move);
    };
  }, []);

  // Dragging the phone's sheet (PLAN.md section 5). It follows the finger between its places
  // and settles on the nearest, or one place the way it was thrown. On the way it shows what
  // it is coming to: the card once it is halfway up from the row, the list as soon as it is
  // pulled above the card. Below its open place the whole sheet is the handle. Open, the handle
  // is, and so is the content while it is at its top and a finger pulls it down: otherwise the
  // content scrolls as usual.
  // With a pharmacy's details in it the sheet rests at the middle or fully up, and a drag takes
  // it down to the row as well: let go there, the details close (Apple Maps' place card).
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragged.current = null;
    const shell = shellRef.current;
    const panel = panelRef.current;
    const low = peekProbe.current;
    const middle = halfProbe.current;
    if (!toggles || !shell || !panel || !low || !middle || drag.current || window.matchMedia(DESKTOP).matches) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const target = event.target as Element;
    // Open, the content is the scroller's. Only a finger that pulls it down from its top moves the sheet.
    const pull = expanded && !target.closest('[data-grab]');
    if (pull && (event.pointerType === 'mouse' || (scrollRef.current?.scrollTop ?? 0) > 0)) return;
    const height = panel.offsetHeight;
    const visible: Record<Stop, number> = { expanded: height, half: middle.offsetHeight, peek: low.offsetHeight };
    const reach: Stop[] = detailOpen ? ['peek', ...stops] : stops;
    const places = reach.map((stop) => ({ at: stop, offset: height - visible[stop] })).sort((a, b) => a.offset - b.offset);
    const from = places.find((stop) => stop.at === at)?.offset;
    const max = places[places.length - 1].offset;
    if (from === undefined || max <= 0) return;
    const state: Drag = { pointer: event.pointerId, startY: event.clientY, from, stops: places, active: false, lastY: event.clientY, lastTime: event.timeStamp, velocity: 0, far: 0, over: at as Stop };
    const finger = event.pointerType !== 'mouse';
    drag.current = state;
    const offsetAt = (y: number) => Math.min(max, Math.max(0, state.from + y - state.startY));
    const nearest = (offset: number) => places.reduce((best, stop) => (Math.abs(stop.offset - offset) < Math.abs(best.offset - offset) ? stop : best)).at;
    const card = places.find((stop) => stop.at === 'half');
    const row = places.find((stop) => stop.at === 'peek');
    /** What the sheet holds while it is at an offset. Without a card stop (the classic sheet): what is nearest. */
    const holds = (offset: number): Stop => {
      if (!card) return nearest(offset);
      // A pharmacy's details stay in the sheet until it is let go at the row.
      if (row && !detailOpen && offset > (row.offset + card.offset) / 2) return 'peek';
      return offset > card.offset - LIST_FROM_PX ? 'half' : 'expanded';
    };
    const show = (stop: Stop) => {
      if (stop === state.over) return;
      state.over = stop;
      onSheetChange?.(stop);
    };
    const release = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      drag.current = null;
    };

    // On the window: a mouse leaves the sheet as soon as it moves up from the handle.
    const move = (moved: PointerEvent) => {
      if (moved.pointerId !== state.pointer) return;
      state.far = Math.max(state.far, Math.abs(moved.clientY - state.startY));
      if (!state.active) {
        if (Math.abs(moved.clientY - state.startY) < DRAG_FROM_PX) return;
        // Upwards from the top of the open content: that is a scroll, and the scroller's.
        if (pull && moved.clientY < state.startY) return release();
        state.active = true;
        panel.style.transition = 'none';
        // A mouse that drags the sheet by its text would select that text on the way, and the next
        // press on it would pick the selection up instead of the sheet.
        panel.style.setProperty('user-select', 'none');
        panel.style.setProperty('-webkit-user-select', 'none');
        window.getSelection()?.removeAllRanges();
        // The map keeps its framing until the sheet has settled: one move then, not one at every step.
        const pad = classic ? (at === 'expanded' ? height : visible.peek) : at === 'peek' ? visible.peek : visible.half;
        shell.style.setProperty('--map-pad', `${pad}px`);
      }
      const elapsed = moved.timeStamp - state.lastTime;
      if (elapsed > 0) state.velocity = (moved.clientY - state.lastY) / elapsed;
      state.lastY = moved.clientY;
      state.lastTime = moved.timeStamp;
      const offset = offsetAt(moved.clientY);
      panel.style.transform = `translateY(${offset}px)`;
      show(holds(offset));
    };
    const end = (ended: PointerEvent) => {
      if (ended.pointerId !== state.pointer) return;
      release();
      if (!state.active) return;
      const offset = offsetAt(state.lastY);
      const thrown = ended.type === 'pointerup' && Math.abs(state.velocity) > FLING;
      // Thrown: the next place that way from where it was let go. There may be none: then the nearest.
      const onward = thrown ? (state.velocity < 0 ? places.filter((stop) => stop.offset < offset).pop() : places.find((stop) => stop.offset > offset)) : undefined;
      const settles = onward?.at ?? nearest(offset);
      // The press that ends a drag is not a tap on whatever was under it. A finger that only
      // rolled, and leaves the sheet where it was, has not dragged anything.
      const rolled = finger && state.far <= FINGER_TAP_PX && settles === at;
      dragged.current = rolled ? null : ended.timeStamp;
      panel.style.transition = '';
      panel.style.transform = '';
      panel.style.removeProperty('user-select');
      panel.style.removeProperty('-webkit-user-select');
      shell.style.removeProperty('--map-pad');
      show(settles);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  // A link, or text that happens to be selected, is something a browser lets a mouse pick up and
  // carry off. That would cancel the sheet's own drag: where a press can move the sheet, it does.
  const onDragStart = (event: ReactDragEvent<HTMLDivElement>) => {
    if (drag.current) event.preventDefault();
  };

  // A mouse that drags the sheet by a button lets go over the same button: that is not a press of it.
  const onClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    const ended = dragged.current;
    dragged.current = null;
    // Only the click of that same press, which comes at once. A finger's drag brings none, and a later press is its own.
    if (ended === null || event.timeStamp - ended > CLICK_AFTER_DRAG_MS) return;
    event.preventDefault();
    event.stopPropagation();
  };

  // Phone, list open: the sheet covers the map but for a strip under the bar. What can't be
  // seen can't be focused or pressed either: without this the keyboard went on from the list
  // to markers that lie under it. The classic sheet leaves half the map in view, so it stays.
  useEffect(() => {
    const element = mapRef.current;
    if (!element) return;
    const query = window.matchMedia(DESKTOP);
    const apply = () => {
      element.inert = at === 'expanded' && !classic && !query.matches;
    };
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, [at, classic]);

  // At the card, a card taller than the sheet may show has controls below the screen's edge.
  // When one of them takes focus the sheet opens, so that nothing focused is out of sight.
  // (The list itself is out of reach until it is opened: see the stylesheet.)
  const onFocus = (event: ReactFocusEvent<HTMLDivElement>) => {
    if (at !== 'half' || window.matchMedia(DESKTOP).matches) return;
    if (event.target.getBoundingClientRect().bottom <= window.innerHeight) return;
    if (moreRef.current?.contains(event.target)) toList.current = true;
    else focused.current = event.target;
    onSheetChange?.('expanded');
  };
  const openList = () => {
    toList.current = true;
    onSheetChange?.('expanded');
  };
  // A press on the row itself, beside its button, raises the sheet to the card: the row is the
  // sheet's visible part, and a press that did nothing there read as a touch that was lost. The
  // handle stays the control with a name, for the keyboard and for screen readers.
  const onRowClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (at !== 'peek' || window.matchMedia(DESKTOP).matches) return;
    if ((event.target as Element).closest('button, a')) return;
    onSheetChange?.(next);
  };

  const vars = {
    ...(peekHeight ? { '--peek': `${peekHeight}px` } : {}),
    ...(leadHeight ? { '--lead': `${leadHeight}px` } : {}),
    ...(detailOpen && detailFold ? { '--detail-fold': `${detailFold}px` } : {}),
    ...(sheet === 'static' && staticHeight ? { '--static-pad': `${staticHeight}px` } : {}),
  } as CSSProperties;

  return (
    <div ref={shellRef} className={styles.shell} data-sheet={at} data-sheet-style={sheetStyle} data-detail={detailOpen || undefined} style={vars}>
      {/* As tall as the part of the sheet that shows at its lowest and at the card: the drag reads them. */}
      <span ref={peekProbe} aria-hidden="true" className={styles.peekProbe} />
      <span ref={halfProbe} aria-hidden="true" className={styles.halfProbe} />
      <header className={styles.bar}>
        <div className={styles.barMain}>
          <AppMark />
          {onPlace ? (
            // The place is the way to another place: the name, with the glyph that says it can be searched.
            <button type="button" className={styles.barButton} onClick={onPlace}>
              <span className={styles.barPlaceRow}>
                <span className={styles.barPlace}>{place ?? t.results.nearYou}</span>
                <Icon name="search" size={18} className={styles.barGlyph} />
                <span className="visually-hidden">{t.results.searchElsewhere}</span>
              </span>
              {(barLine || time) && <span className={styles.barUpdated}>{barLine ?? rich(t.results.updated, { time })}</span>}
            </button>
          ) : (
            <div className={styles.barText}>
              <p className={styles.barPlace}>{place ?? t.results.nearYou}</p>
              {(barLine || time) && <p className={styles.barUpdated}>{barLine ?? rich(t.results.updated, { time })}</p>}
            </div>
          )}
          <IconButton icon="refresh" label={t.results.refresh} variant="bare" onClick={onRefresh} />
        </div>
        <LanguageSwitch variant="round" />
      </header>

      <div ref={panelRef} className={styles.panel} onPointerDown={onPointerDown} onDragStart={onDragStart} onClickCapture={onClickCapture}>
        <header className={styles.brand}>
          <Wordmark />
          <LanguageSwitch />
        </header>

        {toggles && (
          <button type="button" className={styles.grabber} data-grab aria-expanded={at !== 'peek'} aria-label={handleLabel} onClick={() => onSheetChange?.(next)}>
            <span aria-hidden="true" />
          </button>
        )}

        <div
          ref={scrollRef}
          className={styles.scroll}
          onFocus={onFocus}
          onScroll={(event) => {
            if (at === 'expanded' && !detailOpen) listTop.current = event.currentTarget.scrollTop;
          }}
        >
          <main className={styles.main}>
            <div className={styles.titleRow}>
              <div>
                <h1 ref={titleRef} tabIndex={-1} className={styles.title}>
                  {title}
                </h1>
                {time && <p className={styles.sub}>{rich(t.results.placeUpdated, { place: place ?? t.results.nearYou, time })}</p>}
                {onPlace && (
                  <button type="button" className={styles.elsewhere} onClick={onPlace}>
                    <Icon name="search" size={18} />
                    {t.results.searchElsewhere}
                  </button>
                )}
              </div>
              <IconButton icon="refresh" label={t.results.refresh} className={styles.refresh} onClick={onRefresh} />
            </div>
            {status}
            {hasPeek && (
              // Not a control of its own: the handle above is the same action for the keyboard.
              <div ref={peekRef} className={styles.peek} onClick={onRowClick}>
                {peek}
              </div>
            )}
            {detail}
            <div className={styles.full}>
              {hasLead && (
                <div ref={leadRef} className={styles.lead}>
                  {lead}
                </div>
              )}
              {hasMore && (
                // Lies over the top of the list, which starts right under the card: opening the list moves nothing.
                <div className={styles.more} inert={at !== 'half'}>
                  <div className={styles.moreBox}>
                    <div ref={moreRef}>
                      <Button trailing="chevron" onClick={openList}>
                        {listLabel}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <div ref={listsRef} className={styles.lists}>
                {children}
              </div>
            </div>
          </main>
          <div className={styles.footer}>
            <SiteFooter variant="panel" distance={distance} emergency={emergencyInFooter} dataFrom={dataFrom} onPrescription={onPrescription} />
          </div>
        </div>
      </div>

      <section ref={mapRef} className={styles.map} aria-label={mapLabel}>
        {map}
      </section>

      {overlays}
    </div>
  );
}
