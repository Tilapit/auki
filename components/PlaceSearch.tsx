'use client';

import { useEffect, useId, useRef, useState, type FormEvent, type RefObject } from 'react';
import { useI18n } from '@/lib/i18n/context';
import type { SkyAt } from '@/lib/sky';
import type { Lookup } from '@/lib/state';
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
  /** A lookup is under way. */
  busy?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
}

/**
 * The search runs on submit only: Nominatim's policy forbids autocomplete (PLAN.md 7.5),
 * so there are no suggestions while typing.
 */
export function PlaceSearchForm({ tone = 'dusk', onSearch, busy, inputRef }: FormProps) {
  const { t } = useI18n();
  const id = useId();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get('q');
    if (typeof query === 'string' && query.trim()) onSearch?.(query.trim());
  };
  return (
    <form role="search" aria-busy={busy || undefined} className={cx(styles.form, styles[tone])} onSubmit={submit}>
      <label htmlFor={id} className="visually-hidden">
        {t.search.label}
      </label>
      <input
        ref={inputRef}
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

interface NoteProps {
  kind: LocationProblem;
  onRetry?: () => void;
  stepsOpen?: boolean;
  headingRef?: RefObject<HTMLHeadingElement | null>;
}

function LocationNote({ kind, onRetry, stepsOpen = false, headingRef }: NoteProps) {
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
        <h2 ref={headingRef} id={`${id}-h`} tabIndex={-1} className={styles.noteTitle}>
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

/** What the last place search came to, when it didn't find the place. */
function LookupNote({ lookup, headingRef }: { lookup: Extract<Lookup, { status: 'notFound' | 'failed' }>; headingRef: RefObject<HTMLHeadingElement | null> }) {
  const { t } = useI18n();
  const id = useId();
  const copy =
    lookup.status === 'notFound'
      ? { title: t.search.notFound.title(lookup.query), body: t.search.notFound.body }
      : lookup.offline
        ? t.search.offline
        : t.search.failed;
  return (
    <section className={cx(styles.note, styles.plain)} aria-labelledby={`${id}-h`}>
      <div>
        <h2 ref={headingRef} id={`${id}-h`} tabIndex={-1} className={styles.noteTitle}>
          {copy.title}
        </h2>
        <p className={styles.noteBody}>{copy.body}</p>
      </div>
    </section>
  );
}

interface Props {
  /** Why the user is here instead of on the map, when location didn't work. */
  problem?: LocationProblem;
  /** The lookup of the name that was submitted. */
  lookup?: Lookup;
  backHref?: string;
  /** Goes back without loading the page again. The link's address is the fallback. */
  onBack?: () => void;
  onSearch?: (query: string) => void;
  onRetry?: () => void;
  /** In the real flow the view takes focus when it opens: the note if something went wrong, otherwise the field. */
  takeFocus?: boolean;
  /** A fixed moment for the sky, for /dev/states and tests. */
  sky?: SkyAt;
  /** Start with the "how to allow location" steps open. */
  stepsOpen?: boolean;
}

/** Place search in the dusk style. Also where every location problem lands, with a note. */
export function PlaceSearch({ problem, lookup, backHref, onBack, onSearch, onRetry, takeFocus, sky, stepsOpen }: Props) {
  const { t, locale } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const problemHeading = useRef<HTMLHeadingElement>(null);
  const lookupHeading = useRef<HTMLHeadingElement>(null);
  const status = lookup?.status ?? 'idle';
  const answered = lookup && (lookup.status === 'notFound' || lookup.status === 'failed') ? lookup : undefined;

  useEffect(() => {
    if (!takeFocus) return;
    if (problem) problemHeading.current?.focus();
    else input.current?.focus();
    // Only when the view opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A search that found nothing says so where the keyboard and the screen reader are.
  // Only when the answer arrives: a view that opens with one already there leaves focus alone.
  const before = useRef(status);
  useEffect(() => {
    if (before.current !== status && (status === 'notFound' || status === 'failed')) lookupHeading.current?.focus();
    before.current = status;
  }, [status]);

  return (
    <DuskScene
      sky={sky}
      skyline="low"
      left={
        problem === 'unsupported' ? (
          <Wordmark />
        ) : (
          <a
            href={backHref ?? `/${locale}`}
            aria-label={t.app.back}
            className={styles.back}
            onClick={(event) => {
              if (!onBack) return;
              event.preventDefault();
              onBack();
            }}
          >
            <Icon name="back" size={24} />
          </a>
        )
      }
    >
      <div className={styles.column}>
        <h1 className={styles.title}>{t.search.title}</h1>
        <PlaceSearchForm onSearch={onSearch} busy={status === 'pending'} inputRef={input} />
        {status === 'pending' && (
          <p role="status" className={styles.finding}>
            {t.search.finding}
          </p>
        )}
        {/* The latest thing that happened is the one shown: the search's answer, else the location problem. */}
        {answered ? (
          <LookupNote lookup={answered} headingRef={lookupHeading} />
        ) : (
          problem && status !== 'pending' && <LocationNote kind={problem} onRetry={onRetry} stepsOpen={stepsOpen} headingRef={problemHeading} />
        )}
      </div>
    </DuskScene>
  );
}
