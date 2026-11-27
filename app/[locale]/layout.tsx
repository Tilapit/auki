import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { SkyScript } from '@/components/SkyScript';
import { isLocale, locales } from '@/lib/i18n';
import { I18nProvider } from '@/lib/i18n/context';
import { siteMetadata } from '@/lib/metadata';
import '../globals.css';

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? siteMetadata(locale) : {};
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f8fc' },
    { media: '(prefers-color-scheme: dark)', color: '#071427' },
  ],
};

export default async function RootLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    // The sky script sets style variables on <html> before hydration.
    // No font is loaded: the type is the device's own (globals.css, --font-sans).
    <html lang={locale} suppressHydrationWarning>
      <head>
        <SkyScript />
      </head>
      <body>
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
