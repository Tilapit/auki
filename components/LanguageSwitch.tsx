'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useHandoff } from '@/hooks/useHandoff';
import { handoffFragment } from '@/lib/handoff';
import { otherLocale } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/context';
import { cx } from './cx';
import styles from './LanguageSwitch.module.css';

type Variant = 'text' | 'dusk' | 'round';

function SwitchLink({ variant, query }: { variant: Variant; query: string }) {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const target = otherLocale(locale);
  const rest = pathname.split('/').slice(2).join('/');
  // A hand-off link's parameters go along (PLAN.md 7.8): a link without a fragment would drop them.
  const fragment = handoffFragment(useHandoff());
  const href = `/${target}${rest ? `/${rest}` : ''}${query}${fragment}`;
  const round = variant === 'round';
  return (
    <a
      href={href}
      hrefLang={target}
      lang={target}
      aria-label={round ? t.app.otherLanguageLabel : undefined}
      className={cx(styles.link, styles[variant])}
    >
      {round ? t.app.otherLanguageShort : t.app.otherLanguage}
    </a>
  );
}

function WithQuery({ variant }: { variant: Variant }) {
  const params = useSearchParams().toString();
  return <SwitchLink variant={variant} query={params ? `?${params}` : ''} />;
}

/**
 * A real link to the same page in the other language: the locale lives in the URL.
 * One language, named in that language. Not a toggle.
 */
export function LanguageSwitch({ variant = 'text' }: { variant?: Variant }) {
  return (
    <Suspense fallback={<SwitchLink variant={variant} query="" />}>
      <WithQuery variant={variant} />
    </Suspense>
  );
}
