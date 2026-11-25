'use client';

import { useId } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { rich } from '@/lib/i18n/rich';
import type { CountryInfo } from '@/lib/types';
import { Icon } from './Icon';
import styles from './CountryBanner.module.css';

/**
 * "Resepti Suomesta?" Shown only outside Finland, as a section of the card: the country's
 * status in one line, the key tip, where that comes from and when it was checked, and what
 * happened at the counter on the research trip, with its sample size, month and city
 * (PLAN.md section 8). The trip's line stands apart from the rule above it: one is what Kanta
 * says, the other what a few pharmacies did on one day.
 */
export function CountryBanner({ country }: { country: CountryInfo }) {
  const { t, f, locale } = useI18n();
  const id = useId();
  return (
    <section className={styles.banner} aria-labelledby={`${id}-h`}>
      <span className={styles.icon}>
        <Icon name="document" size={24} />
      </span>
      <div>
        <h2 id={`${id}-h`} className={styles.title}>
          {t.banner.title}
        </h2>
        <p className={styles.text}>
          {country.status[locale]} {country.tip[locale]}
        </p>
        <p className={styles.source}>
          {rich(t.banner.source, {
            source: (
              <a href={country.source.url} hrefLang="en">
                {country.source.label}
              </a>
            ),
            date: f.date(country.source.checked),
          })}
        </p>
        {country.field && <p className={styles.field}>{country.field[locale]}</p>}
      </div>
    </section>
  );
}
