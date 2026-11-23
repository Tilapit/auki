import { networkInterfaces } from 'node:os';
import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';
import { securityHeaders } from './lib/requests';

/**
 * Hosts allowed to load dev-only assets, so the dev server can be opened from a phone on
 * the same network: this machine's own LAN addresses and its .local name. Read at start-up,
 * never hard-coded, and used by `next dev` only.
 */
function lanHosts(): string[] {
  const addresses = Object.values(networkInterfaces())
    .flat()
    .filter((net) => net && net.family === 'IPv4' && !net.internal)
    .map((net) => net!.address);
  return [...addresses, '*.local'];
}

/**
 * Where the pharmacy tiles are published (PLAN.md 7.2, decision D7). The app serves them
 * under its own origin, so the browser talks to one host. In development, without
 * TILES_ORIGIN, they come from `npm run data:serve` on this machine.
 */
function tilesOrigin(phase: string): string | undefined {
  const origin = process.env.TILES_ORIGIN?.replace(/\/+$/, '');
  return origin || (phase === PHASE_DEVELOPMENT_SERVER ? 'http://localhost:3900' : undefined);
}

export default function config(phase: string): NextConfig {
  const tiles = tilesOrigin(phase);
  return {
    rewrites: async () => (tiles ? [{ source: '/tiles/:path*', destination: `${tiles}/tiles/:path*` }] : []),
    // The security headers of PLAN.md 7.6, on every response. The policy is built from the
    // one list of requests the app may make (lib/requests.ts).
    headers: async () => [
      {
        source: '/:path*',
        headers: securityHeaders({ development: phase === PHASE_DEVELOPMENT_SERVER, devRoutes: phase === PHASE_DEVELOPMENT_SERVER || process.env.DEV_ROUTES === '1' }),
      },
    ],
    // One set of agent instructions lives in CLAUDE.md, so Next doesn't write AGENTS.md.
    agentRules: false,
    // The dev badge would sit on top of the footer in the /dev/states screenshots.
    devIndicators: false,
    ...(phase === PHASE_DEVELOPMENT_SERVER ? { allowedDevOrigins: lanHosts() } : {}),
  };
}
