'use client';

import { useId } from 'react';
import { useI18n } from '@/lib/i18n/context';
import styles from './ApproximateNotice.module.css';

/**
 * Shown when the device's position is good to about a kilometre at best (PLAN.md 7.1):
 * the distances may be off, and a place name gives a more exact result.
 */
export function ApproximateNotice({ onSearch }: { onSearch?: () => void }) {
  const { t } = useI18n();
  const id = useId();
  return (
    <section className={styles.notice} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className={styles.title}>
        {t.results.approximate}
      </h2>
      <p>{t.results.approximateBody}</p>
      <button type="button" className={styles.action} onClick={onSearch}>
        {t.first.search}
      </button>
    </section>
  );
}
