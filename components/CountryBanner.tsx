'use client';

import { useId, useState } from 'react';
import { OTHER, REQUIRED, SOURCES, guideFor, homeOf, homesFor, type Guide, type Note, type Source, type SourceId } from '@/data/countries';
import { useHome } from '@/lib/home';
import { useI18n } from '@/lib/i18n/context';
import { rich } from '@/lib/i18n/rich';
import { Icon } from './Icon';
import styles from './CountryBanner.module.css';

interface Props {
  /** The country the prescription is from, or undefined while the device suggests none. */
  home: string | undefined;
  onHome: (code: string) => void;
  /** What the official pages say of that country's prescriptions here. Undefined while the home country is not known. */
  guide: Guide | undefined;
  /** /dev/states only: the details open from the start. */
  open?: boolean;
}

/**
 * "Resepti kotimaasta?" A section of the card wherever the prescription's country is not the
 * pharmacy's (PLAN.md section 8), also in Finland for a visitor.
 *
 * - The country the prescription is from, as the browser suggests it, in a control that
 *   changes it. Nobody is asked: the control is there for whoever the guess is wrong for.
 * - Two answers, each one sentence: the electronic prescription and the paper one. Each is
 *   what an official page says of this pair of countries, or says plainly that none was found.
 * - What the research trip met at this country's counters, under a label that says it was
 *   with prescriptions from Finland: what a few pharmacies did on one day, not a rule.
 * - Behind one button: the conditions, what a paper prescription has to show, and every
 *   source with the date of its page and the day it was read.
 */
export function CountryBanner({ home, onHome, guide, open = false }: Props) {
  const { t, f, locale } = useI18n();
  const id = useId();
  const [more, setMore] = useState(open);
  const known = home === OTHER || homeOf(home) !== undefined;
  const notes: Note[] = guide ? [...guide.ePrescription.notes, ...guide.paper.notes] : [];
  const sources: SourceId[] = guide ? [...new Set([...guide.ePrescription.sources, ...guide.paper.sources, ...notes.map((note) => note.source)])] : [];
  const read = sources.map((source) => SOURCES[source].checked).sort().at(-1);

  return (
    <section className={styles.banner} aria-labelledby={`${id}-h`}>
      <span className={styles.icon}>
        <Icon name="document" size={24} />
      </span>
      <div className={styles.body}>
        <h2 id={`${id}-h`} className={styles.title}>
          {t.banner.title}
        </h2>

        <p className={styles.home}>
          <label htmlFor={`${id}-home`}>{t.banner.home}</label>
          <select id={`${id}-home`} className={styles.select} value={known ? home : ''} onChange={(event) => onHome(event.target.value)}>
            {!known && (
              <option value="" disabled>
                {t.banner.choose}
              </option>
            )}
            {homesFor(locale).map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.name[locale]}
              </option>
            ))}
            <option value={OTHER}>{t.banner.other}</option>
          </select>
        </p>

        {!guide && <p className={styles.text}>{t.banner.ask}</p>}

        {guide && (
          <>
            <dl className={styles.answers}>
              <div>
                <dt>{t.banner.electronic}</dt>
                <dd>{guide.ePrescription.text[locale]}</dd>
              </div>
              <div>
                <dt>{t.banner.paper}</dt>
                <dd>{guide.paper.text[locale]}</dd>
              </div>
            </dl>

            {guide.field && (
              <p className={styles.field}>
                <span className={styles.fieldLabel}>{t.banner.field}</span> {guide.field[locale]}
              </p>
            )}

            <p className={styles.tip}>{t.banner.pharmacist}</p>

            <button type="button" className={styles.more} aria-expanded={more} aria-controls={`${id}-more`} onClick={() => setMore(!more)}>
              {t.banner.more}
              <Icon name={more ? 'minus' : 'plus'} size={16} />
            </button>

            <div id={`${id}-more`} hidden={!more} className={styles.details}>
              {notes.map((note) => (
                <p key={note.text.en}>{note.text[locale]}</p>
              ))}
              {guide.paper.status === 'recognised' && (
                <>
                  <p>{t.banner.required}</p>
                  <ul className={styles.required}>
                    {REQUIRED.map((item) => (
                      <li key={item.en}>{item[locale]}</li>
                    ))}
                  </ul>
                </>
              )}
              <h3 className={styles.sourcesTitle}>{t.banner.sources}</h3>
              <ul className={styles.sources}>
                {sources.map((source) => {
                  const { label, url, updated, checked }: Source = SOURCES[source];
                  return (
                    <li key={source}>
                      <a href={url[locale]}>{label[locale]}</a>
                      {'. '}
                      {updated ? rich(t.banner.pageDated, { updated: f.date(updated), checked: f.date(checked) }) : rich(t.banner.pageRead, { checked: f.date(checked) })}
                    </li>
                  );
                })}
              </ul>
            </div>

            {!more && read && <p className={styles.source}>{rich(t.banner.read, { date: f.date(read) })}</p>}
          </>
        )}
      </div>
    </section>
  );
}

/** /dev/states only: the banner for one pair, outside a results view. The country can be changed while the view is open; nothing is kept. */
export function BannerFor({ home: first, here, open }: { home: string | null; here: string; open?: boolean }) {
  const { locale } = useI18n();
  const [home, setHome] = useHome(locale, first);
  return <CountryBanner home={home} onHome={setHome} guide={guideFor(home, here)} open={open} />;
}
