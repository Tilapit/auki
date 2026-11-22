import Link from 'next/link';
import { getDictionary } from '@/lib/i18n';

/** not-found doesn't receive the locale, so it says it in both languages. */
export default function NotFound() {
  const fi = getDictionary('fi');
  const en = getDictionary('en');
  return (
    <main style={{ padding: '48px 20px', maxWidth: 560 }}>
      <h1 style={{ fontSize: '1.65625rem', fontWeight: 750, lineHeight: 1.2 }}>
        <span lang="fi">{fi.notFound.title}</span>
        <br />
        <span lang="en">{en.notFound.title}</span>
      </h1>
      <p style={{ marginTop: 16 }}>
        <Link href="/fi" lang="fi">
          {fi.notFound.home}
        </Link>
        {' / '}
        <Link href="/en" lang="en">
          {en.notFound.home}
        </Link>
      </p>
    </main>
  );
}
