'use client';

import { useEffect, useMemo, useRef } from 'react';
import { helsinki } from '@/lib/fixtures/helsinki';
import { FIVE_REPORTS, NEARBY_REPORTS, fixedReports } from '@/lib/fixtures/reports';
import { ResultsView } from './Results';

export type ReportViewState = 'row' | 'summary' | 'open' | 'failed' | 'thanks' | 'filter' | 'filter-none';

/**
 * /dev/states only: a pharmacy's details with the visitors' reports in one of their states
 * (PLAN.md 7.10), on invented reports. Where the reports come from is a set of functions,
 * which only a client component can hand on: nothing here calls a service, reads the clock
 * or keeps anything.
 *
 * The reports are the last thing in the details, below what a screen holds. So that a
 * screenshot shows them, the view scrolls them into sight once they are there, and then marks
 * the row (`data-report-shown`), which is what the screenshot waits for.
 */
export function ReportView({ state }: { state: ReportViewState }) {
  const told = state === 'summary' || state === 'thanks';
  const listed = state === 'filter' || state === 'filter-none';
  const reports = useMemo(() => fixedReports(state === 'filter' ? NEARBY_REPORTS : told ? FIVE_REPORTS : {}, state === 'thanks' ? ['yliopiston'] : []), [told, state]);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    // Frame by frame, until the row has been in sight for ten frames running: it arrives a moment
    // after the details, and the details take the focus, and with it the scroll, as they open.
    let frame = 0;
    let tries = 0;
    let steady = 0;
    const show = () => {
      const last = element.querySelector('[data-report-row], [data-report-note]');
      const box = last?.getBoundingClientRect();
      if (last && box && box.height > 0 && box.top >= 0 && box.bottom <= window.innerHeight + 1) {
        steady += 1;
        if (steady >= 10) {
          // On the row itself: the wrapper has no box of its own for a test to see.
          last.setAttribute('data-report-shown', '');
          return;
        }
      } else {
        steady = 0;
        last?.scrollIntoView({ block: 'end' });
      }
      tries += 1;
      if (tries < 600) frame = requestAnimationFrame(show);
    };
    frame = requestAnimationFrame(show);
    return () => cancelAnimationFrame(frame);
  }, []);

  // The list with one of its filters on: on invented reports of three pharmacies, and on none at all.
  if (listed) return <ResultsView scene={helsinki} sheet="expanded" reports={reports} reportFilter={['english']} reportExample />;

  return (
    <div ref={root} style={{ display: 'contents' }}>
      <ResultsView
        // In Finland, as the live app knows from the tiles: the line about prescriptions from another country has guidance to lead to.
        scene={{ ...helsinki, here: 'FI' }}
        sheet="expanded"
        detailId="yliopiston"
        reports={reports}
        reportOpen={state === 'open' || state === 'failed'}
        reportAnswers={state === 'open' ? { prescription: true, foreign: true, shortWait: false } : state === 'failed' ? { english: true } : undefined}
        reportExample
        reportFailed={state === 'failed'}
        reportNote={state === 'thanks' ? 'thanks' : undefined}
      />
    </div>
  );
}
