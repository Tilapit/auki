import { networkInterfaces } from 'node:os';
import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

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

export default function config(phase: string): NextConfig {
  return {
    // One set of agent instructions lives in CLAUDE.md, so Next doesn't write AGENTS.md.
    agentRules: false,
    // The dev badge would sit on top of the footer in the /dev/states screenshots.
    devIndicators: false,
    ...(phase === PHASE_DEVELOPMENT_SERVER ? { allowedDevOrigins: lanHosts() } : {}),
  };
}
