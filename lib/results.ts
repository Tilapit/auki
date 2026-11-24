import { cityName } from './exonyms';
import type { Locale } from './i18n';
import { isOpenNow } from './status';
import type { OpenStatus, Pharmacy, Scene } from './types';

export interface Arranged {
  /** The nearest open pharmacy: from the list, or the farther one from the 24-hour search. */
  nearestOpen?: Pharmacy;
  /** True when nothing in the list is open and the nearest open one comes from the 24-hour search. */
  far: boolean;
  /**
   * When nothing in the list is open: the nearby pharmacy that opens first. It sits under the
   * far open one, or leads alone when the 24-hour search found nothing either.
   */
  firstToOpen?: Pharmacy;
  /** The list under the card, in distance order. Pharmacies shown in the card are not repeated. */
  others: Pharmacy[];
  /** Closed pharmacies folded under "Kiinni nyt" when everything nearer than the open one is closed. */
  closedGroup: Pharmacy[];
  /** How many closed pharmacies are nearer than the nearest open one. */
  closerClosed: number;
  /** The next open pharmacy after the nearest one that a walk still reaches in time: in the list, or the far 24-hour one. */
  nextOpen?: Pharmacy;
  /** Ids whose name is shared with another result, so the street is shown next to it. */
  needsStreet: Set<string>;
  total: number;
  /**
   * Hours coverage (provisional, DESIGN-LOG.md 23 Nov 2026). Set when most of the pharmacies
   * nearer than the nearest one known to be open have hours we can't read, and that one is a
   * detour of more than DETOUR_METERS past the nearest of them, or there is none at all.
   * The card then doesn't send anyone past them: `lead`, the nearest of them, takes it, and
   * `nearestOpen` becomes a line under it. `count`: how many of the pharmacies shown have such
   * hours, which is the number a reader can check against the list.
   */
  unlisted?: { lead: Pharmacy; count: number };
  /**
   * How many pharmacies nearer than `nearestOpen` have hours we can't read. Above zero, "the
   * nearest open one" is only the nearest we know of, and the card says so.
   */
  closerUnknown: number;
}

const COLLAPSE_FROM = 3;
const CITY_FROM_NEAREST = 5;
/**
 * How much farther a pharmacy known to be open may be than the nearest one with unknown
 * hours and still lead the card: about six minutes more on foot, a fair price for knowing.
 */
export const DETOUR_METERS = 500;

/** Hours that can't say open or closed: none listed, or listed in a way that can't be read or trusted. */
export const hoursUnknown = (status: OpenStatus): boolean => status.kind === 'missing' || status.kind === 'unparseable' || status.kind === 'uncertain';

export interface ArrangeOptions {
  /** false shows the results as they were before the hours-coverage proposal, for the comparison in /dev/states. */
  coverage?: boolean;
}

type Opening = NonNullable<Extract<Pharmacy['status'], { kind: 'closed' }>['opens']>;

const dayRank = (day: Opening['day']) => (day === 'today' ? 0 : day === 'tomorrow' ? 1 : 2);

/** The closed pharmacy that opens first; among equals, the nearest. */
export function earliestToOpen(pharmacies: Pharmacy[]): { pharmacy: Pharmacy; opens: Opening } | undefined {
  return pharmacies
    .flatMap((pharmacy) => (pharmacy.status.kind === 'closed' && pharmacy.status.opens ? [{ pharmacy, opens: pharmacy.status.opens }] : []))
    .sort((a, b) => dayRank(a.opens.day) - dayRank(b.opens.day) || a.opens.time.localeCompare(b.opens.time))[0];
}

