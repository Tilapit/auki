'use client';

import type { AnchorHTMLAttributes } from 'react';
import { useI18n } from '@/lib/i18n/context';

/**
 * Every link that leaves the app opens in a tab of its own, so the results stay as they were
 * (PLAN.md section 5, "First visit"). The new tab learns nothing of ours: no referrer, and no
 * way back to this one.
 */
export const NEW_TAB = { target: '_blank', rel: 'noopener noreferrer' } as const;

/** Says so to a screen reader, after the link's own words: its name still begins with what it shows. */
export function NewTabNote() {
  const { t } = useI18n();
  return <span className="visually-hidden"> {t.app.newTab}</span>;
}

/** A text link to another site. A name given with `aria-label` gets the same note at its end. */
export function ExternalLink({ children, 'aria-label': label, ...rest }: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'rel'> & { href: string }) {
  const { t } = useI18n();
  return (
    <a {...rest} {...NEW_TAB} aria-label={label === undefined ? undefined : `${label} ${t.app.newTab}`}>
      {children}
      {label === undefined && <NewTabNote />}
    </a>
  );
}
