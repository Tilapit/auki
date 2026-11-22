'use client';

import { useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n/context';
import type { SkyAt } from '@/lib/sky';
import { AppMark } from './AppMark';
import { Button } from './Button';
import { CrossGlyph } from './CrossGlyph';
import { DuskScene } from './DuskScene';
import styles from './FirstVisit.module.css';

interface Props {
  /** ready: the two actions. locating and waiting: the button gives way to a status line. */
  phase?: 'ready' | 'locating' | 'waiting';
  onLocate?: () => void;
  onSearch?: () => void;
  /** A fixed moment for the sky, for /dev/states and tests. */
  sky?: SkyAt;
}

export function Wordmark({ size = 30 }: { size?: number }) {
  const { t } = useI18n();
  return (
    <div className={styles.brand}>
      <AppMark size={size} />
      <span className={styles.wordmark}>{t.app.name}</span>
    </div>
  );
}

/** First visit: one window, no questions. Location is asked only from the button. */
export function FirstVisit({ phase = 'ready', onLocate, onSearch, sky }: Props) {
  const { t } = useI18n();
  const status = useRef<HTMLDivElement>(null);
  const before = useRef(phase);

  // The button that was pressed is gone: keep the keyboard where it was, on the line that replaced it.
  useEffect(() => {
    if (before.current === 'ready' && phase !== 'ready' && document.activeElement === document.body) status.current?.focus();
    before.current = phase;
  }, [phase]);

  return (
    <DuskScene
      sky={sky}
      left={<Wordmark />}
      actions={
        <>
          {phase === 'ready' ? (
            <Button variant="dusk" size="lg" className={styles.locate} onClick={onLocate}>
              {t.first.locate}
            </Button>
          ) : (
            <div ref={status} role="status" tabIndex={-1} className={styles.status}>
              <CrossGlyph state="mono" size={20} className={styles.pulse} />
              <p>
                {phase === 'locating' ? t.first.locating : t.first.waiting}
                {phase === 'waiting' && <span className={styles.hint}>{t.first.waitingHint}</span>}
              </p>
            </div>
          )}
          <Button variant="duskText" onClick={onSearch}>
            {t.first.search}
          </Button>
        </>
      }
    >
      <h1 className={styles.headline}>{t.first.headline}</h1>
    </DuskScene>
  );
}
