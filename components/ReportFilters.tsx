'use client';

import { FILTER_TOPICS, type ReportFilter } from '@/hooks/useReport';
import { useI18n } from '@/lib/i18n/context';
import { Button } from './Button';
import styles from './ReportFilters.module.css';

/**
 * The list's two filters, above it: "Näytä vain apteekit, joista kävijät kertovat", then a chip
 * for each thing that can be asked for, named as the fact itself. Off until pressed. They take
 * rows out of the list and never change its order (PLAN.md 7.10).
 *
 * With a filter on and nothing left, the list's place says why: there are no reports yet to
 * choose by. That is the common case while reports are few, and it is said, not hidden.
 */
export function ReportFilters({ filter, none }: { filter: ReportFilter; /** A filter is on, the reports came, and no pharmacy passes. */ none: boolean }) {
  const { t } = useI18n();
  return (
    <div className={styles.filters} data-report-filters>
      <div role="group" aria-label={t.report.filters} className={styles.group}>
        <p aria-hidden="true" className={styles.label}>
          {t.report.filters}
        </p>
        <div className={styles.chips}>
          {FILTER_TOPICS.map((topic) => (
            <button key={topic} type="button" className={styles.chip} aria-pressed={filter.on[topic]} onClick={() => filter.toggle(topic)}>
              {t.report.topics[topic].yes}
            </button>
          ))}
        </div>
      </div>
      <p role="status" className={styles.status}>
        {none && t.report.filterNone}
        {filter.state === 'failed' && t.report.filterFailed}
      </p>
      {(none || filter.state === 'failed') && (
        <Button variant="text" className={styles.off} onClick={filter.clear}>
          {t.report.filterOff}
        </Button>
      )}
    </div>
  );
}
