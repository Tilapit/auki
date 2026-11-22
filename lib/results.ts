import { cityName } from './exonyms';
import type { Locale } from './i18n';
import { isOpenNow } from './status';
import type { Pharmacy, Scene } from './types';

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
  /** The next open pharmacy after the nearest one: in the list, or the far 24-hour one. */
  nextOpen?: Pharmacy;
  /** Ids whose name is shared with another result, so the street is shown next to it. */
  needsStreet: Set<string>;
  total: number;
}

const COLLAPSE_FROM = 3;
const CITY_FROM_NEAREST = 5;

type Opening = NonNullable<Extract<Pharmacy['status'], { kind: 'closed' }>['opens']>;

const dayRank = (day: Opening['day']) => (day === 'today' ? 0 : day === 'tomorrow' ? 1 : 2);

/** The closed pharmacy that opens first; among equals, the nearest. */
export function earliestToOpen(pharmacies: Pharmacy[]): { pharmacy: Pharmacy; opens: Opening } | undefined {
  return pharmacies
    .flatMap((pharmacy) => (pharmacy.status.kind === 'closed' && pharmacy.status.opens ? [{ pharmacy, opens: pharmacy.status.opens }] : []))
    .sort((a, b) => dayRank(a.opens.day) - dayRank(b.opens.day) || a.opens.time.localeCompare(b.opens.time))[0];
}

/** Splits a sorted result list into the card, the list and the collapsed closed group. Pure. */
export function arrange(scene: Pick<Scene, 'pharmacies' | 'farOpen'>): Arranged {
  const { pharmacies, farOpen } = scene;
  const openIndex = pharmacies.findIndex((p) => isOpenNow(p.status));
  const noneNear = openIndex < 0;
  const nearestOpen = noneNear ? farOpen : pharmacies[openIndex];
  const far = noneNear && farOpen !== undefined;
  const firstToOpen = noneNear ? earliestToOpen(pharmacies)?.pharmacy : undefined;
  const rest = pharmacies.filter((p) => p !== nearestOpen && p !== firstToOpen);

  const nearer = noneNear ? pharmacies : pharmacies.slice(0, openIndex);
  const closerClosed = nearer.filter((p) => p.status.kind === 'closed').length;
  // With nothing open at all there is nothing to fold the closed ones behind: they are the list.
  const collapse = nearestOpen !== undefined && closerClosed >= COLLAPSE_FROM && closerClosed === nearer.length;

  const closedGroup = collapse ? rest.filter((p) => p.status.kind === 'closed') : [];
  const others = collapse ? rest.filter((p) => p.status.kind !== 'closed') : rest;
  const nextOpen = rest.find((p) => isOpenNow(p.status)) ?? (farOpen !== nearestOpen ? farOpen : undefined);

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
