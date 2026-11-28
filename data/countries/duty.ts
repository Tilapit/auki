/**
 * Out of hours (PLAN.md sections 5 and 8.1): how each country's pharmacies cover nights,
 * Sundays and holidays, and where the one on duty is found.
 *
 * In many countries pharmacies take turns, and OpenStreetMap's opening hours don't show whose
 * turn it is. There "nothing open nearby" can be wrong, and the app points to the country's
 * own lookup instead of guessing.
 *
 * A claim here is what an official page said on the day it was read, and nothing else:
 * docs/research/duty-pharmacies.md has each page's words. Official means the pharmacists'
 * chamber or association, a ministry, a medicines agency, or the state's health or citizen
 * portal. Never a list from an app, a chain or a news site.
 *
 * - `rotating`: pharmacies take turns, so the one that is open depends on the day.
 * - `fixed`: the same pharmacies have long hours every day; their hours are hours like any
 *   other, and the app shows nothing more.
 * - `none`: an official page says there is no such service.
 * - A country without an entry: no official page was found that says how it is, and the app
 *   says nothing either. Never fill one country from another.
 *
 * When touching an entry, read its page again and move `checked`.
 */

import type { Locale } from '../../lib/i18n';

type Text = Record<Locale, string>;

export type DutyKind = 'rotating' | 'fixed' | 'none';

export interface DutyLookup {
  /** The page where the pharmacy on duty is found, in the reader's language where the publisher has one. */
  url: Text;
  /** The address as the app shows it: "aponet.de". */
  site: string;
  /**
   * `country`: one search for the whole country. `regions`: a page that leads to each
   * region's own list, where no search covers the country.
   */
  covers: 'country' | 'regions';
}

export interface DutyPhone {
  /** As it is dialled: digits, with the country's prefix where the number can be called from abroad. */
  tel: string;
  /** As the official page prints it. */
  shown: string;
  /** What the call costs, as the page states it. Left out where the page names no price. */
  price?: Text;
}

export interface Duty {
  code: string;
  kind: DutyKind;
  lookup?: DutyLookup;
  phone?: DutyPhone;
  /** An official page or the law says that a closed pharmacy posts the one on duty at its door. */
  door?: boolean;
  source: {
    /** Who publishes the page, as the app names them. */
    by: Text;
    /** The page that says how duty works. */
    url: string;
    /** The page's own date, where it shows one. */
    updated?: string;
    /** The day the page was read. */
    checked: string;
  };
}

const READ = '2026-11-28';
const one = (url: string): Text => ({ fi: url, en: url });

/*
 * Thirteen of the 31 covered countries. Of the other eighteen no official page was found
 * that says in words how it is, or none that could be opened: the research file has what was
 * tried for each. Above each entry: the words the claim rests on.
 */
