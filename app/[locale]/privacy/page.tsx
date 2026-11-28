import type { Metadata } from 'next';
import { PrivacyPage } from '@/components/PrivacyPage';
import { BRAND } from '@/lib/brand';
import { lowerFirst } from '@/lib/format';
import { getDictionary, isLocale } from '@/lib/i18n';
import { siteMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }: PageProps<'/[locale]/privacy'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    ...siteMetadata(locale),
    title: `${BRAND}: ${lowerFirst(getDictionary(locale).privacy.title)}`,
    alternates: { languages: { fi: '/fi/privacy', en: '/en/privacy' } },
  };
}

/**
 * "What the app sends" (PLAN.md 5 and 7.6): every request the app makes, from the list the
 * Content-Security-Policy and the privacy test are built from, and what the device keeps.
 * Static, and it asks for nothing but its own files.
 */
export default function Page() {
  return <PrivacyPage />;
}
