import Link from 'next/link';
import { notFound } from 'next/navigation';
import { devRoutesEnabled } from '@/lib/dev/enabled';
import { MAP_CITIES, MAP_MOMENTS, MAP_ZOOMS } from '@/lib/dev/mapViews';

const enabled = devRoutesEnabled();
const link = { color: 'var(--link)', textDecoration: 'underline' } as const;

/**
 * Index of the map on real tiles (M4). Developer-facing, in English like /dev/states.
 * Each link opens the results view full screen with MapLibre under it.
 */
export default async function MapIndex({ params }: PageProps<'/[locale]/dev/map'>) {
  if (!enabled) notFound();
  const { locale } = await params;
  const href = (city: string, moment: string, query: string) => `/${locale}/dev/map/${city}-${moment}?${query}`;
  return (
    <main style={{ maxWidth: '62rem', margin: '0 auto', padding: '32px 24px', lineHeight: 1.5 }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 750 }}>The map on real tiles</h1>
      <p style={{ color: 'var(--ink-2)', marginTop: 8 }}>
        MapLibre on OpenFreeMap&apos;s vector tiles in our own style, under the real results view. Fixture pharmacies and fixed moments on 19 Nov 2026.
        These pages call the map tile host, which is why they are not in /dev/states.
      </p>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>The sun and the theme (provisional)</h2>
        <p style={{ color: 'var(--ink-2)' }}>
          The device theme picks light or dark, as everywhere else. The sun never changes the theme: it moves the light on the buildings, and in the
          dark theme it sets how deep the dark is. Each moment below in both themes.
        </p>
        <table style={{ marginTop: 12, borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th style={{ padding: '6px 12px 6px 0' }}>Moment</th>
              {MAP_CITIES.map((city) => (
                <th key={city.id} style={{ padding: '6px 12px 6px 0' }}>
                  {city.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MAP_MOMENTS.map((moment) => (
              <tr key={moment.id} style={{ borderTop: '1px solid var(--hair-2)' }}>
                <td style={{ padding: '8px 12px 8px 0' }}>
                  <strong>{moment.title}</strong>
                  <br />
                  <span style={{ color: 'var(--ink-2)' }}>{moment.note}</span>
                </td>
                {MAP_CITIES.map((city) => (
                  <td key={city.id} style={{ padding: '8px 12px 8px 0', whiteSpace: 'nowrap' }}>
                    <Link href={href(city.id, moment.id, 'theme=light')} style={link}>
                      light
                    </Link>{' '}
                    <Link href={href(city.id, moment.id, 'theme=dark')} style={link}>
                      dark
                    </Link>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Flat from afar, buildings up close</h2>
        <p style={{ color: 'var(--ink-2)' }}>
          Below zoom 15 the map is flat. From 15 the buildings rise, and they stand at full height at 16, lit from the side the sun is on.
        </p>
        <ul style={{ marginTop: 8, display: 'grid', gap: 4 }}>
          {MAP_ZOOMS.map((zoom) => (
            <li key={zoom}>
              Zoom {zoom}:{' '}
              <Link href={href('helsinki', 'noon', `theme=light&z=${zoom}`)} style={link}>
                Helsinki at noon, light
              </Link>{' '}
              <Link href={href('helsinki', 'dusk', `theme=dark&z=${zoom}`)} style={link}>
                at dusk, dark
              </Link>{' '}
              <Link href={href('riga', 'night', `theme=dark&z=${zoom}`)} style={link}>
                Riga at night, dark
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
