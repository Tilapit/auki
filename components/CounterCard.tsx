'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import type { CardPhrases, CardVariant } from '@/lib/types';
import { IconButton } from './Button';
import { cx } from './cx';
import styles from './CounterCard.module.css';

const ORDER: CardVariant[] = ['ePrescription', 'paper', 'doctorSends'];

interface Props {
  card: CardPhrases;
  open: boolean;
  onClose: () => void;
  initialVariant?: CardVariant;
  /** /dev/states only, which may not ask the browser for anything: whether the card says that the screen stays on. */
  fixedAwake?: boolean;
}

/**
 * The card to show at the counter: the local language large, English below.
 * Always light, also in dark mode: a stranger reads it at arm's length in a lit pharmacy,
 * like a paper document.
 * A native modal dialog, so focus is trapped, Escape closes it and focus returns to the
 * button that opened it. The foreign text carries its lang for screen readers.
 *
 * It offers only what makes sense in the country: no e-prescription lines where one can't be
 * bought with a Finnish e-prescription. While it is open the screen is asked to stay awake
 * (the Screen Wake Lock API): the card is held out to someone, and a screen that dims on the
 * way to the counter has to be woken in front of them. Where the browser can't, nothing is said.
 */
export function CounterCard({ card, open, onClose, initialVariant, fixedAwake }: Props) {
  const { t } = useI18n();
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const offered = ORDER.filter((key) => card.variants[key]);
  const [chosen, setChosen] = useState<CardVariant | undefined>(initialVariant);
  const variant = chosen && card.variants[chosen] ? chosen : offered[0];
  const phrases = card.variants[variant];
  const english = card.lang === 'en' || card.lang.startsWith('en-');
  // The lock itself, when the browser gave one: only then does the card say that the screen stays on.
  const [locked, setAwake] = useState(false);
  const awake = fixedAwake ?? locked;

  useEffect(() => {
    if (!open || fixedAwake !== undefined || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | undefined;
    let over = false;
    const ask = () => {
      if (document.visibilityState !== 'visible') return;
      navigator.wakeLock
        .request('screen')
        .then((granted) => {
          if (over) return void granted.release().catch(() => undefined);
          lock = granted;
          setAwake(true);
        })
        // Low battery, or the browser's own rule: the card works as before, without the line.
        .catch(() => setAwake(false));
    };
    ask();
    // A lock is let go when the page is hidden: asked for again when it comes back.
    document.addEventListener('visibilitychange', ask);
    return () => {
      over = true;
      document.removeEventListener('visibilitychange', ask);
      lock?.release().catch(() => undefined);
      setAwake(false);
    };
  }, [open, fixedAwake]);

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
        {offered.length > 1 && (
          <div role="group" aria-label={t.counter.format} className={styles.switch}>
            {offered.map((key) => (
              <button key={key} type="button" aria-pressed={variant === key} className={cx(styles.option, variant === key && styles.current)} onClick={() => setChosen(key)}>
                {t.counter[key]}
              </button>
            ))}
          </div>
        )}

        <div lang={card.lang} className={styles.local}>
          {phrases?.local.map((line, index) => (
            <p key={line} className={index < 2 ? styles.large : styles.medium}>
              {line}
            </p>
          ))}
        </div>

        {/* Where the pharmacy's language is English, the lines above are the English. */}
        {!english && (
          <p lang="en" className={styles.english}>
            {phrases?.english}
          </p>
        )}

        <div className={styles.bottom}>
          <div className={styles.help}>
            <p className={styles.helpLabel}>{variant === 'ePrescription' ? t.counter.ifNotFound : t.counter.ifRefused}</p>
            <p lang={card.lang} className={styles.helpLocal}>
              {card.pharmacist.local}
            </p>
            {!english && (
              <p lang="en" className={styles.helpEnglish}>
                {card.pharmacist.english}
              </p>
            )}
          </div>
          {(!card.reviewed || awake) && (
            <p className={styles.meta}>
              {!card.reviewed && <span className={styles.badge}>{t.counter.unreviewed}</span>}
              {awake && t.counter.awake}
            </p>
          )}
        </div>
      </div>
    </dialog>
  );
}