/** Splits a sorted result list into the card, the list and the collapsed closed group. Pure. */
export function arrange(scene: Pick<Scene, 'pharmacies' | 'farOpen'>, options: ArrangeOptions = {}): Arranged {
  const { pharmacies, farOpen } = scene;
  const openIndex = pharmacies.findIndex((p) => isOpenNow(p.status));
  const noneNear = openIndex < 0;
  const nearestOpen = noneNear ? farOpen : pharmacies[openIndex];
  const far = noneNear && farOpen !== undefined;
  const nearer = noneNear ? pharmacies : pharmacies.slice(0, openIndex);

  // Don't guess hours: a pharmacy without them may well be open. Where most of the nearer ones
  // are like that, the open one we know of leads only if it is hardly farther than they are.
  const allUnknown = options.coverage === false ? [] : pharmacies.filter((p) => hoursUnknown(p.status));
  const unknown = allUnknown.filter((p) => nearer.includes(p));
  const closerUnknown = unknown.length;
  // On foot where both walks are known, by straight line otherwise.
  const walked = nearestOpen?.walkMeters !== undefined && unknown[0]?.walkMeters !== undefined;
  const meters = (pharmacy: Pharmacy | undefined) => (walked ? pharmacy?.walkMeters : pharmacy?.straightMeters) ?? 0;
  const detour = nearestOpen === undefined || meters(nearestOpen) - meters(unknown[0]) > DETOUR_METERS;
  const unlisted = closerUnknown > 0 && closerUnknown * 2 > nearer.length && detour ? { lead: unknown[0], count: allUnknown.length } : undefined;

  // The first to open is named only where we can say that nothing is open; with unknown hours in the lead we can't.
  const firstToOpen = noneNear && !unlisted ? earliestToOpen(pharmacies)?.pharmacy : undefined;
  const rest = pharmacies.filter((p) => p !== nearestOpen && p !== firstToOpen && p !== unlisted?.lead);

  const closerClosed = nearer.filter((p) => p.status.kind === 'closed').length;
  // With nothing open at all there is nothing to fold the closed ones behind: they are the list.
  const collapse = nearestOpen !== undefined && closerClosed >= COLLAPSE_FROM && closerClosed === nearer.length;

  const closedGroup = collapse ? rest.filter((p) => p.status.kind === 'closed') : [];
  const others = collapse ? rest.filter((p) => p.status.kind !== 'closed') : rest;
  // One that would close before a walk there ends is not a way forward.
  const nextOpen = rest.find((p) => isOpenNow(p.status) && !p.tooLate) ?? (farOpen !== nearestOpen ? farOpen : undefined);

  const counts = new Map<string, number>();
  const all = farOpen ? [...pharmacies, farOpen] : pharmacies;
  for (const p of all) counts.set(p.name ?? '', (counts.get(p.name ?? '') ?? 0) + 1);
  const needsStreet = new Set(all.filter((p) => (counts.get(p.name ?? '') ?? 0) > 1 || p.name === null).map((p) => p.id));

  return {
    nearestOpen,
    far,
    firstToOpen,
    others,
    closedGroup,
    closerClosed,
    nextOpen,
    needsStreet,
    // The far open one is a result too, although it is not in the list.
    total: pharmacies.length + (far ? 1 : 0),
    ...(unlisted ? { unlisted } : {}),
    closerUnknown,
  };
}

/**
 * The place shown next to the results, without reverse geocoding. A searched place keeps
 * the name from the search. A located user gets the city from the addr:city of the nearest
 * pharmacies, when they have one and agree, in the UI language where the city has a name
 * there ("Riika", "Riga"). Otherwise undefined: the UI says "Lähelläsi".
 */
export function placeLabel(scene: Pick<Scene, 'pharmacies' | 'searched'>, locale: Locale): string | undefined {
  if (scene.searched) return scene.searched;
  const cities = scene.pharmacies
    .slice(0, CITY_FROM_NEAREST)
    .map((p) => p.city)
    .filter((city): city is string => !!city)
    .map((city) => cityName(city, locale));
  if (cities.length === 0) return undefined;
  return cities.every((city) => city === cities[0]) ? cities[0] : undefined;
}

/** A pharmacy's city, for the address line, when it is not the place already named above the results. */
export function cityIfElsewhere(pharmacy: Pharmacy, place: string | undefined, locale: Locale): string | undefined {
  if (!pharmacy.city) return undefined;
  const city = cityName(pharmacy.city, locale);
  return city === place ? undefined : city;
}
