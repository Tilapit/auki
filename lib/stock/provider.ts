/**
 * Medicine availability, per country (PLAN.md section 4 and 7.9). The app does not know
 * what a pharmacy has in stock. Where a country has a service of its own that shows it,
 * the app hands the question over: a link that opens that service's search, with the
 * medicine's name in it where the service takes one.
 *
 * One provider per country. Today every provider is a hand-off and nothing else. `stock`
 * is the seam for live data: a provider gets it only once its service has agreed to an
 * API, and until then no provider of the live app has one (a unit test holds that).
 *
 * A medicine's name is health information. It is typed on the device and leaves it in the
 * link the user opens, to the service the link names. Nothing here sends it anywhere else,
 * keeps it or logs it (PLAN.md 7.6).
 */

/** How much of the country the service covers. The UI says so when it is not all of it. */
export type StockCoverage = 'most' | 'some' | 'chain';

/** `web`: the lookup opens in the browser. `app`: it lives in the operator's app, and the link leads to the page that offers it. */
export type StockChannel = 'web' | 'app';

export interface StockHandoff {
  /** The address to open. Always on one of the provider's `hosts`. */
  url: string;
  /** True when the address carries the medicine's name: the service opens with it searched. */
  withMedicine: boolean;
}

export interface StockQuery {
  /** As the user typed it. Trimmed and cut to a sane length by the provider; never interpreted. */
  medicine?: string;
}

/** One pharmacy's answer from a live provider. The words are the service's claim, never ours. */
export type StockLevel = 'inStock' | 'low' | 'out' | 'unknown';

export interface StockLine {
  /** The pharmacy as our tiles know it: its OpenStreetMap id. Matching the service's pharmacies to ours is the provider's job. */
  pharmacyId: string;
  level: StockLevel;
}

export interface StockAnswer {
  /** The product as the service names it, so the user sees what was matched. */
  product: string;
  /** When the service says its figures are from, epoch seconds. */
  asOf: number;
  lines: StockLine[];
}

export interface StockLookupQuery {
  medicine: string;
  /** The pharmacies on screen: id and position, nothing about the user. */
  pharmacies: { id: string; lat: number; lon: number; name: string | null }[];
}

/**
 * Live stock, asked from the device. A provider that gets one must keep the rule above:
 * the name goes from the browser straight to the service, never through our server.
 */
export type StockLookup = (query: StockLookupQuery, signal: AbortSignal) => Promise<StockAnswer>;

export interface StockProvider {
  /** ISO 3166-1 code of the country whose pharmacies the service knows. */
  country: string;
  /** The key of its texts in lib/i18n (`medicine.services`). */
  id: string;
  /** Every host a hand-off of this provider may lead to. A test checks each link against it. */
  hosts: string[];
  channel: StockChannel;
  /** Left out when every pharmacy in the country reports to the service. */
  coverage?: StockCoverage;
  /** Whether the service's address can carry a medicine's name. The field is offered only then. */
  takesMedicine: boolean;
  handoff(query?: StockQuery): StockHandoff;
  /** Where the address pattern and the terms were checked, and when (docs/research/medicine-availability.md). */
  checked: string;
  /** The seam. Not set by any provider of the live app. */
  stock?: StockLookup;
}

/** The longest name passed on. Product names are short; anything longer is not one. */
export const MEDICINE_MAX_LENGTH = 80;

/**
 * The name as it goes into a link: trimmed, inner whitespace collapsed, control characters
 * dropped, cut to a length. Undefined when nothing is left. It is never lower-cased,
 * corrected or looked up: what the user typed is what the service gets.
 */
export function medicineText(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const text = raw
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MEDICINE_MAX_LENGTH)
    .trim();
  return text || undefined;
}
