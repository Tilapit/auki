/**
 * Gates per country, before anything is published (PLAN.md 7.2, step 4). They catch a
 * truncated answer or a parser regression before users do. A country that fails keeps the
 * data it had.
 */

import type { CountryStats } from '../lib/tiles.ts';

/** The count may move this much against the last published run. */
export const COUNT_TOLERANCE = 0.2;
/** The parse rate may fall this much against the last published run. */
export const PARSE_RATE_DROP = 0.02;

export type Verdict = { ok: true } | { ok: false; reason: string };

const percent = (share: number): string => `${(share * 100).toFixed(1)} %`;

export function check(stats: CountryStats, previous: CountryStats | undefined): Verdict {
  if (stats.pharmacies === 0) return { ok: false, reason: 'no pharmacies' };
  // Nothing to compare with on a first run.
  if (!previous || previous.pharmacies === 0) return { ok: true };

  const change = (stats.pharmacies - previous.pharmacies) / previous.pharmacies;
  if (Math.abs(change) > COUNT_TOLERANCE) {
    return { ok: false, reason: `${stats.pharmacies} pharmacies, ${previous.pharmacies} in the last run: a change of ${percent(change)}, more than ${percent(COUNT_TOLERANCE)}` };
  }
  if (stats.parseRate < previous.parseRate - PARSE_RATE_DROP) {
    return { ok: false, reason: `parse rate ${percent(stats.parseRate)}, ${percent(previous.parseRate)} in the last run: a drop of more than ${percent(PARSE_RATE_DROP)}` };
  }
  return { ok: true };
}

/** Counts for index.json and the data page. */
export function statsOf(generated: number, hours: { kind: string }[], corrected: number): CountryStats {
  const pharmacies = hours.length;
  const count = (kind: string) => hours.filter((h) => h.kind === kind).length;
  const withHours = pharmacies - count('missing');
  const parsed = count('parsed');
  const round = (value: number) => Math.round(value * 10000) / 10000;
  return {
    generated,
    pharmacies,
    withHours,
    parsed,
    unparseable: count('unparseable'),
    uncertain: count('uncertain'),
    corrected,
    shareWithHours: pharmacies === 0 ? 0 : round(withHours / pharmacies),
    parseRate: withHours === 0 ? 0 : round(parsed / withHours),
  };
}
