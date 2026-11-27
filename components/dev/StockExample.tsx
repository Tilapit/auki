'use client';

import { useEffect, useId, useState } from 'react';
import { exampleProvider } from '@/lib/fixtures/stock';
import { useI18n } from '@/lib/i18n/context';
import { rich } from '@/lib/i18n/rich';
import { displayName } from '@/lib/status';
import type { StockAnswer } from '@/lib/stock/provider';
import type { Pharmacy } from '@/lib/types';
import { clockAt } from '@/lib/zone';
import { cx } from '../cx';
import styles from './StockExample.module.css';

interface Props {
  medicine: string;
  /** The pharmacies on screen, in the list's order. */
  pharmacies: Pharmacy[];
  /** The clock the answer's time is said on. */
  zone: string;
}

/**
 * Live stock through the provider seam (PLAN.md 7.9), for /dev/states only: what the
 * medicine dialog could show once a country's service has agreed to an API. It asks the
 * example provider as the live app would ask a real one, from the device, and shows the
 * answer as the service's claim: whose it is, and from when. Labelled as example data.
 */
export function StockExample({ medicine, pharmacies, zone }: Props) {
  const i18n = useI18n();
  const { t, f } = i18n;
  const id = useId();
  const [answer, setAnswer] = useState<StockAnswer>();
  const site = t.medicine.services[exampleProvider.id as keyof typeof t.medicine.services].site;

  useEffect(() => {
    const controller = new AbortController();
    const query = { medicine, pharmacies: pharmacies.map(({ id, lat, lon, name }) => ({ id, lat, lon, name })) };
    void exampleProvider.stock?.(query, controller.signal).then((found) => {
      if (!controller.signal.aborted) setAnswer(found);
    });
    return () => controller.abort();
  }, [medicine, pharmacies]);

  if (!answer) return null;
  const named = answer.lines.flatMap((line) => {
    const pharmacy = pharmacies.find((candidate) => candidate.id === line.pharmacyId);
    return pharmacy ? [{ ...line, name: displayName(i18n, pharmacy) }] : [];
  });

  return (
    <section className={styles.example} aria-labelledby={`${id}-h`} data-stock-example>
      <p className={styles.badge}>{t.medicine.stock.example}</p>
      <h3 id={`${id}-h`} className={styles.product}>
        {answer.product}
      </h3>
      <p className={styles.source}>
        {rich(t.medicine.stock.source, { site: <span className={styles.site}>{site}</span>, time: <time dateTime={clockAt(answer.asOf, zone)}>{f.clock(clockAt(answer.asOf, zone))}</time> })}
      </p>
      <ul className={styles.lines}>
        {named.map((line) => (
          <li key={line.pharmacyId} className={styles.row}>
            <span className={styles.name}>{line.name}</span>
            <span className={cx(styles.level, styles[line.level])}>
              <span className={styles.mark} aria-hidden="true" />
              {t.medicine.stock.levels[line.level]}
            </span>
          </li>
        ))}
      </ul>
      <p className={styles.note}>{t.medicine.stock.exampleNote}</p>
    </section>
  );
}
