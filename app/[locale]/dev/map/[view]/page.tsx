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
 * theme, ?z= sets the map's zoom and ?sheet=expanded opens the phone's sheet. ?px=3 lets the
 * map draw every device pixel of a phone's screen, as it did before it was limited to two per
 * CSS pixel: to compare the two on a real phone. ?touch=maplibre leaves the map under a finger
 * as MapLibre has it, its own glide after a flick (ours is lib/map/glide.ts) and its own
 * direction for the one-finger zoom: for the same.
 */
export default async function MapPreviewPage({ params, searchParams }: PageProps<'/[locale]/dev/map/[view]'>) {
  if (!enabled) notFound();
  const { view: id } = await params;
  const { theme, z, sheet, px, touch } = await searchParams;
  const view = mapViews.find((candidate) => candidate.id === id);
  if (!view) notFound();
  const forced = theme === 'light' || theme === 'dark' ? theme : undefined;
  const zoom = typeof z === 'string' && Number.isFinite(Number(z)) ? Number(z) : undefined;
  const pixels = typeof px === 'string' && Number(px) >= 1 && Number(px) <= 4 ? Number(px) : undefined;
  return (
    <div data-theme={forced} style={{ minHeight: '100dvh' }}>
      <MapPreview view={view} zoom={zoom} sheet={sheet === 'expanded' ? 'expanded' : 'peek'} pixels={pixels} plainTouch={touch === 'maplibre'} />
    </div>
  );
}
