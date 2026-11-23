import type { Metadata } from 'next';
import { DataPage } from '@/components/DataPage';
import { BRAND } from '@/lib/brand';
import { lowerFirst } from '@/lib/format';
import { getDictionary, isLocale } from '@/lib/i18n';
import { siteMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }: PageProps<'/[locale]/data'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    ...siteMetadata(locale),
    title: `${BRAND}: ${lowerFirst(getDictionary(locale).data.title)}`,
    alternates: { languages: { fi: '/fi/data', en: '/en/data' } },
  };
}

/**
 * The data page (PLAN.md 5 and 7.2): the pipeline's numbers per country. The shell is
 * static; the numbers are read in the browser from the same index.json the search uses,
 * so the page is as fresh as the tiles and needs no rebuild.
 */
export default function Page() {
  return <DataPage />;
}
