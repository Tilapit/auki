'use client';

import { useEffect, useState } from 'react';
import type { Pharmacy } from '@/lib/types';
import { WALKING_PATH, readLine, routeLine, walkingBody, type Line } from '@/lib/walking';

/** Gives the walking route to a pharmacy as a line, or undefined when there is none to give. */
export type RouteFor = (pharmacy: Pharmacy) => Promise<Line | undefined>;

/** A route line is not waited for by anything: it has this long to come. */
const ROUTE_WAIT_MS = 6000;
/** A route that didn't come is asked for once more, the next time its pharmacy is selected, and then no more. */
const ROUTE_TRIES = 2;

/**
 * The walking route from a position to a pharmacy: the same request as the walking times,
 * with `route` set, so the position has one way out (PLAN.md 7.6). The line is joined to
 * the position and to the pharmacy, as the map draws it.
 */
async function askRoute(from: { lat: number; lon: number }, to: { lat: number; lon: number }): Promise<Line | undefined> {
  if (navigator.onLine === false) return undefined;
  try {
    const response = await fetch(WALKING_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: walkingBody(from, [to], true),
      signal: AbortSignal.timeout(ROUTE_WAIT_MS),
    });
    if (!response.ok) return undefined;
    const line = readLine(await response.json());
    return line && routeLine(from, line, to);
  } catch {
    return undefined;
  }
}

/**
 * The routes from one position, each asked for once: selecting the same pharmacy again costs
 * no request, and the day's budget for routes is spent on new ones only. A new position, from
 * a new search or after a walk, gets a new one of these.
 */
export function routesFrom(from: { lat: number; lon: number }): RouteFor {
  const asked = new Map<string, { tries: number; got: boolean; line: Promise<Line | undefined> }>();
  return (pharmacy) => {
    const entry = asked.get(pharmacy.id) ?? { tries: 0, got: false, line: Promise.resolve<Line | undefined>(undefined) };
    if (entry.got || entry.tries >= ROUTE_TRIES) return entry.line;
    entry.tries += 1;
    // After the try before this one, if there was one and it is still on its way.
    entry.line = entry.line
      .then((line) => line ?? askRoute(from, pharmacy))
      .then((line) => {
        if (line) entry.got = true;
        return line;
      });
    asked.set(pharmacy.id, entry);
    return entry.line;
  };
}

/** A selection has to hold this long before its route is asked for: stepping through the list asks for one, not for every row passed. */
const ROUTE_DELAY_MS = 250;

/**
 * The walking route to one pharmacy (PLAN.md 7.1, step 7), for the map to draw. It is asked
 * for only while there is a target, and the line of an earlier target is never shown for a
 * later one. Without `routeFor` nothing is asked: /dev/states calls no service.
 */
export function useRouteLine(routeFor: RouteFor | undefined, target: Pharmacy | undefined): Line | undefined {
  const [found, setFound] = useState<{ id: string; routeFor: RouteFor; line: Line }>();
  const id = target?.id;

  useEffect(() => {
    if (!routeFor || !target) return;
    let live = true;
    const timer = window.setTimeout(() => {
      void routeFor(target)
        .catch(() => undefined)
        .then((line) => {
          if (live && line) setFound({ id: target.id, routeFor, line });
        });
    }, ROUTE_DELAY_MS);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
    // The target is its id: the same pharmacy worded again a minute later is not a new one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeFor, id]);

  // A new position brings a new `routeFor`, and with it a new line.
  return found && found.id === id && found.routeFor === routeFor ? found.line : undefined;
}
