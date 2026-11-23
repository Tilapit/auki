import { notFound } from 'next/navigation';
import { MapSpike } from '@/components/dev/MapSpike';
import { devRoutesEnabled } from '@/lib/dev/enabled';
import { mapViews } from '@/lib/dev/mapViews';

/** Nothing under /dev exists in production. DEV_ROUTES=1 keeps it in a build, to measure the map there. */
const enabled = devRoutesEnabled();

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
