/**
 * From OpenStreetMap elements to the pharmacies we publish (PLAN.md 7.2, step 2).
 * Pure: the same extract always gives the same list.
 */

import { distanceMeters } from '../lib/geo.ts';
import { roundCoordinate } from '../lib/tiles.ts';
import type { Wheelchair } from '../lib/tiles.ts';
import type { Country } from './countries.ts';
import { zoneFor } from './countries.ts';
import type { CountryExtract, OsmElement } from './fetch.ts';
import { elementKey } from './fetch.ts';

export interface Normalized {
  id: string;
  lat: number;
  lon: number;
  name: string | null;
  street?: string;
  city?: string;
  country: string;
  /** ISO 3166-2, where the country's holidays differ by state. */
  state?: string;
  zone: string;
  /** The opening_hours value as written. */
  openingHours?: string;
  phone?: string;
  email?: string;
  website?: string;
  wheelchair?: Wheelchair;
  wheelchairNote?: string;
  dispensing?: false;
  checkDate?: string;
}

export interface NormalizeResult {
  pharmacies: Normalized[];
  dropped: { private: number; duplicate: number; noPosition: number };
}

/** Longest free text we carry: an opening_hours value or an accessibility note. */
export const TEXT_MAX = 200;
const DUPLICATE_WITHIN_METERS = 50;

const clean = (value: string | undefined, max = TEXT_MAX): string | undefined => {
  const text = value?.replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : undefined;
};

function street(tags: Record<string, string>, country: string): string | undefined {
  const road = clean(tags['addr:street']) ?? clean(tags['addr:place']);
  const number = clean(tags['addr:housenumber'], 20);
  if (!road) return undefined;
  if (!number) return road;
  // Malta writes the number first. The other covered countries write the street first.
  return country === 'MT' ? `${number} ${road}` : `${road} ${number}`;
}

/** http and https only. A bare host name, which is how many are written, gets https. */
export function website(value: string | undefined): string | undefined {
  const text = clean(value?.split(';')[0]);
  if (!text) return undefined;
  const candidate = /^https?:\/\//i.test(text) ? text : /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(\/\S*)?$/i.test(text) ? `https://${text}` : undefined;
  if (!candidate) return undefined;
  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function email(value: string | undefined): string | undefined {
  const text = clean(value?.split(';')[0]);
  return text && /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/.test(text) ? text : undefined;
}

export function phone(value: string | undefined): string | undefined {
  const text = clean(value?.split(';')[0], 40);
  // Digits, spaces and the usual separators only: it becomes a tel: link.
  return text && /^\+?[0-9][0-9 ()./-]{4,}$/.test(text) ? text : undefined;
}

const isoDate = (value: string | undefined): string | undefined => (value && /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) ? value.trim() : undefined);

function one(element: OsmElement, country: Country, state: string | undefined): Normalized | undefined {
  const tags = element.tags ?? {};
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (typeof lat !== 'number' || typeof lon !== 'number') return undefined;

  const wheelchair = tags.wheelchair === 'yes' || tags.wheelchair === 'limited' || tags.wheelchair === 'no' ? tags.wheelchair : undefined;
  const pharmacy: Normalized = {
    id: elementKey(element),
    lat: roundCoordinate(lat),
    lon: roundCoordinate(lon),
    name: clean(tags.name) ?? clean(tags.brand) ?? clean(tags.operator) ?? null,
    country: country.code,
    zone: zoneFor(country, lon),
  };
  const set = <K extends keyof Normalized>(key: K, value: Normalized[K] | undefined) => {
    if (value !== undefined) pharmacy[key] = value;
  };
  set('street', street(tags, country.code));
  set('city', clean(tags['addr:city']));
  set('state', state);
  set('openingHours', clean(tags.opening_hours, 2000));
  set('phone', phone(tags.phone ?? tags['contact:phone']));
  set('email', email(tags.email ?? tags['contact:email']));
  set('website', website(tags.website ?? tags['contact:website']));
  set('wheelchair', wheelchair);
  set('wheelchairNote', clean(tags['wheelchair:description']));
  if (tags.dispensing === 'no') pharmacy.dispensing = false;
  set('checkDate', isoDate(tags['check_date:opening_hours']) ?? isoDate(tags.check_date));
  return pharmacy;
}

/** How much a record tells: of two that are the same pharmacy, the fuller one stays. */
function weight(pharmacy: Normalized): number {
  const fields = Object.values(pharmacy).filter((value) => value !== undefined && value !== null).length;
  return (pharmacy.openingHours ? 100 : 0) + fields;
}

export function normalize(extract: CountryExtract, country: Country): NormalizeResult {
  const dropped = { private: 0, duplicate: 0, noPosition: 0 };
  const candidates: Normalized[] = [];

  for (const element of extract.elements) {
    const access = element.tags?.access;
    // Hospital-internal pharmacies and the like: not somewhere to send a traveller.
    if (access === 'private' || access === 'no') {
      dropped.private++;
      continue;
    }
    const pharmacy = one(element, country, extract.states[elementKey(element)]);
    if (!pharmacy) {
      dropped.noPosition++;
      continue;
    }
    candidates.push(pharmacy);
  }

  // The same name within 50 m is one pharmacy mapped twice, as a point and as a building.
  // Fuller records first, so the one that stays is the one that says more.
  candidates.sort((a, b) => weight(b) - weight(a) || (a.id < b.id ? -1 : 1));
  // Cells of about 110 m of latitude, and of longitude at least 70 m wide up to 71° north:
  // two points within 50 m are in the same cell or in neighbouring ones.
  const buckets = new Map<string, Normalized[]>();
  const kept: Normalized[] = [];
  for (const pharmacy of candidates) {
    const cx = Math.floor(pharmacy.lon / 0.002);
    const cy = Math.floor(pharmacy.lat / 0.001);
    const name = (pharmacy.name ?? '').toLowerCase();
    let duplicate = false;
    for (let dx = -1; dx <= 1 && !duplicate; dx++) {
      for (let dy = -1; dy <= 1 && !duplicate; dy++) {
        for (const other of buckets.get(`${cx + dx}:${cy + dy}`) ?? []) {
          if ((other.name ?? '').toLowerCase() === name && distanceMeters(other, pharmacy) <= DUPLICATE_WITHIN_METERS) {
            duplicate = true;
            break;
          }
        }
      }
    }
    if (duplicate) {
      dropped.duplicate++;
      continue;
    }
    kept.push(pharmacy);
    const key = `${cx}:${cy}`;
    buckets.set(key, [...(buckets.get(key) ?? []), pharmacy]);
  }

  // A stable order, so two runs over the same data write the same files.
  kept.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { pharmacies: kept, dropped };
}
