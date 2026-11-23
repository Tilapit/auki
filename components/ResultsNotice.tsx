'use client';

import { useId, type ReactNode } from 'react';
import styles from './ApproximateNotice.module.css';

/**
 * A notice at the top of the results: what the list below can't be relied on for, in the
 * same quiet amber as the approximate-location notice. It starts with a heading, so a
 * screen reader can find it; without one it is a single plain sentence.
 */
export function ResultsNotice({ title, children }: { title?: string; children: ReactNode }) {
  const id = useId();
  if (!title) {
    return (
      <p className={styles.notice} data-plain>
        {children}
      </p>
    );
  }
  return (
    <section className={styles.notice} data-plain aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className={styles.title}>
        {title}
      </h2>
      <p>{children}</p>
    </section>
  );
}
