import { geocode, isLanguage } from '@/lib/server/geocode';

/**
 * GET /api/geocode?q=Kamppi&lang=fi: one place for a typed name (PLAN.md 7.5).
 * Carries the text the user typed and nothing else. Nothing is logged.
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('lang');
  const result = await geocode(searchParams.get('q'), isLanguage(lang) ? lang : 'en');

  switch (result.status) {
    case 'found':
    case 'none':
      // The same name gives the same place for a day, so the CDN can answer for us and for Nominatim.
      return Response.json(
        { place: result.status === 'found' ? result.place : null },
        { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800' } },
      );
    case 'invalid':
      return Response.json({ error: 'invalid' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    case 'unavailable':
      return Response.json({ error: result.reason }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
