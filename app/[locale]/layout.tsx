import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible_Next } from 'next/font/google';
import { notFound } from 'next/navigation';
import { SkyScript } from '@/components/SkyScript';
import { isLocale, locales } from '@/lib/i18n';
import { I18nProvider } from '@/lib/i18n/context';
import { siteMetadata } from '@/lib/metadata';
import '../globals.css';

// Self-hosted at build time by next/font: no request to Google from the visitor's browser.
const font = Atkinson_Hyperlegible_Next({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
  // Next has no fallback metrics for this family yet; without this it warns on every build.
  adjustFontFallback: false,
  fallback: ['system-ui', 'sans-serif'],
});

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
    <html lang={locale} className={font.variable} suppressHydrationWarning>
      <head>
        <SkyScript />
      </head>
      <body>
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
