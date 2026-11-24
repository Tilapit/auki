import { MAX_BODY_BYTES, walking } from '@/lib/server/routing';

/**
 * POST /api/walking: walking times from a position to up to twenty pharmacies, or, with
 * `route`, the walking route to one of them (PLAN.md 7.1, steps 4 and 7).
 *
 * This is the only request that carries the position (PLAN.md 7.6). It is in the body, never
 * in the address, so it is in no access log; the answer is never cached; and nothing here
 * writes anything down. openrouteservice gets the positions from our server and nothing
 * about who asked.
 */

/** Our own waits are 1.3 s and 4 s. This is the platform's stop for a call that somehow outlives them. */
export const maxDuration = 10;

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function POST(request: Request): Promise<Response> {
  // Only our own pages may ask: another site can't spend the day's budget through its visitors'
  // browsers. A browser says where a request comes from; a client that says nothing is let through.
  const site = request.headers.get('sec-fetch-site');
  if (site !== null && site !== 'same-origin') return Response.json({ error: 'forbidden' }, { status: 403, headers: NO_STORE });

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return Response.json({ error: 'invalid' }, { status: 400, headers: NO_STORE });
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: 'invalid' }, { status: 400, headers: NO_STORE });
  }

  const result = await walking(body);
  switch (result.status) {
    case 'walks':
      return Response.json({ walks: result.walks }, { headers: NO_STORE });
    case 'route':
      return Response.json({ walks: result.walks, line: result.line }, { headers: NO_STORE });
    case 'invalid':
      return Response.json({ error: 'invalid' }, { status: 400, headers: NO_STORE });
    case 'unavailable':
      // The app then shows straight-line distances, and says that it does.
      return Response.json({ error: result.reason }, { status: 503, headers: NO_STORE });
  }
}
