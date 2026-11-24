'use client';

import { useI18n } from '@/lib/i18n/context';
import { statusText, toneFor } from '@/lib/status';
import type { OpenStatus as Status } from '@/lib/types';
import { cx } from './cx';
import styles from './OpenStatus.module.css';

interface Props {
  status: Status;
  strong?: boolean;
  /** Part of a line that says more, such as the distance before it: a span, in the line's own size. */
  inline?: boolean;
  className?: string;
}

/** The status sentence. Its colour repeats what the glyph shape and the words already say. */
export function OpenStatus({ status, strong, inline, className }: Props) {
  const i18n = useI18n();
  const tone = styles[toneFor(status)];
  if (inline) return <span className={cx(tone, className)}>{statusText(i18n, status)}</span>;
  return <p className={cx(styles.status, tone, strong && styles.strong, className)}>{statusText(i18n, status)}</p>;
}
