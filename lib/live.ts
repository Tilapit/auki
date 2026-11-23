/**
 * From tiles to what the results views show (PLAN.md 7.1). Pure: the same pharmacies, position
 * and instant always give the same scene, so the views can be tested at fixed moments.
 */

import { distanceMeters } from './geo.ts';
import { hoursStatus, isOpenStatus, localMoment, openFor } from './hoursStatus.ts';
import type { HoursStatus } from './hoursStatus.ts';
import type { Position } from './state';
import { earliestToOpen } from './results';
import { isOpenNow } from './status';
import type { Found, TilePharmacy } from './tiles.ts';
import type { OpenStatus, Pharmacy, Scene } from './types';
import { clockAt, offsetAt } from './zone.ts';

/** The list shows the nearest ten. */
export const SHOWN = 10;
/** Candidates: the nearest 20 within 10 km. Walking times will reorder them (M5). */
export const NEAR = { count: 20, radius: 10_000 };
/** If there are none: the nearest five within 50 km. */
export const WIDE = { count: 5, radius: 50_000 };
/** When none of them is open: the nearest open one within 30 km. */
export const OPEN_SEARCH_RADIUS = 30_000;
/** It has to stay open at least this long to be worth the trip. */
export const STAYS_OPEN_SECONDS = 30 * 60;
/** An interval that ends this far away is, for today's purposes, open around the clock. */
const NO_CLOSING_IN_SIGHT_SECONDS = 24 * 60 * 60;

/** After moving this far the list is ranked again around the new position (PLAN.md 7.1, step 11). */
export const RERANK_AFTER_METERS = 300;

/**
 * Whether a new fix is a move worth ranking again for: farther than the limit from where the
 * list was ranked, and by more than the fix's own uncertainty. A fix that only got vaguer
 * is not a walk.
 */
export function movedEnough(from: { lat: number; lon: number }, fix: { lat: number; lon: number; accuracy: number }): boolean {
  const meters = distanceMeters(from, fix);
  return meters > RERANK_AFTER_METERS && fix.accuracy < meters;
}

/** What a search found. The candidates never change order afterwards (PLAN.md 7.1, step 5). */
export interface SearchResult {
  /** Nearest first, by straight line. */
  candidates: Found[];
  /** The nearest pharmacy within 30 km that is open and stays open, when no candidate shown is open. */
  farOpen?: Found;
  /** Countries next to the position that the tiles don't cover, as ISO codes. */
  missing: string[];
  /** The country of the nearest pharmacy and its share of pharmacies with opening hours, from the index. */
  hoursListed?: { country: string; share: number };
}

/** True for a pharmacy that is open at `now` and stays open for half an hour more. */
export function staysOpen(pharmacy: TilePharmacy, now: number): boolean {
  const status = hoursStatus(pharmacy, now);
  return isOpenStatus(status) && openFor(status, now) >= STAYS_OPEN_SECONDS;
}

/** The status as the views word it: times as wall-clock strings on the pharmacy's own clock. */
export function toOpenStatus(pharmacy: TilePharmacy, now: number, deviceZone: string): OpenStatus {
  const status: HoursStatus = hoursStatus(pharmacy, now);
  // Say so when the pharmacy's clock is not the one in the user's hand.
  const local = offsetAt(now, pharmacy.zone) !== offsetAt(now, deviceZone) ? { local: true } : {};
  switch (status.kind) {
    case 'open':
      if (status.closes - now >= NO_CLOSING_IN_SIGHT_SECONDS) return { kind: 'open24' };
      return { kind: 'open', closes: localMoment(now, status.closes, pharmacy.zone, true).time, ...local };
    case 'soon':
      return { kind: 'soon', closes: localMoment(now, status.closes, pharmacy.zone, true).time, ...local };
    case 'closed':
      return status.opens === undefined ? { kind: 'closed' } : { kind: 'closed', opens: localMoment(now, status.opens, pharmacy.zone), ...local };
    default:
      return status;
  }
}

export function toPharmacy(found: Found, now: number, deviceZone: string): Pharmacy {
  const { pharmacy, meters } = found;
  return {
    id: pharmacy.id,
    name: pharmacy.name,
    lat: pharmacy.lat,
    lon: pharmacy.lon,
    status: toOpenStatus(pharmacy, now, deviceZone),
    straightMeters: Math.round(meters),
    ...(pharmacy.street ? { street: pharmacy.street } : {}),
    ...(pharmacy.city ? { city: pharmacy.city } : {}),
    ...(pharmacy.phone ? { phone: pharmacy.phone } : {}),
    ...(pharmacy.wheelchair ? { wheelchair: pharmacy.wheelchair } : {}),
    ...(pharmacy.wheelchairNote ? { wheelchairNote: pharmacy.wheelchairNote } : {}),
    ...(pharmacy.dispensing === false ? { dispensing: false } : {}),
    ...(pharmacy.checkDate ? { checkDate: pharmacy.checkDate } : {}),
  };
}

