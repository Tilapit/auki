'use client';

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { rich } from '@/lib/i18n/rich';
import { AppMark } from './AppMark';
import { IconButton } from './Button';
import { Icon } from './Icon';
import { Wordmark } from './FirstVisit';
import { LanguageSwitch } from './LanguageSwitch';
import { SiteFooter } from './SiteFooter';
import styles from './ResultsShell.module.css';

export type SheetState = 'peek' | 'expanded' | 'static';

const DESKTOP = '(min-width: 900px)';
/** A press has to travel this far before it is a drag: under it, it is still a tap on whatever is there. */
const DRAG_FROM_PX = 6;
/** Let go faster than this, in pixels a millisecond, and the sheet goes the way it was thrown. */
const FLING = 0.5;

interface Drag {
  pointer: number;
  startY: number;
  /** Where the sheet was when the drag began, and how far down its collapsed place is. */
  from: number;
  max: number;
  active: boolean;
  lastY: number;
  lastTime: number;
  velocity: number;
  /** What the sheet shows right now: it changes when the drag passes the middle. */
  over: 'peek' | 'expanded';
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
  /** Phone, collapsed sheet. */
  peek?: ReactNode;
  children: ReactNode;
  distance?: 'walking' | 'straight';
  map: ReactNode;
  mapLabel: string;
  /**
   * Pharmacy details. Phone: a modal sheet over everything. Desktop: takes the list's place
   * in the panel while detailOpen is true.
   */
  detail?: ReactNode;
  detailOpen?: boolean;
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
  /** After a search the user started, focus moves to the title (PLAN.md section 9). */
  focusTitle?: boolean;
}

/**
 * The frame every map view shares. Phone: full-screen map, floating bar, bottom sheet.
 * Desktop: list panel on the left, map on the right. The list comes before the map in
 * the document, so it is first in the tab order (PLAN.md section 9).
 */
export function ResultsShell({ place, updated, barLine, title, sheet, onSheetChange, peek, children, distance, map, mapLabel, detail, detailOpen, overlays, emergencyInFooter = true, onRefresh, onPlace, dataFrom, focusTitle }: Props) {
  const { t, f } = useI18n();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const peekRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const collapsedRef = useRef<HTMLSpanElement>(null);
  const drag = useRef<Drag | null>(null);
  const dragged = useRef(false);

  useEffect(() => {
    if (focusTitle) titleRef.current?.focus();
  }, [focusTitle]);

  const [peekHeight, setPeekHeight] = useState<number>();
  const hasPeek = peek !== undefined;

  // The collapsed sheet is exactly as tall as its content, whatever the text size.
  useEffect(() => {
    const element = peekRef.current;
    if (!element) return;
    // Hidden while the sheet is open, the peek measures nothing: its last real height stands.
    const measure = () => setPeekHeight((last) => element.offsetHeight || last);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasPeek]);

  const time = updated && <time dateTime={updated}>{f.clock(updated)}</time>;
  const toggles = sheet !== 'static';
  const expanded = sheet === 'expanded';

  // Dragging the phone's sheet (PLAN.md section 5). It follows the finger between its two
  // places, shows what it will hold once it is past the middle, and settles where it is let
  // go, or where it was thrown. Collapsed, the whole sheet is the handle; open, only the
  // handle is, so the list under it scrolls as usual.
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragged.current = false;
    const shell = shellRef.current;
    const panel = panelRef.current;
    const collapsed = collapsedRef.current;
    if (!toggles || !shell || !panel || !collapsed || drag.current || window.matchMedia(DESKTOP).matches) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (expanded && !(event.target as Element).closest('[data-grab]')) return;
    const max = panel.offsetHeight - collapsed.offsetHeight;
    if (max <= 0) return;
    const state: Drag = { pointer: event.pointerId, startY: event.clientY, from: expanded ? 0 : max, max, active: false, lastY: event.clientY, lastTime: event.timeStamp, velocity: 0, over: expanded ? 'expanded' : 'peek' };
    drag.current = state;
    const offsetAt = (y: number) => Math.min(max, Math.max(0, state.from + y - state.startY));
    const show = (next: 'peek' | 'expanded') => {
      if (next === state.over) return;
      state.over = next;
      onSheetChange?.(next);
    };

    // On the window: a mouse leaves the sheet as soon as it moves up from the handle.
    const move = (moved: PointerEvent) => {
      if (moved.pointerId !== state.pointer) return;
      if (!state.active) {
        if (Math.abs(moved.clientY - state.startY) < DRAG_FROM_PX) return;
        state.active = true;
        panel.style.transition = 'none';
        // The map keeps its framing until the sheet has settled: one move then, not one at every step.
        shell.style.setProperty('--map-pad', `${state.from === 0 ? panel.offsetHeight : collapsed.offsetHeight}px`);
      }
      const elapsed = moved.timeStamp - state.lastTime;
      if (elapsed > 0) state.velocity = (moved.clientY - state.lastY) / elapsed;
      state.lastY = moved.clientY;
      state.lastTime = moved.timeStamp;
      const offset = offsetAt(moved.clientY);
      panel.style.transform = `translateY(${offset}px)`;
      show(offset < max / 2 ? 'expanded' : 'peek');
    };
    const end = (ended: PointerEvent) => {
      if (ended.pointerId !== state.pointer) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      drag.current = null;
      if (!state.active) return;
      // The press that ends a drag is not a tap on the handle.
      dragged.current = true;
      const thrown = ended.type === 'pointerup' && Math.abs(state.velocity) > FLING;
      panel.style.transition = '';
      panel.style.transform = '';
      shell.style.removeProperty('--map-pad');
      show(thrown ? (state.velocity < 0 ? 'expanded' : 'peek') : offsetAt(ended.clientY) < max / 2 ? 'expanded' : 'peek');
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  return (
    <div ref={shellRef} className={styles.shell} data-sheet={sheet} data-detail={detailOpen || undefined} style={peekHeight ? ({ '--peek': `${peekHeight}px` } as CSSProperties) : undefined}>
      {/* As tall as the part of the sheet that shows when it is collapsed: the drag reads it. */}
      <span ref={collapsedRef} aria-hidden="true" className={styles.collapsed} />
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

      <div ref={panelRef} className={styles.panel} onPointerDown={onPointerDown}>
        <header className={styles.brand}>
          <Wordmark />
          <LanguageSwitch />
        </header>

        {toggles && (
          <button
            type="button"
            className={styles.grabber}
            data-grab
            aria-expanded={expanded}
            aria-label={expanded ? t.results.collapseSheet : t.results.expandSheet}
            onClick={() => {
              if (dragged.current) dragged.current = false;
              else onSheetChange?.(expanded ? 'peek' : 'expanded');
            }}
          >
            <span aria-hidden="true" />
          </button>
        )}

        <div className={styles.scroll}>
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
            {hasPeek && (
              <div ref={peekRef} className={styles.peek}>
                {peek}
              </div>
            )}
            {detail}
            <div className={styles.full}>{children}</div>
          </main>
          <div className={styles.footer}>
            <SiteFooter variant="panel" distance={distance} emergency={emergencyInFooter} dataFrom={dataFrom} />
          </div>
        </div>
      </div>

      <section className={styles.map} aria-label={mapLabel}>
        {map}
      </section>

      {overlays}
    </div>
  );
}
