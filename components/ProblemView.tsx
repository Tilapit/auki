'use client';

import { useI18n } from '@/lib/i18n/context';
import { rich } from '@/lib/i18n/rich';
import { COUNTRY_CODES } from '@/lib/countries';
import { appleSearchUrl, googleSearchUrl, OSM_ADD_PLACE_URL } from '@/lib/maps';
import { placeLabel } from '@/lib/results';
import type { SkyAt } from '@/lib/sky';
import type { Scene } from '@/lib/types';
import { Button } from './Button';
import { PlaceSearch, PlaceSearchForm, type LocationProblem } from './PlaceSearch';
import { ResultsShell } from './ResultsShell';
import { StaticMap } from './StaticMap';
import styles from './ProblemView.module.css';

type Props =
  /** Location problems land on the place search, with a note that says what happened. */
  | { kind: LocationProblem; sky?: SkyAt; onRetry?: () => void; onSearch?: (query: string) => void }
  /** Data problems keep the map, because the position is known. */
  | { kind: 'none' | 'offline' | 'error'; scene: Scene; onRetry?: () => void; onSearch?: (query: string) => void; onOpenSearch?: () => void }
  /** Outside the covered countries (PLAN.md 7.7). country: its ISO code, where it is known. */
  | { kind: 'notCovered'; scene: Scene; country?: string; onSearch?: (query: string) => void };

const NO_STREETS = new Set<string>();

/** Every problem says what happened and offers a way forward. Errors don't apologise. */
export function ProblemView(props: Props) {
  const { t, f, locale } = useI18n();
  if (!('scene' in props)) {
    return <PlaceSearch problem={props.kind} sky={props.sky} onRetry={props.onRetry} onSearch={props.onSearch} />;
  }
  if (props.kind === 'notCovered') {
    const covered = f.list(COUNTRY_CODES.map((code) => f.countryName(code)).sort((a, b) => a.localeCompare(b, locale)));
    return (
      <ResultsShell
        place={placeLabel(props.scene, locale)}
        emergencyInFooter={false}
        title={t.results.title}
        sheet="static"
        mapLabel={t.map.label}
        map={<StaticMap scene={props.scene} needsStreet={NO_STREETS} userOnly />}
      >
        <section className={styles.problem}>
          <h2 tabIndex={-1} className={styles.title}>
            {t.problem.notCovered.title}
          </h2>
          <p className={styles.body}>
            {props.country && `${t.problem.notCovered.named(f.countryName(props.country))} `}
            {t.problem.notCovered.covered(covered)}
          </p>
          {/* No pharmacy data and no open or closed claims from us here: a map app knows this country. */}
          <p className={styles.body}>
            {rich(t.problem.mapApps, {
              google: <a href={googleSearchUrl(t.problem.mapQuery)}>{t.problem.googleSearch}</a>,
              apple: <a href={appleSearchUrl(t.problem.mapQuery)}>{t.problem.appleSearch}</a>,
            })}
          </p>
          <PlaceSearchForm tone="surface" onSearch={props.onSearch} />
          <p className={styles.emergency}>{rich(t.footer.emergency, { number: <a href="tel:112">112</a> })}</p>
        </section>
      </ResultsShell>
    );
  }
  const copy = t.problem[props.kind];
  return (
    <ResultsShell
      place={placeLabel(props.scene, locale)}
      emergencyInFooter={false}
      title={t.results.title}
      sheet="static"
      mapLabel={t.map.label}
      map={<StaticMap scene={props.scene} needsStreet={NO_STREETS} userOnly />}
    >
      <section className={styles.problem}>
        {/* Focus moves here when the problem appears (PLAN.md section 9). */}
        <h2 tabIndex={-1} className={styles.title}>
          {copy.title}
        </h2>
        <p className={styles.body}>{copy.body}</p>
        {props.kind === 'none' ? (
          <>
            <PlaceSearchForm tone="surface" onSearch={props.onSearch} />
            <p className={styles.body}>
              <a href={OSM_ADD_PLACE_URL}>{t.problem.none.add}</a>
            </p>
          </>
        ) : (
          <div className={styles.actions}>
            <Button variant={props.kind === 'error' ? 'primary' : 'secondary'} onClick={props.onRetry}>
              {t.problem.retry}
            </Button>
            {props.kind === 'error' && <Button onClick={props.onOpenSearch}>{t.first.search}</Button>}
          </div>
        )}
        {props.kind === 'error' && (
          <p className={styles.body}>
            {rich(t.problem.mapApps, {
              google: <a href={googleSearchUrl(t.problem.mapQuery)}>{t.problem.googleSearch}</a>,
              apple: <a href={appleSearchUrl(t.problem.mapQuery)}>{t.problem.appleSearch}</a>,
            })}
          </p>
        )}
        {/* Route, don't resolve: no advice, only the number that works everywhere in the EU. */}
        <p className={styles.emergency}>{rich(t.footer.emergency, { number: <a href="tel:112">112</a> })}</p>
      </section>
    </ResultsShell>
  );
}
