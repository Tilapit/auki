import { MAX_BODY_BYTES, walking } from '@/lib/server/routing';

/**
 * POST /api/walking: walking times from a position to up to twenty pharmacies, or, with
 * `route`, the walking route to one of them (PLAN.md 7.1, steps 4 and 7).
 *
 * This is the only request that carries the position (PLAN.md 7.6). It is in the body, never
 * in the address, so it is in no access log; the answer is never cached; and nothing here
 * writes anything down. openrouteservice gets the positions from our server and nothing
 * about who asked.
 *
 * GET /api/walking: the wake-up. The app sends it when it starts looking for a position, so
 * that this function has started by the time the position is known (lib/walking.ts,
 * `wakesNow`). It carries nothing, asks nobody, and is answered with nothing. A browser's GET
 * has no body to put a position in; one with anything in its address is refused here, and the
 * privacy test fails if the app ever sends such a one.
 */

/** Our own waits are 1.3 s and 4 s. This is the platform's stop for a call that somehow outlives them. */
export const maxDuration = 10;

const NO_STORE = { 'Cache-Control': 'no-store' };

/**
 * Only our own pages may ask: another site can't spend the day's budget through its visitors'
 * browsers. A browser says where a request comes from; a client that says nothing is let through.
 */
function fromElsewhere(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site');
  return site !== null && site !== 'same-origin';
}

const forbidden = (): Response => Response.json({ error: 'forbidden' }, { status: 403, headers: NO_STORE });

const invalid = (): Response => Response.json({ error: 'invalid' }, { status: 400, headers: NO_STORE });

export function GET(request: Request): Response {
  // Reading the request is also what makes this an answer of the moment: Next never writes it at build time.
  if (fromElsewhere(request)) return forbidden();
  // Nothing rides in the address: the position has one way out, and this is not it.
  if (new URL(request.url).search !== '') return invalid();
  return new Response(null, { status: 204, headers: NO_STORE });
}

export async function POST(request: Request): Promise<Response> {
  if (fromElsewhere(request)) return forbidden();

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return invalid();
    body = JSON.parse(text);
  } catch {
    return invalid();
  }

  const result = await walking(body);
  switch (result.status) {
    case 'walks':
      return Response.json({ walks: result.walks }, { headers: NO_STORE });
    case 'route':
      return Response.json({ walks: result.walks, line: result.line }, { headers: NO_STORE });
    case 'invalid':
      return invalid();
    case 'unavailable':
      // The app then shows straight-line distances, and says that it does.
      return Response.json({ error: result.reason }, { status: 503, headers: NO_STORE });
  }
}
