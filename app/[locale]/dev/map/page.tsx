import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MAP_CITIES, MAP_PHASES, MAP_VARIANTS } from '@/lib/dev/mapViews';

const enabled = process.env.NODE_ENV !== 'production' || process.env.SPIKE === '1';

/**
 * Index of the map spike (PLAN.md section 11, S1). Developer-facing, in English like /dev/states.
 * Each link opens one map full screen, on real OpenFreeMap tiles with our own style.
 */
export default async function MapSpikeIndex({ params }: PageProps<'/[locale]/dev/map'>) {
  if (!enabled) notFound();
  const { locale } = await params;
  return (
    <main style={{ maxWidth: '60rem', margin: '0 auto', padding: '32px 24px', lineHeight: 1.5 }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 750 }}>Map spike</h1>
      <p style={{ color: 'var(--ink-2)', marginTop: 8 }}>
        MapLibre on OpenFreeMap vector tiles, styled from our tokens. Fixture pharmacies and fixed moments: Helsinki and Riga on 19 Nov 2026. Not
        wired into the app. Add ?font=noto to a map to see OpenFreeMap&apos;s own typeface instead of ours.
      </p>
      {MAP_VARIANTS.map((variant) => (
        <section key={variant.id} style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{variant.title}</h2>
          <p style={{ color: 'var(--ink-2)' }}>{variant.note}</p>
          <ul style={{ marginTop: 8, display: 'grid', gap: 4 }}>
            {MAP_CITIES.flatMap((city) =>
              MAP_PHASES.map((phase) => (
                <li key={`${city}-${phase.id}`}>
                  <Link href={`/${locale}/dev/map/${city}-${variant.id}-${phase.id}`} style={{ color: 'var(--link)', textDecoration: 'underline' }}>
                    {city === 'helsinki' ? 'Helsinki' : 'Riga'}: {phase.title}
                  </Link>
                </li>
              )),
            )}
          </ul>
        </section>
      ))}
    </main>
  );
}
