import { notFound } from 'next/navigation';
import { isLocale, otherLocale } from '@/lib/i18n';
import { groups, proposals, SIZES, type Size, type Theme, type ViewInfo } from '@/lib/dev/viewList';
import styles from './states.module.css';
import { BRAND } from '@/lib/brand';
import { devRoutesEnabled } from '@/lib/dev/enabled';

const SCALE: Record<Size, number> = { phone: 0.5, desktop: 0.34 };
const ALL_SIZES: Size[] = ['phone', 'desktop'];
const ALL_THEMES: Theme[] = ['light', 'dark'];

function pick<T extends string>(value: string | string[] | undefined, all: T[]): T[] {
  return typeof value === 'string' && (all as string[]).includes(value) ? [value as T] : all;
}

function Frames({ view, locale, sizes, themes }: { view: ViewInfo; locale: string; sizes: Size[]; themes: Theme[] }) {
  const frames = (view.sizes ?? ALL_SIZES)
    .filter((size) => sizes.includes(size))
    .flatMap((size) => {
      const own = view.themes ?? ALL_THEMES;
      const shown = own.length === 1 ? own : own.filter((theme) => themes.includes(theme));
      return shown.map((theme) => ({ size, theme, label: own.length === 1 && !view.themes?.includes('dark') && view.themes ? size : `${size}, ${theme}` }));
    });
  return (
    <div className={styles.frames}>
      {frames.map(({ size, theme, label }) => {
        const { width, height } = SIZES[size];
        const src = `/${locale}/dev/states/${view.id}?theme=${theme}`;
        return (
          <figure key={`${size}-${theme}`} className={styles.figure}>
            <div className={styles.frame} style={{ width: width * SCALE[size], height: height * SCALE[size] }}>
              <iframe
                src={src}
                title={`${view.title} (${label})`}
                width={width}
                height={height}
                loading="lazy"
                style={{ transform: `scale(${SCALE[size]})` }}
              />
            </div>
            <figcaption>
              <a href={src} target="_blank" rel="noreferrer">
                {label}, {width}×{height}
              </a>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

/**
 * Review page: every view and state in light and dark, at 390×844 and 1440×900.
 * Each one is a real page in an iframe, so media queries behave as on a device.
 * Developer-facing, in English. 404 in production.
 */
export default async function States({ params, searchParams }: PageProps<'/[locale]/dev/states'>) {
  if (!devRoutesEnabled()) notFound();
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;
  const sizes = pick(query.size, ALL_SIZES);
  const themes = pick(query.theme, ALL_THEMES);
  const link = (next: { size?: string; theme?: string; locale?: string }) => {
    const size = next.size ?? (sizes.length === 1 ? sizes[0] : 'all');
    const theme = next.theme ?? (themes.length === 1 ? themes[0] : 'all');
    return `/${next.locale ?? locale}/dev/states?size=${size}&theme=${theme}`;
  };
  const current = (active: boolean) => (active ? 'page' : undefined);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>{BRAND}: states</h1>
        <p>
          Fixture data at fixed times: Helsinki on Thu 19 Nov 2026 at 20.41, Riga on Fri 20 Nov at 23.40, stress data on Tue 17 Nov at 13.15. Nothing
          here reads the clock or calls a service. The map is a placeholder until M4.
        </p>
        <nav className={styles.filters} aria-label="Filters">
          <span>
            Size:{' '}
            {['all', ...ALL_SIZES].map((size) => (
              <a key={size} href={link({ size })} aria-current={current(size === (sizes.length === 1 ? sizes[0] : 'all'))}>
                {size}
              </a>
            ))}
          </span>
          <span>
            Theme:{' '}
            {['all', ...ALL_THEMES].map((theme) => (
              <a key={theme} href={link({ theme })} aria-current={current(theme === (themes.length === 1 ? themes[0] : 'all'))}>
                {theme}
              </a>
            ))}
          </span>
          <span>
            Language:{' '}
            <a href={link({})} aria-current="page">
              {locale}
            </a>
            <a href={link({ locale: otherLocale(locale) })}>{otherLocale(locale)}</a>
          </span>
        </nav>
        <nav className={styles.toc} aria-label="Sections">
          <a href="#proposals">Proposals</a>
          {groups.map((group) => (
            <a key={group.id} href={`#${group.id}`}>
              {group.title}
            </a>
          ))}
        </nav>
      </header>

      <section id="proposals" className={styles.group}>
        <h2>Proposals: current and proposed side by side</h2>
        <p className={styles.note}>
          {proposals.length > 0
            ? 'Each of these waits for a decision. The default everywhere else is the current version.'
            : 'No open proposals. Decided ones are in DESIGN-LOG.md.'}
        </p>
        {proposals.map((proposal) => (
          <article key={proposal.id} className={styles.proposal}>
            <h3>{proposal.title}</h3>
            <p className={styles.note}>{proposal.reason}</p>
            <div className={styles.pair}>
              {[proposal.current, proposal.proposed].map((view) => (
                <div key={view.id}>
                  <p className={styles.viewTitle}>{view.title}</p>
                  <Frames view={view} locale={locale} sizes={ALL_SIZES} themes={ALL_THEMES} />
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      {groups.map((group) => (
        <section key={group.id} id={group.id} className={styles.group}>
          <h2>{group.title}</h2>
          {group.note && <p className={styles.note}>{group.note}</p>}
          {group.views.map((view) => (
            <article key={view.id} className={styles.view}>
              <h3 className={styles.viewTitle}>
                {view.title} <code>{view.id}</code>
              </h3>
              {view.note && <p className={styles.note}>{view.note}</p>}
              <Frames view={view} locale={locale} sizes={sizes} themes={themes} />
            </article>
          ))}
        </section>
      ))}
    </main>
  );
}
