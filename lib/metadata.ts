import type { Metadata } from 'next';
import { getDictionary, type Locale } from './i18n';

/** Title and description for a locale. The name in the title comes from lib/brand.ts through the dictionary. */
export function siteMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale);
  return {
    title: t.meta.title,
    description: t.meta.description,
    alternates: { languages: { fi: '/fi', en: '/en' } },
    // Not for search engines before the launch (M7).
    robots: { index: false, follow: false },
  };
}
