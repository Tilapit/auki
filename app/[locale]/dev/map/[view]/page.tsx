import { notFound } from 'next/navigation';
import { MapPreview } from '@/components/dev/MapPreview';
import { devRoutesEnabled } from '@/lib/dev/enabled';
import { mapViews } from '@/lib/dev/mapViews';

/** Nothing under /dev exists in production. DEV_ROUTES=1 keeps it in a build, to measure the map there. */
const enabled = devRoutesEnabled();

export function generateStaticParams() {
  return enabled ? mapViews.map((view) => ({ view: view.id })) : [];
}

/**
 * One results view on real map tiles, full screen. ?theme=light|dark overrides the device
 * theme, ?z= sets the map's zoom and ?sheet=expanded opens the phone's sheet.
 */
export default async function MapPreviewPage({ params, searchParams }: PageProps<'/[locale]/dev/map/[view]'>) {
  if (!enabled) notFound();
  const { view: id } = await params;
  const { theme, z, sheet } = await searchParams;
  const view = mapViews.find((candidate) => candidate.id === id);
  if (!view) notFound();
  const forced = theme === 'light' || theme === 'dark' ? theme : undefined;
  const zoom = typeof z === 'string' && Number.isFinite(Number(z)) ? Number(z) : undefined;
  return (
    <div data-theme={forced} style={{ minHeight: '100dvh' }}>
      <MapPreview view={view} zoom={zoom} sheet={sheet === 'expanded' ? 'expanded' : 'peek'} />
    </div>
  );
}
