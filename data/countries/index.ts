/**
 * The country guide as the app reads it (PLAN.md section 8): for a pharmacy's country, what
 * the "Resepti Suomesta?" banner says and what the counter card shows. Nothing for Finland,
 * and nothing for a country without an entry: the banner is then simply not there.
 */

import type { CardPhrases, CountryInfo } from '../../lib/types';
import { GUIDES } from './guides.ts';
import { PHRASES, linesFor } from './phrases.ts';

export { GUIDES } from './guides.ts';
export { ENGLISH, PHRASES } from './phrases.ts';

export interface Abroad {
  country: CountryInfo;
  card: CardPhrases;
}

const BY_CODE = new Map(GUIDES.map((guide) => [guide.code, guide]));

export function abroadFor(code: string | undefined): Abroad | undefined {
  const guide = code ? BY_CODE.get(code) : undefined;
  const language = guide && PHRASES[guide.language];
  if (!guide || !language) return undefined;
  const variants: CardPhrases['variants'] = {};
  for (const variant of guide.variants) {
    const lines = linesFor(language, variant);
    if (lines) variants[variant] = lines;
  }
  const { code: country, inCountry, inLanguage, status, tip, field, source } = guide;
  return {
    country: { code: country, inCountry, inLanguage, status, tip, ...(field ? { field } : {}), source },
    card: { lang: language.lang, reviewed: language.reviewed, variants, pharmacist: { local: language.pharmacist, english: 'Could a pharmacist help me with this?' } },
  };
}
