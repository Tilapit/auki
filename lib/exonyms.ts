import type { Locale } from './i18n';

/**
 * City names in the UI language. OpenStreetMap writes addr:city in the local language
 * ("Rīga", "København K"); the Finnish UI says "Riika" and the English one "Riga".
 *
 * Only the larger cities of the covered countries (PLAN.md section 8) that have an
 * established name in Finnish or English, plus the two towns where a Finn most often meets
 * a Swedish name (Haparanda, Mariehamn). A language is left out where it uses the local name
 * ("Tallinn" in English, "Praha" in Finnish). Everything else keeps the OpenStreetMap spelling.
 */
const EXONYMS: Record<string, Partial<Record<Locale, string>>> = {
  // Estonia
  Tallinn: { fi: 'Tallinna' },
  Tartu: { fi: 'Tartto' },
  // Latvia
  Rīga: { fi: 'Riika', en: 'Riga' },
  // Lithuania
  Vilnius: { fi: 'Vilna' },
  // Poland
  Warszawa: { fi: 'Varsova', en: 'Warsaw' },
  Kraków: { fi: 'Krakova' },
  // Czechia
  Praha: { en: 'Prague' },
  // Germany
  Berlin: { fi: 'Berliini' },
  Hamburg: { fi: 'Hampuri' },
  München: { en: 'Munich' },
  Köln: { en: 'Cologne' },
  Nürnberg: { en: 'Nuremberg' },
  Hannover: { en: 'Hanover' },
  Lübeck: { fi: 'Lyypekki' },
  // Denmark
  København: { fi: 'Kööpenhamina', en: 'Copenhagen' },
  // Sweden
  Stockholm: { fi: 'Tukholma' },
  Göteborg: { en: 'Gothenburg' },
  Luleå: { fi: 'Luulaja' },
  Umeå: { fi: 'Uumaja' },
  Haparanda: { fi: 'Haaparanta' },
  // Portugal
  Lisboa: { fi: 'Lissabon', en: 'Lisbon' },
  // Spain
  Sevilla: { en: 'Seville' },
  València: { fi: 'Valencia', en: 'Valencia' },
  // Finland
  Mariehamn: { fi: 'Maarianhamina' },
};

/** Mappers also write "Riga" and "RĪGA": compare without case and combining marks. */
const fold = (name: string) => name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

const TABLE = new Map(Object.entries(EXONYMS).map(([local, names]) => [fold(local), names]));

/** Danish addresses carry the postal district in addr:city: "København K", "København SV". */
const POSTAL_DISTRICT = /\s(?:[CKMNSVØ]|[NS][VØ])$/u;

/** The city in the UI language when it has an established name there, otherwise as OpenStreetMap writes it. */
export function cityName(city: string, locale: Locale): string {
  const names = TABLE.get(fold(city)) ?? TABLE.get(fold(city.replace(POSTAL_DISTRICT, '')));
  return names?.[locale] ?? city;
}
