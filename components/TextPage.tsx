'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { Wordmark } from './FirstVisit';
import { LanguageSwitch } from './LanguageSwitch';
import { SiteFooter } from './SiteFooter';
import styles from './TextPage.module.css';

/**
 * The frame of a page of text (the data page, "what the app sends"): the wordmark as the way
 * back to the search, the other language, the title, the way back once more, and the footer.
 */
export function TextPage({ title, children }: { title: string; children: ReactNode }) {
  const { t, locale } = useI18n();
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href={`/${locale}`} className={styles.home} aria-label={t.data.home}>
          <Wordmark size={26} />
        </Link>
        <LanguageSwitch />
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>{title}</h1>
        {children}
        <p className={styles.text}>
          <Link href={`/${locale}`}>{t.data.back}</Link>
        </p>
      </main>

      <SiteFooter variant="panel" />
    </div>
  );
}
