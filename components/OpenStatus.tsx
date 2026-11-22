'use client';

import { useI18n } from '@/lib/i18n/context';
import { statusText, toneFor } from '@/lib/status';
import type { OpenStatus as Status } from '@/lib/types';
import { cx } from './cx';
import styles from './OpenStatus.module.css';

/** The status sentence. Its colour repeats what the glyph shape and the words already say. */
export function OpenStatus({ status, strong, className }: { status: Status; strong?: boolean; className?: string }) {
  const i18n = useI18n();
  return <p className={cx(styles.status, styles[toneFor(status)], strong && styles.strong, className)}>{statusText(i18n, status)}</p>;
}
