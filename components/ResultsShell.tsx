'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { rich } from '@/lib/i18n/rich';
import { AppMark } from './AppMark';
import { IconButton } from './Button';
import { Wordmark } from './FirstVisit';
import { LanguageSwitch } from './LanguageSwitch';
import { SiteFooter } from './SiteFooter';
import styles from './ResultsShell.module.css';

export type SheetState = 'peek' | 'expanded' | 'static';

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
}

/**
 * The frame every map view shares. Phone: full-screen map, floating bar, bottom sheet.
 * Desktop: list panel on the left, map on the right. The list comes before the map in
 * the document, so it is first in the tab order (PLAN.md section 9).
 */
export function ResultsShell({ place, updated, barLine, title, sheet, onSheetChange, peek, children, distance, map, mapLabel, detail, detailOpen, overlays, emergencyInFooter = true, onRefresh }: Props) {
  const { t, f } = useI18n();
  const peekRef = useRef<HTMLDivElement>(null);
  const [peekHeight, setPeekHeight] = useState<number>();
  const hasPeek = peek !== undefined;

  // The collapsed sheet is exactly as tall as its content, whatever the text size.
  useEffect(() => {
    const element = peekRef.current;
    if (!element) return;
    const measure = () => setPeekHeight(element.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasPeek]);

  const time = updated && <time dateTime={updated}>{f.clock(updated)}</time>;
  const toggles = sheet !== 'static';
  const expanded = sheet === 'expanded';

  return (
    <div className={styles.shell} data-sheet={sheet} data-detail={detailOpen || undefined} style={peekHeight ? ({ '--peek': `${peekHeight}px` } as CSSProperties) : undefined}>
      <header className={styles.bar}>
        <div className={styles.barMain}>
          <AppMark />
          <div className={styles.barText}>
            <p className={styles.barPlace}>{place ?? t.results.nearYou}</p>
            {(barLine || time) && <p className={styles.barUpdated}>{barLine ?? rich(t.results.updated, { time })}</p>}
          </div>
          <IconButton icon="refresh" label={t.results.refresh} variant="bare" onClick={onRefresh} />
        </div>
        <LanguageSwitch variant="round" />
      </header>

      <div className={styles.panel}>
        <header className={styles.brand}>
          <Wordmark />
          <LanguageSwitch />
        </header>

        {toggles && (
          <button
            type="button"
            className={styles.grabber}
            aria-expanded={expanded}
            aria-label={expanded ? t.results.collapseSheet : t.results.expandSheet}
            onClick={() => onSheetChange?.(expanded ? 'peek' : 'expanded')}
          >
            <span aria-hidden="true" />
          </button>
        )}

        <div className={styles.scroll}>
          <main className={styles.main}>
            <div className={styles.titleRow}>
              <div>
                <h1 className={styles.title}>{title}</h1>
                {time && <p className={styles.sub}>{rich(t.results.placeUpdated, { place: place ?? t.results.nearYou, time })}</p>}
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
            <SiteFooter variant="panel" distance={distance} emergency={emergencyInFooter} />
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