export const DUTY: Duty[] = [
  {
    // aponet.de, "Das offizielle Gesundheitsportal der deutschen ApothekerInnen", published by ABDA:
    // "Ein Notdienstkalender regelt die Reihenfolge, wann welche Apotheke Dienst hat."
    // The number and what it costs are the federal health portal's (gesund.bund.de/apotheken, Stand 13.01.2025),
    // which also says: "An den Apotheken gibt es Aushänge mit Informationen zu den nächstgelegenen Notdienst-Apotheken."
    code: 'DE',
    kind: 'rotating',
    lookup: { url: one('https://www.aponet.de/notdienstsuche'), site: 'aponet.de', covers: 'country' },
    phone: { tel: '08000022833', shown: '0800 00 22 8 33', price: { fi: 'Maksuton lankapuhelimesta', en: 'Free from a landline' } },
    door: true,
    source: {
      by: { fi: 'Saksan apteekkarijärjestöjen liitto ABDA', en: 'ABDA, the union of Germany’s pharmacists’ associations' },
      url: 'https://www.aponet.de/notdienstsuche',
      checked: READ,
    },
  },
  {
    // The Chamber of Pharmacists: "Mit der neuen Apothekensuche finden Sie ganz einfach die nächste dienstbereite
    // Apotheke in Ihrer Nähe", and in a release of 22.12.2020: "Jede Nacht haben in Österreich rund 265 Apotheken
    // Bereitschaftsdienst." A district's regulation in force since 1.1.2026 (Amstetten, under § 8 Abs. 5
    // Apothekengesetz): "täglich um 8:00 Uhr wechselnd in nachfolgend beschriebener Reihenfolge".
    // No number: 1455 is printed on the 2020 release only, on no current page that was found.
    code: 'AT',
    kind: 'rotating',
    lookup: { url: one('https://www.apothekerkammer.at/apothekensuche'), site: 'apothekerkammer.at', covers: 'country' },
    source: {
      by: { fi: 'Itävallan apteekkarikamari', en: 'the Austrian Chamber of Pharmacists' },
      url: 'https://www.apothekerkammer.at/apothekensuche',
      checked: READ,
    },
  },
  {
    // The General Council of the Colleges of Pharmacists: "Con solo seleccionar tu provincia, podrás conocer qué
    // farmacias están de servicio en cada momento". The page hands over to each province's own list.
    code: 'ES',
    kind: 'rotating',
    lookup: { url: one('https://www.farmaceuticos.com/farmacias-de-guardia/'), site: 'farmaceuticos.com', covers: 'country' },
    source: {
      by: { fi: 'Espanjan apteekkarikollegioiden yleisneuvosto', en: 'the General Council of Spain’s Colleges of Pharmacists' },
      url: 'https://www.farmaceuticos.com/farmacias-de-guardia/',
      checked: READ,
    },
  },
  {
    // Law 1963/1991, article 9, as the Panhellenic Pharmaceutical Association quotes it (letter of 4.11.2024):
    // the number of pharmacies on day and night duty and their order are set for each year, and the tables
    // "αναρτώνται επί των προσόψεων των φαρμακείων κατά τις ημέρες και ώρες που αυτά παραμένουν κλειστά".
    // No lookup: each local association has its own, and no page that lists them was found.
    code: 'GR',
    kind: 'rotating',
    door: true,
    source: {
      by: { fi: 'Kreikan apteekkariliitto PFS', en: 'the Panhellenic Pharmaceutical Association' },
      url: 'https://pfs.gr/%CF%80%CE%B1%CF%81%CE%AC%CE%BD%CE%BF%CE%BC%CE%B7-%CE%BB%CE%B5%CE%B9%CF%84%CE%BF%CF%85%CF%81%CE%B3%CE%AF%CE%B1-%CF%86%CE%B1%CF%81%CE%BC%CE%B1%CE%BA%CE%B5%CE%AF%CF%89%CE%BD-%CE%BA%CE%B1%CF%84%CE%AC/',
      updated: '2024-11-04',
      checked: READ,
    },
  },
  {
    // ARS Occitanie, a regional agency of the state (1.4.2026): "Ce service est assuré par roulement entre
    // pharmacies", and: "consultez le site RésoGardes mis en place par les syndicats représentatifs de la
    // profession dans le département : www.3237.fr ou appelez le 3237* *appel surtaxé 0,35 € / min".
    // 3237.fr's own map marks some départements as partly covered.
    code: 'FR',
    kind: 'rotating',
    lookup: { url: one('https://www.3237.fr/'), site: '3237.fr', covers: 'country' },
    phone: { tel: '3237', shown: '3237', price: { fi: '0,35 € minuutilta', en: '€0.35 a minute' } },
    source: {
      by: { fi: 'ARS Occitanie, Ranskan valtion alueellinen terveysvirasto', en: 'ARS Occitanie, a regional health agency of the French state' },
      url: 'https://www.occitanie.ars.sante.fr/trouver-une-pharmacie-de-garde-pres-de-chez-moi-0',
      updated: '2026-04-01',
      checked: READ,
    },
  },
  {
    // The Order of Pharmacists (21.12.2016), on Royal Decree no. 78: "moet elke apotheek aan de wachtrol deelnemen".
    // The lookup is the pharmacists' association's (APB), whose page of 11.9.2025 says: "Chaque pharmacie affiche
    // une liste des services de garde [...] Vous pouvez consulter cette liste de l'extérieur de la pharmacie."
    code: 'BE',
    kind: 'rotating',
    lookup: { url: one('https://www.pharmacie.be/'), site: 'pharmacie.be', covers: 'country' },
    door: true,
    source: {
      by: { fi: 'Belgian apteekkarien ammattikunta Orde der Apothekers', en: 'the Belgian Order of Pharmacists' },
      url: 'https://ordederapothekers.be/deontologie/adviezen/regeling-van-de-wachtdienst-en-vervanging',
      updated: '2016-12-21',
      checked: READ,
    },
  },
  {
    // The Ministry of Health and Social Security: "Out-of-hours pharmacies provide a 24-hour service, from 08:00
    // to 08:00 the next day. The list of pharmacies on duty is available on the website of the Luxembourg
    // Pharmacists' Association". That list names other pharmacies for 28.11.2026 than for 27.11.2026.
    code: 'LU',
    kind: 'rotating',
    lookup: { url: one('https://pharmacie.lu/pharmacies/garde'), site: 'pharmacie.lu', covers: 'country' },
    source: {
      by: { fi: 'Luxemburgin terveysministeriö', en: 'Luxembourg’s Ministry of Health and Social Security' },
      url: 'https://santesecu.public.lu/en/urgences-gardes/services-garde/pharmacie.html',
      updated: '2025-10-14',
      checked: READ,
    },
  },
  {
    // e-VÚC, the portal of the eight self-governing regions: "Tu sú zverejnené rozpisy lekárenskej pohotovostnej
    // služby rozdelené podľa krajov a okresov". Its front page leads to each region's own list for today.
    code: 'SK',
    kind: 'rotating',
    lookup: { url: one('https://www.e-vuc.sk/'), site: 'e-vuc.sk', covers: 'regions' },
    source: {
      by: { fi: 'Slovakian itsehallintoalueiden portaali e-VÚC', en: 'e-VÚC, the portal of Slovakia’s self-governing regions' },
      url: 'https://www.e-vuc.sk/e-vuc/pre-prevadzkovatelov-lekarni/rozpisy-lekarenskej-pohotovostnej-sluzby.html?page_id=81502',
      checked: READ,
    },
  },
  {
    // NNGYK, the National Centre for Public Health and Pharmacy (1.4.2026): "a gyógyszertárak az ügyeleti rendnek
    // megfelelően látnak el szolgálatot", and: "Minden gyógyszertárnak jól látható helyen és olvasható módon fel
    // kell tüntetnie a hozzá legközelebb eső, folyamatosan nyitva tartó vagy ügyeleti szolgálatot teljesítő
    // közforgalmú gyógyszertár nevét, címét". No lookup: the finder the page links to (ogyei.gov.hu) could not be opened.
    code: 'HU',
    kind: 'rotating',
    door: true,
    source: {
      by: { fi: 'Unkarin kansanterveys- ja lääkekeskus NNGYK', en: 'NNGYK, Hungary’s National Centre for Public Health and Pharmacy' },
      url: 'https://nngyk.gov.hu/hu/tovabbi-hirek/unnepi-nyitvatartas-es-ugyeleti-rend-a-gyogyszertarakban.html',
      updated: '2026-04-01',
      checked: READ,
    },
  },
  {
    // The Ministry of Health's Pharmaceutical Services publish "Κατάλογος διημερευόντων φαρμακείων ανά επαρχία":
    // the pharmacies on day duty by district, a row for each date. Files, not a search: no lookup is offered.
    code: 'CY',
    kind: 'rotating',
    source: {
      by: { fi: 'Kyproksen terveysministeriön lääkepalvelut', en: 'the Pharmaceutical Services of Cyprus’s Ministry of Health' },
      url: 'https://www.data.gov.cy/el/dataset/katalogos-diimereyonton-farmakeion',
      updated: '2026-10-03',
      checked: READ,
    },
  },
  {
    // The Malta Medicines Authority: "Last version of the roster including any changes between pharmacies will be
    // uploded on this page from time to time". The roster is for Sundays, public holidays and Saturdays; no page
    // that was found speaks of nights.
    code: 'MT',
    kind: 'rotating',
    lookup: { url: one('https://medicinesauthority.gov.mt/pharmacyroster?l=1'), site: 'medicinesauthority.gov.mt', covers: 'country' },
    source: {
      by: { fi: 'Maltan lääkevirasto', en: 'the Malta Medicines Authority' },
      url: 'https://medicinesauthority.gov.mt/pharmacyroster?l=1',
      checked: READ,
    },
  },
  {
    // Portaria n.º 277/2012, as INFARMED's compiled legislation has it (with the change of 11.1.2013), article 6:
    // "As escalas de turnos das farmácias do município aprovadas pela respetiva ARS são afixadas, em cada
    // farmácia, de forma visível." No lookup: the pages on which the same article says the rosters are published were not found.
    code: 'PT',
    kind: 'rotating',
    door: true,
    source: {
      by: { fi: 'Portugalin lääkevirasto INFARMED', en: 'INFARMED, Portugal’s medicines agency' },
      url: 'https://www.infarmed.pt/documents/15786/1067254/029-D_Port%20277_2012.pdf',
      updated: '2013-01-11',
      checked: READ,
    },
  },
  {
    // The Danish Medicines Agency (2.1.2026): "Lægemiddelstyrelsen har tildelt vagttjeneste til de apoteker, der
    // fremgår af listerne nederst på siden. [...] Apoteker der er tildelt A-vagttjeneste har åbent kl. 06.00-24.00
    // alle årets dage." Named pharmacies with set hours: hours like any other, and nothing more is shown.
    code: 'DK',
    kind: 'fixed',
    source: {
      by: { fi: 'Tanskan lääkevirasto', en: 'the Danish Medicines Agency' },
      url: 'https://laegemiddelstyrelsen.dk/da/apoteker/apoteker/vagttjeneste/',
      updated: '2026-01-02',
      checked: READ,
    },
  },
];

const BY_CODE = new Map(DUTY.map((duty) => [duty.code, duty]));

/** What is known of a country's out-of-hours service. Undefined where no official page was found. */
export const dutyFor = (country: string | undefined): Duty | undefined => (country === undefined ? undefined : BY_CODE.get(country));

/** A row can be offered: there is a page to open or a number to call. */
export const dutyHasWay = (duty: Duty): boolean => duty.lookup !== undefined || duty.phone !== undefined;
