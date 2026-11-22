import { notFound } from 'next/navigation';
import { allViews } from '@/lib/dev/viewList';
import { renderers } from '@/lib/dev/views';

/** Nothing under /dev exists in production: no params are generated and the page is a 404. */
export function generateStaticParams() {
  if (process.env.NODE_ENV === 'production') return [];
  return allViews.map((view) => ({ view: view.id }));
}

/**
 * One view, full screen, from fixtures. ?theme=light|dark overrides the device theme
 * through data-theme; without it the view follows prefers-color-scheme.
 */
export default async function StateView({ params, searchParams }: PageProps<'/[locale]/dev/states/[view]'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { view } = await params;
  const { theme } = await searchParams;
  const render = renderers[view];
  if (!render) notFound();
  const forced = theme === 'light' || theme === 'dark' ? theme : undefined;
  return (
    <div data-theme={forced} style={{ minHeight: '100dvh' }}>
      {render()}
    </div>
  );
}
