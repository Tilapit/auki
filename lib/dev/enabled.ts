/**
 * Whether the /dev pages exist. Always in development; never in a production build, where
 * they are a 404. DEV_ROUTES=1 keeps them in a build on purpose: CI uses it to run the
 * Playwright tests against a production server, which is several times faster than the
 * dev server. A deployment never sets it.
 */
export function devRoutesEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.NODE_ENV !== 'production' || env.DEV_ROUTES === '1';
}
