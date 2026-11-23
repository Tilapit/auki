'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { rich } from '@/lib/i18n/rich';
import { OSM_COPYRIGHT_URL } from '@/lib/maps';
import { INDEX_PATH } from '@/lib/tiles';
import type { CountryStats, IndexJson } from '@/lib/tiles';
import { Wordmark } from './FirstVisit';
import { LanguageSwitch } from './LanguageSwitch';
import { SiteFooter } from './SiteFooter';
import styles from './DataPage.module.css';

export type Loaded = { status: 'loading' } | { status: 'failed' } | { status: 'ready'; index: IndexJson };

/** Reads index.json, the same file every search starts from, and shows its numbers. */
export function DataPage() {
  const [loaded, setLoaded] = useState<Loaded>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    fetch(INDEX_PATH, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        const index = (await response.json()) as IndexJson;
        if (!index?.countries) throw new Error('not an index');
        setLoaded({ status: 'ready', index });
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoaded({ status: 'failed' });
      });
    return () => controller.abort();
  }, []);

  return <DataView loaded={loaded} />;
}

/** The page for a given state of the numbers. Also rendered in /dev/states, from a fixture. */
export function DataView({ loaded }: { loaded: Loaded }) {
  const { t, locale } = useI18n();
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href={`/${locale}`} className={styles.home} aria-label={t.data.back}>
          <Wordmark size={26} />
        </Link>
        <LanguageSwitch />
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>{t.data.title}</h1>
        <p className={styles.intro}>{t.data.intro}</p>

        {loaded.status === 'loading' && (
          <p role="status" className={styles.note}>
            {t.data.loading}
          </p>
        )}
        {loaded.status === 'failed' && (
          <p role="status" className={styles.note}>
            {t.data.failed}
          </p>
        )}
        {loaded.status === 'ready' && <DataTable index={loaded.index} />}

        <ul className={styles.explain}>
          {t.data.explain.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className={styles.text}>{t.data.fix}</p>
        <p className={styles.text}>{rich(t.data.licence, { osm: <a href={OSM_COPYRIGHT_URL}>{t.footer.osm}</a> })}</p>
        <p className={styles.text}>
          <Link href={`/${locale}`}>{t.data.back}</Link>
        </p>
      </main>

      <SiteFooter variant="panel" />
    </div>
  );
}

function DataTable({ index }: { index: IndexJson }) {
  const { t, f, locale } = useI18n();
  const rows = Object.entries(index.countries)
    .map(([code, stats]) => ({ code, name: f.countryName(code), stats }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
  const total = rows.reduce(
    (sum, { stats }) => ({ pharmacies: sum.pharmacies + stats.pharmacies, withHours: sum.withHours + stats.withHours, parsed: sum.parsed + stats.parsed }),
    { pharmacies: 0, withHours: 0, parsed: 0 },
  );
  const share = (part: number, whole: number) => (whole === 0 ? '' : f.percent(part / whole));
  const anyKept = rows.some(({ stats }) => stats.kept);

  const line = (name: string, stats: Pick<CountryStats, 'pharmacies' | 'withHours' | 'parsed'>, fetched?: number, kept?: boolean) => (
    <>
      <th scope="row">{name}</th>
      <td>{f.count(stats.pharmacies)}</td>
      <td>{share(stats.withHours, stats.pharmacies)}</td>
      <td>{share(stats.parsed, stats.withHours)}</td>
      <td>
        {fetched !== undefined && <time dateTime={new Date(fetched * 1000).toISOString()}>{f.dayOf(fetched)}</time>}
        {kept && <span className={styles.kept}> ({t.data.kept})</span>}
      </td>
    </>
  );

  return (
    <>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <caption className="visually-hidden">{t.data.caption}</caption>
          <thead>
            <tr>
              <th scope="col">{t.data.columns.country}</th>
              <th scope="col">{t.data.columns.pharmacies}</th>
              <th scope="col">{t.data.columns.withHours}</th>
              <th scope="col">{t.data.columns.parsed}</th>
              <th scope="col">{t.data.columns.fetched}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ code, name, stats }) => (
              <tr key={code}>{line(name, stats, stats.generated, !!stats.kept)}</tr>
            ))}
          </tbody>
          <tfoot>
            <tr>{line(t.data.all, total)}</tr>
          </tfoot>
        </table>
      </div>
      {anyKept && <p className={styles.note}>{t.data.keptNote}</p>}
    </>
  );
}
