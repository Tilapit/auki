import { MAX_REPORT_BYTES } from '@/lib/reports';
import { reports } from '@/lib/server/reports';

/**
 * Anonymous pharmacy reports (PLAN.md 7.10).
 *
 * POST /api/report: one report, in the body: the pharmacy's id, its country and up to five
 * answers. A body with anything else in it is refused. Nothing here reads who is calling and
 * nothing here writes anything down but the report itself, through the database's own
 * function, which adds the day.
 *
 * GET /api/report?country=FI: what others have told of that country's pharmacies, for those
 * with at least three reports. The address names the country and nothing else, and the answer
 * is the same for everyone, so it may be cached.
 */

export const maxDuration = 10;

const NO_STORE = { 'Cache-Control': 'no-store' };
/** Five minutes in the browser and at the edge: a summary changes when a pharmacy gets a report, not by the second. */
const SHARED = { 'Cache-Control': 'public, max-age=300, s-maxage=300' };

export async function POST(request: Request): Promise<Response> {
  // Only our own pages may send a report: another site can't fill the table through its visitors'
  // browsers. A browser says where a request comes from; a client that says nothing is let through.
  const site = request.headers.get('sec-fetch-site');
  if (site !== null && site !== 'same-origin') return Response.json({ error: 'forbidden' }, { status: 403, headers: NO_STORE });

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_REPORT_BYTES) return Response.json({ error: 'invalid' }, { status: 400, headers: NO_STORE });
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: 'invalid' }, { status: 400, headers: NO_STORE });
  }

  const result = await reports.add(body);
  switch (result.status) {
    case 'stored':
      return Response.json({ stored: true }, { status: 201, headers: NO_STORE });
    case 'invalid':
      return Response.json({ error: 'invalid' }, { status: 400, headers: NO_STORE });
    case 'limit':
      return Response.json({ error: 'limit' }, { status: 429, headers: NO_STORE });
    case 'unavailable':
      return Response.json({ error: result.reason }, { status: 503, headers: NO_STORE });
  }
}

export async function GET(request: Request): Promise<Response> {
  const result = await reports.summaries(new URL(request.url).searchParams.get('country'));
  switch (result.status) {
    case 'ok':
      return Response.json({ summaries: result.summaries }, { headers: SHARED });
    case 'invalid':
      return Response.json({ error: 'invalid' }, { status: 400, headers: NO_STORE });
    case 'unavailable':
      // The app then offers no report and shows none.
      return Response.json({ error: result.reason }, { status: 503, headers: NO_STORE });
  }
}
