'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import type { CardPhrases } from '@/lib/types';
import { IconButton } from './Button';
import { cx } from './cx';
import styles from './CounterCard.module.css';

type Variant = keyof CardPhrases['variants'];

interface Props {
  card: CardPhrases;
  open: boolean;
  onClose: () => void;
  initialVariant?: Variant;
}

/**
 * The card to show at the counter: the local language large, English below.
 * Always light, also in dark mode: a stranger reads it at arm's length in a lit pharmacy,
 * like a paper document.
 * A native modal dialog, so focus is trapped, Escape closes it and focus returns to the
 * button that opened it. The foreign text carries its lang for screen readers.
 */
export function CounterCard({ card, open, onClose, initialVariant = 'ePrescription' }: Props) {
  const { t } = useI18n();
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const [variant, setVariant] = useState<Variant>(initialVariant);
  const phrases = card.variants[variant];

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Start reading from the title, not from the close button.
      dialog.querySelector<HTMLElement>('[data-dialog-focus]')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className={styles.dialog} aria-labelledby={`${id}-h`} data-theme="light" onClose={onClose}>
      <div className={styles.bar}>
        <h2 id={`${id}-h`} tabIndex={-1} data-dialog-focus className={styles.title}>
          {t.counter.title}
        </h2>
        <IconButton icon="close" label={t.app.close} variant="quiet" onClick={onClose} />
      </div>

      <div className={styles.body}>
        <div role="group" aria-label={t.counter.format} className={styles.switch}>
          {(['ePrescription', 'paper'] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={variant === key}
              className={cx(styles.option, variant === key && styles.current)}
              onClick={() => setVariant(key)}
            >
              {t.counter[key]}
            </button>
          ))}
        </div>

        <div lang={card.lang} className={styles.local}>
          {phrases.local.map((line, index) => (
            <p key={line} className={index < 2 ? styles.large : styles.medium}>
              {line}
            </p>
          ))}
        </div>

        <p lang="en" className={styles.english}>
          {phrases.english}
        </p>

        <div className={styles.bottom}>
          <div className={styles.help}>
            <p className={styles.helpLabel}>{variant === 'ePrescription' ? t.counter.ifNotFound : t.counter.ifRefused}</p>
            <p lang={card.lang} className={styles.helpLocal}>
              {card.pharmacist.local}
            </p>
            <p lang="en" className={styles.helpEnglish}>
              {card.pharmacist.english}
            </p>
          </div>
          <p className={styles.meta}>
            {!card.reviewed && <span className={styles.badge}>{t.counter.unreviewed}</span>}
            {t.counter.awake}
          </p>
        </div>
      </div>
    </dialog>
  );
}
