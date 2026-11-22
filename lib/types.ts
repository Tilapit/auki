import type { Locale } from './i18n';

/** The four shapes of the status glyph (PLAN.md section 6). */
export type GlyphState = 'open' | 'soon' | 'closed' | 'unknown';

export type Weekday = 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su';

/**
 * Status as the client sees it once hours and the current time are combined (M3).
 * Times are local wall-clock strings, "HH:mm"; "24:00" means midnight at the end of the day.
 */
export type OpenStatus =
  | { kind: 'open'; closes: string }
  | { kind: 'soon'; closes: string }
  | { kind: 'open24' }
  | { kind: 'closed'; opens?: { day: 'today' | 'tomorrow' | Weekday; time: string } }
  | { kind: 'missing' }
  | { kind: 'unparseable'; raw: string }
  | { kind: 'uncertain'; raw: string };

export interface HoursLine {
  days: 'daily' | 'mo-fr' | 'sa' | 'su' | 'sa-su';
  from: string;
  to: string;
}

export interface Pharmacy {
  id: string;
  /** null when OpenStreetMap has no name, brand or operator: the UI shows "Apteekki" / "Pharmacy". */
  name: string | null;
  street?: string;
  /** addr:city as written in OpenStreetMap, not translated. */
  city?: string;
  lat: number;
  lon: number;
  status: OpenStatus;
  hours?: HoursLine[];
  walkMin?: number;
  walkMeters?: number;
  straightMeters: number;
  phone?: string;
  wheelchair?: 'yes' | 'limited' | 'no';
  /** Free text from OpenStreetMap, in whatever language the mapper wrote it. */
  wheelchairNote?: string;
  /** false when OpenStreetMap says dispensing=no. */
  dispensing?: boolean;
  /** check_date of the opening hours, ISO date. */
  checkDate?: string;
}

export type Ehditko =
  | { kind: 'timeline'; arrive: string; closes: string; slackMin: number }
  | { kind: 'tooLate'; arrive: string; closes: string }
  | { kind: 'none' };

export interface MapViewSpec {
  center: [number, number];
  zoom: number;
}

export interface CountryInfo {
  code: string;
  /** "Latviassa" / "in Latvia" */
  inCountry: Record<Locale, string>;
  /** "latviaksi" / "in Latvian" */
  inLanguage: Record<Locale, string>;
  status: Record<Locale, string>;
  tip: Record<Locale, string>;
  source: { label: string; url: string; checked: string };
}

export interface CardPhrases {
  /** BCP 47 tag of the local language. */
  lang: string;
  reviewed: boolean;
  variants: Record<'ePrescription' | 'paper', { local: string[]; english: string }>;
  pharmacist: { local: string; english: string };
}

/** One fixed moment in one place: everything a results view needs. */
export interface Scene {
  id: string;
  /** The place name from the search. Left out when the user was located: then the city comes from the results. */
  searched?: string;
  /** Local wall-clock time of the search, "HH:mm". */
  updated: string;
  user: { lat: number; lon: number; approximate?: boolean };
  distance: 'walking' | 'straight';
  /** Sorted, at most ten. */
  pharmacies: Pharmacy[];
  /** An open pharmacy outside the list, from the 24-hour query. */
  farOpen?: Pharmacy;
  ehditko: Ehditko;
  /** When the nearest ones are closed: when most of them open again. */
  closedOpens?: { from: string; to: string };
  country?: CountryInfo;
  card?: CardPhrases;
  views: { phone: MapViewSpec; desktop: MapViewSpec };
}
