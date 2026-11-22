'use client';

import { useId, useState, type FormEvent } from 'react';
import { useI18n } from '@/lib/i18n/context';
import type { SkyAt } from '@/lib/sky';
import { cx } from './cx';
import { Wordmark } from './FirstVisit';
import { DuskScene } from './DuskScene';
import { Icon } from './Icon';
import styles from './PlaceSearch.module.css';

export type LocationProblem = 'denied' | 'unavailable' | 'timeout' | 'unsupported';

interface FormProps {
  /** dusk: on the gradient. surface: inside the results panel. */
  tone?: 'dusk' | 'surface';
  onSearch?: (query: string) => void;
}

/**
 * The search runs on submit only: Nominatim's policy forbids autocomplete (PLAN.md 7.5),
 * so there are no suggestions while typing.
 */
export function PlaceSearchForm({ tone = 'dusk', onSearch }: FormProps) {
  const { t } = useI18n();
  const id = useId();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get('q');
    if (typeof query === 'string' && query.trim()) onSearch?.(query.trim());
  };
  return (
    <form role="search" className={cx(styles.form, styles[tone])} onSubmit={submit}>
      <label htmlFor={id} className="visually-hidden">
        {t.search.label}
      </label>
      <input
        id={id}
        name="q"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        placeholder={t.search.placeholder}
        className={styles.input}
      />
      <button type="submit" className={styles.submit}>
        {t.search.submit}
      </button>
    </form>
  );
}

function LocationNote({ kind, onRetry, stepsOpen = false }: { kind: LocationProblem; onRetry?: () => void; stepsOpen?: boolean }) {
  const { t } = useI18n();
  const id = useId();
  const [open, setOpen] = useState(stepsOpen);
  const copy = t.search[kind];
  return (
    <section className={styles.note} aria-labelledby={`${id}-h`}>
      <span className={styles.noteIcon}>
        <Icon name="locate" size={22} />
      </span>
      <div>
        {/* A real heading, so focus can move here when the problem appears (PLAN.md section 9). */}
        <h2 id={`${id}-h`} tabIndex={-1} className={styles.noteTitle}>
          {copy.title}
        </h2>
        <p className={styles.noteBody}>{copy.body}</p>
        {kind === 'denied' && (
          <>
            <button
              type="button"
              className={styles.noteAction}
              aria-expanded={open}
              aria-controls={`${id}-steps`}
              onClick={() => setOpen(!open)}
            >
              {t.search.how}
            </button>
            <ol id={`${id}-steps`} hidden={!open} className={styles.steps}>
              {t.search.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </>
        )}
        {(kind === 'unavailable' || kind === 'timeout') && (
          <button type="button" className={styles.noteAction} onClick={onRetry}>
            {t.search.retry}
          </button>
        )}
      </div>
    </section>
  );
}

interface Props {
  /** Why the user is here instead of on the map, when location didn't work. */
  problem?: LocationProblem;
  backHref?: string;
  onSearch?: (query: string) => void;
  onRetry?: () => void;
  /** A fixed moment for the sky, for /dev/states and tests. */
  sky?: SkyAt;
  /** Start with the "how to allow location" steps open. */
  stepsOpen?: boolean;
}

/** Place search in the dusk style. Also where every location problem lands, with a note. */
export function PlaceSearch({ problem, backHref, onSearch, onRetry, sky, stepsOpen }: Props) {
  const { t, locale } = useI18n();
  return (
    <DuskScene
      sky={sky}
      skyline="low"
      left={
        problem === 'unsupported' ? (
          <Wordmark />
        ) : (
          <a href={backHref ?? `/${locale}`} aria-label={t.app.back} className={styles.back}>
            <Icon name="back" size={24} />
          </a>
        )
      }
    >
      <div className={styles.column}>
        <h1 className={styles.title}>{t.search.title}</h1>
        <PlaceSearchForm onSearch={onSearch} />
        {problem && <LocationNote kind={problem} onRetry={onRetry} stepsOpen={stepsOpen} />}
      </div>
    </DuskScene>
  );
}
