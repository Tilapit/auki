import { notFound } from 'next/navigation';
import { MapSpike } from '@/components/dev/MapSpike';
import { mapViews } from '@/lib/dev/mapViews';

/** Nothing under /dev exists in production. SPIKE=1 keeps this one in a build, to measure it there. */
const enabled = process.env.NODE_ENV !== 'production' || process.env.SPIKE === '1';

export function generateStaticParams() {
  return enabled ? mapViews.map((view) => ({ view: view.id })) : [];
}

/** One map, full screen. ?font=noto swaps our typeface for OpenFreeMap's, to compare. */
export default async function MapSpikeView({ params, searchParams }: PageProps<'/[locale]/dev/map/[view]'>) {
  if (!enabled) notFound();
  const { view: id } = await params;
  const { font } = await searchParams;
  const view = mapViews.find((candidate) => candidate.id === id);
  if (!view) notFound();
  return <MapSpike view={view} font={font === 'noto' ? 'noto' : 'own'} />;
}
