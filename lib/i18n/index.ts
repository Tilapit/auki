import { formatters, type Formatters } from '../format';
import en from './en';
import fi from './fi';

export const locales = ['fi', 'en'] as const;
export type Locale = (typeof locales)[number];
export type Dictionary = typeof fi;

const dictionaries: Record<Locale, Dictionary> = { fi, en };

export const isLocale = (value: string): value is Locale => (locales as readonly string[]).includes(value);
export const otherLocale = (locale: Locale): Locale => (locale === 'fi' ? 'en' : 'fi');
export const getDictionary = (locale: Locale): Dictionary => dictionaries[locale];

export interface I18n {
  locale: Locale;
  t: Dictionary;
  f: Formatters;
}

export function makeI18n(locale: Locale): I18n {
  return { locale, t: getDictionary(locale), f: formatters(locale) };
}

/**
 * Picks /fi or /en from an Accept-Language header.
 * Finnish only when the browser ranks it above English; everyone else gets English.
 */
export function pickLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return 'en';
  const ranked = acceptLanguage
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      const weight = q ? Number(q.slice(2)) : 1;
      return { lang: tag.toLowerCase().split('-')[0], weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter((entry) => entry.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  for (const { lang } of ranked) {
    if (isLocale(lang)) return lang;
  }
  return 'en';
}
