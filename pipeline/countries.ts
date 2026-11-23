/**
 * Coverage: the countries the pipeline fetches (PLAN.md 7.2 and section 8). A country joins
 * by adding a line here, once its parse rate is measured and the hours library has its
 * public holidays.
 */

export interface Country {
  /** ISO 3166-1 alpha-2. Also the country's Overpass area. */
  code: string;
  /** IANA time zone. One per country: no coordinate lookups (PLAN.md 7.2). */
  zone: string;
  /** The one part of a country that keeps another clock, told apart by longitude. */
  west?: { ofLon: number; zone: string };
  /**
   * Where public holidays differ inside the country: OpenStreetMap's ISO 3166-2 code of each
   * state or canton, and the name the opening_hours library knows it by.
   */
  states?: Record<string, string>;
}

const GERMAN_STATES: Record<string, string> = {
  'DE-BW': 'Baden-Württemberg',
  'DE-BY': 'Bayern',
  'DE-BE': 'Berlin',
  'DE-BB': 'Brandenburg',
  'DE-HB': 'Bremen',
  'DE-HH': 'Hamburg',
  'DE-HE': 'Hessen',
  'DE-MV': 'Mecklenburg-Vorpommern',
  'DE-NI': 'Niedersachsen',
  'DE-NW': 'Nordrhein-Westfalen',
  'DE-RP': 'Rheinland-Pfalz',
  'DE-SL': 'Saarland',
  'DE-SN': 'Sachsen',
  'DE-ST': 'Sachsen-Anhalt',
  'DE-SH': 'Schleswig-Holstein',
  'DE-TH': 'Thüringen',
};

const SPANISH_COMMUNITIES: Record<string, string> = {
  'ES-AN': 'Andalucía',
  'ES-AR': 'Aragón',
  'ES-AS': 'Asturias',
  'ES-CB': 'Cantabria',
  'ES-CL': 'Castilla y León',
  'ES-CM': 'Castilla-La Mancha',
  'ES-CT': 'Cataluña',
  'ES-CE': 'Ceuta',
  'ES-NC': 'Comunidad Foral de Navarra',
  'ES-MD': 'Comunidad de Madrid',
  'ES-VC': 'Comunitat Valenciana',
  'ES-EX': 'Extremadura',
  'ES-GA': 'Galicia',
  'ES-IB': 'Illes Balears',
  'ES-CN': 'Islas Canarias',
  'ES-RI': 'La Rioja',
  'ES-ML': 'Melilla',
  'ES-PV': 'País Vasco',
  'ES-MC': 'Región de Murcia',
};

const SWISS_CANTONS: Record<string, string> = {
  'CH-AG': 'Aargau',
  'CH-AR': 'Appenzell Ausserrhoden',
  'CH-AI': 'Appenzell Innerrhoden',
  'CH-BL': 'Basel-Landschaft',
  'CH-BS': 'Basel-Stadt',
  'CH-BE': 'Bern',
  'CH-FR': 'Freiburg',
  'CH-GE': 'Genf',
  'CH-GL': 'Glarus',
  'CH-GR': 'Graubünden',
  'CH-JU': 'Jura',
  'CH-LU': 'Luzern',
  'CH-NE': 'Neuenburg',
  'CH-NW': 'Nidwalden',
  'CH-OW': 'Obwalden',
  'CH-SH': 'Schaffhausen',
  'CH-SZ': 'Schwyz',
  'CH-SO': 'Solothurn',
  'CH-SG': 'St. Gallen',
  'CH-TI': 'Tessin',
  'CH-TG': 'Thurgau',
  'CH-UR': 'Uri',
  'CH-VD': 'Waadt',
  'CH-VS': 'Wallis',
  'CH-ZG': 'Zug',
  'CH-ZH': 'Zürich',
};

export const COUNTRIES: Country[] = [
  { code: 'FI', zone: 'Europe/Helsinki' },
  { code: 'AT', zone: 'Europe/Vienna' },
  { code: 'CH', zone: 'Europe/Zurich', states: SWISS_CANTONS },
  { code: 'CZ', zone: 'Europe/Prague' },
  { code: 'DE', zone: 'Europe/Berlin', states: GERMAN_STATES },
  { code: 'DK', zone: 'Europe/Copenhagen' },
  { code: 'EE', zone: 'Europe/Tallinn' },
  // The Canaries are an hour behind the mainland. Ceuta and Melilla keep Madrid's clock.
  { code: 'ES', zone: 'Europe/Madrid', west: { ofLon: -10, zone: 'Atlantic/Canary' }, states: SPANISH_COMMUNITIES },
  { code: 'GR', zone: 'Europe/Athens' },
  { code: 'HR', zone: 'Europe/Zagreb' },
  { code: 'HU', zone: 'Europe/Budapest' },
  { code: 'IT', zone: 'Europe/Rome' },
  { code: 'LT', zone: 'Europe/Vilnius' },
  { code: 'LV', zone: 'Europe/Riga' },
  { code: 'MT', zone: 'Europe/Malta' },
  { code: 'NO', zone: 'Europe/Oslo' },
  { code: 'PL', zone: 'Europe/Warsaw' },
  // The Azores are an hour behind the mainland. Madeira keeps Lisbon's clock.
  { code: 'PT', zone: 'Europe/Lisbon', west: { ofLon: -20, zone: 'Atlantic/Azores' } },
  { code: 'SE', zone: 'Europe/Stockholm' },
  { code: 'SI', zone: 'Europe/Ljubljana' },
  { code: 'SK', zone: 'Europe/Bratislava' },
];

export const COUNTRY_CODES: string[] = COUNTRIES.map((country) => country.code);

export function countryByCode(code: string): Country | undefined {
  return COUNTRIES.find((country) => country.code === code);
}

/** The time zone of a point in a country: the country's own, or its western part's. */
export function zoneFor(country: Country, lon: number): string {
  return country.west && lon < country.west.ofLon ? country.west.zone : country.zone;
}