/** The zoom at which a distance spans a number of pixels at a latitude. */
function zoomToFit(meters: number, lat: number, pixels: number): number {
  const zoom = Math.log2((156543.03392 * Math.cos((lat * Math.PI) / 180) * pixels) / Math.max(meters, 1));
  return Math.min(MAX_VIEW_ZOOM, Math.max(9, Math.floor(zoom * 2) / 2));
}

/** The closest the first view goes: a few streets around the position. */
const MAX_VIEW_ZOOM = 16.5;
/** The pharmacy the card names stands at least this far from the dot on screen, where the zoom allows. */
const ANSWER_CLEAR_PX = 90;

export interface SceneInput {
  position: Position;
  result: SearchResult;
  /** Epoch seconds. */
  now: number;
  /** The device's own time zone: "updated at" is said on its clock. */
  deviceZone: string;
}

/** Whether the far open one is needed at `now`: none of the pharmacies shown is open. */
export function noneShownOpen(result: SearchResult, now: number): boolean {
  return !result.candidates.slice(0, SHOWN).some(({ pharmacy }) => isOpenStatus(hoursStatus(pharmacy, now)));
}

export function toScene({ position, result, now, deviceZone }: SceneInput): Scene {
  const shown = result.candidates.slice(0, SHOWN);
  const pharmacies = shown.map((found) => toPharmacy(found, now, deviceZone));
  const noneOpen = !pharmacies.some((pharmacy) => isOpenNow(pharmacy.status));
  // The far one leads only while nothing nearer is open, and only while it is itself still open.
  const farOpen = noneOpen && result.farOpen && staysOpen(result.farOpen.pharmacy, now) && !shown.some((found) => found.pharmacy.id === result.farOpen?.pharmacy.id) ? toPharmacy(result.farOpen, now, deviceZone) : undefined;

  const stale = pharmacies.length > 0 && pharmacies.every((pharmacy) => pharmacy.status.kind === 'stale');
  const dataFrom = shown.length > 0 ? Math.min(...shown.map((found) => found.pharmacy.generated)) : undefined;

  // When the closed ones mostly open tomorrow, the card can say between which hours.
  const tomorrow = pharmacies.flatMap((pharmacy) => (pharmacy.status.kind === 'closed' && pharmacy.status.opens?.day === 'tomorrow' ? [pharmacy.status.opens.time] : [])).sort();
  const closed = pharmacies.filter((pharmacy) => pharmacy.status.kind === 'closed').length;
  const closedOpens = tomorrow.length >= 2 && tomorrow.length * 2 > closed && tomorrow[0] !== tomorrow[tomorrow.length - 1] ? { from: tomorrow[0], to: tomorrow[tomorrow.length - 1] } : undefined;

  // The map frames what the card talks about: the position and the nearest few, or the far open one.
  const reach = farOpen ? farOpen.straightMeters : (pharmacies[Math.min(pharmacies.length, 5) - 1]?.straightMeters ?? 500);
  const center: [number, number] = [position.lat, position.lon];
  // When the card's pharmacy is only a block away, that overview would put its marker on top of
  // the dot: the view then goes closer, until the two stand apart. The others get edge chips.
  const answer = pharmacies.find((pharmacy) => isOpenNow(pharmacy.status)) ?? farOpen ?? earliestToOpen(pharmacies)?.pharmacy ?? pharmacies[0];
  const clear = answer ? zoomToFit(answer.straightMeters, position.lat, ANSWER_CLEAR_PX) : 0;
  const view = (pixels: number) => ({ center, zoom: Math.max(zoomToFit(reach, position.lat, pixels), clear) });

  return {
    id: 'live',
    searched: position.source === 'search' ? position.label : undefined,
    updated: clockAt(now, deviceZone),
    user: { lat: position.lat, lon: position.lon, approximate: position.source === 'device' && position.approximate },
    // No walking times before M5: straight-line distances, labelled as such.
    distance: 'straight',
    pharmacies,
    ...(farOpen ? { farOpen } : {}),
    ehditko: { kind: 'none' },
    ...(closedOpens ? { closedOpens } : {}),
    ...(stale ? { stale } : {}),
    ...(dataFrom !== undefined ? { dataFrom } : {}),
    ...(result.missing.length > 0 ? { missing: result.missing } : {}),
    ...(result.hoursListed ? { hoursListed: result.hoursListed } : {}),
    views: { phone: view(150), desktop: view(330) },
  };
}
