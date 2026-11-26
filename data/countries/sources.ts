/**
 * Every source the prescription guidance rests on (PLAN.md section 8), each with who publishes
 * it, its address, the date the page itself shows, and the day it was read for this app. What
 * each page says, word for word, is in docs/research/prescriptions-across-borders.md.
 *
 * `updated` is the page's own date: the one it shows to a reader, or the one in its metadata
 * where it shows none. Left out where the page gives no date at all.
 */

import type { Locale } from '../../lib/i18n';

type Text = Record<Locale, string>;

export interface Source {
  /** Who publishes the page, as the app names it. */
  label: Text;
  /** The page, in the reader's language where the publisher has one. */
  url: Text;
  updated?: string;
  /** The day the page was read for the claim it backs. */
  checked: string;
}

const READ = '2026-11-26';
const one = (url: string): Text => ({ fi: url, en: url });

export const SOURCES = {
  // The European Union
  yourEurope: {
    label: { fi: 'Sinun Eurooppasi (EU): reseptilääkkeen ostaminen toisesta EU-maasta', en: 'Your Europe (EU): presenting a prescription in another EU country' },
    url: {
      fi: 'https://europa.eu/youreurope/citizens/health/prescription-medicine-abroad/prescriptions/index_fi.htm',
      en: 'https://europa.eu/youreurope/citizens/health/prescription-medicine-abroad/prescriptions/index_en.htm',
    },
    updated: '2026-08-26',
    checked: READ,
  },
  yourEuropeFaq: {
    label: { fi: 'Sinun Eurooppasi (EU): kysymyksiä resepteistä toisessa EU-maassa', en: 'Your Europe (EU): questions on prescriptions in another EU country' },
    url: {
      fi: 'https://europa.eu/youreurope/citizens/health/prescription-medicine-abroad/prescriptions/faq/index_fi.htm',
      en: 'https://europa.eu/youreurope/citizens/health/prescription-medicine-abroad/prescriptions/faq/index_en.htm',
    },
    updated: '2026-08-26',
    checked: READ,
  },
  directive: {
    label: { fi: 'Direktiivi 2011/24/EU, 11 artikla', en: 'Directive 2011/24/EU, Article 11' },
    url: one('http://publications.europa.eu/resource/celex/32011L0024'),
    checked: READ,
  },

  // Finland
  kantaAbroad: {
    label: { fi: 'Kanta: reseptilääkkeen ostaminen ulkomailta', en: 'Kanta (Finland): purchasing prescription medicines abroad' },
    url: { fi: 'https://www.kanta.fi/reseptilaakkeen-ostaminen-ulkomailta', en: 'https://www.kanta.fi/en/purchasing-prescription-medicines-abroad' },
    updated: '2026-03-06',
    checked: READ,
  },
  kantaForeign: {
    label: { fi: 'Kanta: lääkkeiden ostaminen ulkomaisella reseptillä', en: 'Kanta (Finland): purchasing medication with a foreign prescription' },
    url: { fi: 'https://www.kanta.fi/laakkeen-osto-ulkomaisella-reseptilla', en: 'https://www.kanta.fi/en/buying-medicines-with-an-overseas-prescription' },
    updated: '2026-02-03',
    checked: READ,
  },
  euHealthcareFi: {
    label: { fi: 'EU-terveydenhoito.fi: ulkomaisen lääkemääräyksen käyttäminen Suomessa', en: 'EU-healthcare.fi: using a foreign medical prescription in Finland' },
    url: {
      fi: 'https://www.eu-terveydenhoito.fi/laakkeet/ulkomaisten-laakemaaraysten-toimittaminen-suomessa/',
      en: 'https://www.eu-healthcare.fi/medicines/filling-foreign-medical-prescriptions-in-finland/',
    },
    updated: '2026-10-20',
    checked: READ,
  },

  // The countries' own pages on the cross-border e-prescription
  tehik: {
    label: { fi: 'TEHIK (Viro): rajat ylittävä tiedonvaihto', en: 'TEHIK (Estonia): cross-border data exchange' },
    url: one('https://www.tehik.ee/piiriulene-andmevahetus'),
    checked: READ,
  },
  pacjent: {
    label: { fi: 'pacjent.gov.pl (Puola): rajat ylittävä e-resepti', en: 'pacjent.gov.pl (Poland): the cross-border e-prescription' },
    url: one('https://pacjent.gov.pl/poznaj-e-recepte-transgraniczna'),
    updated: '2026-08-03',
    checked: READ,
  },
  sanidad: {
    label: { fi: 'Espanjan terveysministeriö: yhteentoimiva eurooppalainen e-resepti', en: 'Ministry of Health (Spain): the interoperable European e-prescription' },
    url: one('https://www.sanidad.gob.es/areas/saludDigital/recetaElectronicaUE/home.htm'),
    updated: '2026-08-01',
    checked: READ,
  },
  sns24: {
    label: { fi: 'SNS 24 (Portugali): reseptit ja lääkkeet Euroopassa', en: 'SNS 24 (Portugal): prescriptions and medicines in Europe' },
    url: one('https://www.sns24.gov.pt/pt/servico/receitas-e-medicamentos-na-europa/'),
    checked: READ,
  },
  hzzo: {
    label: { fi: 'HZZO (Kroatia): kansallinen yhteyspiste', en: 'HZZO (Croatia): the National Contact Point' },
    url: one('https://hzzo.hr/nacionalna-kontaktna-tocka-ncp'),
    updated: '2024-10-04',
    checked: READ,
  },
  hzzoNotice: {
    label: { fi: 'HZZO (Kroatia): tiedote rajat ylittävästä e-reseptistä Kyproksen kanssa', en: 'HZZO (Croatia): notice on the cross-border e-prescription with Cyprus' },
    url: one('https://hzzo.hr/novosti/obavijest-o-prekogranicnoj-usluzi-e-recepta-sa-ciprom'),
    updated: '2025-06-30',
    checked: READ,
  },
  epreskripce: {
    label: { fi: 'epreskripce.gov.cz (Tšekki): rajat ylittävä e-resepti', en: 'epreskripce.gov.cz (Czechia): the cross-border e-prescription' },
    url: one('https://epreskripce.gov.cz/o-ereceptu/preshranicni-erecept/'),
    updated: '2026-08-05',
    checked: READ,
  },
  eveseliba: {
    label: { fi: 'eveseliba.gov.lv (Latvia): rajat ylittävät e-terveyspalvelut', en: 'eveseliba.gov.lv (Latvia): cross-border e-health services' },
    url: one('https://eveseliba.gov.lv/sakums/p%C4%81rrobe%C5%BEu-e-vesel%C4%ABbas-pakalpojumi'),
    checked: READ,
  },
  esveikata: {
    label: { fi: 'esveikata.lt (Liettua): valtioiden välinen e-resepti', en: 'esveikata.lt (Lithuania): the cross-border e-prescription' },
    url: one('https://www.esveikata.lt/tarpvalstybinis-e-receptas'),
    checked: READ,
  },
  ncpehealth: {
    label: { fi: 'ncpehealth.gr (Kreikka): MyHealth@EU', en: 'ncpehealth.gr (Greece): MyHealth@EU' },
    url: one('https://www.ncpehealth.gr/myhealthateu.html'),
    updated: '2026-08-26',
    checked: READ,
  },

  // Countries whose pharmacies take no e-prescription from abroad, and what they say of paper ones
  ehalsomyndigheten: {
    label: { fi: 'E-hälsomyndigheten (Ruotsi): reseptit Ruotsissa', en: 'Swedish eHealth Agency: how prescriptions work in Sweden' },
    url: one('https://www.ehalsomyndigheten.se/sprak/english/eu/how-prescriptions-work-in-sweden/'),
    checked: READ,
  },
  lifeInDenmark: {
    label: { fi: 'Tanskan lääkevirasto (lifeindenmark.borger.dk): muissa EU- ja Eta-maissa kirjoitetut reseptit', en: 'Danish Medicines Agency (lifeindenmark.borger.dk): prescriptions issued in other EU/EEA countries' },
    url: one('https://lifeindenmark.borger.dk/healthcare/prescriptions-issued-in-other-eu-eea-countries'),
    updated: '2026-06-12',
    checked: READ,
  },
  helsedirektoratetEea: {
    label: { fi: 'Helsedirektoratet (Norja): Eta-reseptien toimittaminen, 9-5 §', en: 'Norwegian Directorate of Health: dispensing EEA prescriptions, § 9-5' },
    url: one('https://www.helsedirektoratet.no/veiledere/rekvirering-og-utlevering-av-legemidler-m.m/ekspedering-av-legemidler-etter-resept-og-rekvisisjon/-9-5.ekspedisjon-av-eos-resepter'),
    updated: '2023-10-31',
    checked: READ,
  },
  helsedirektoratetMyHealth: {
    label: { fi: 'Helsedirektoratet (Norja): MyHealth@EU', en: 'Norwegian Directorate of Health: MyHealth@EU' },
    url: one('https://www.helsedirektoratet.no/om-oss/internasjonalt-samarbeid/myhealth-eu-nasjonalt-kontaktpunkt-og-visning-av-helseopplysninger-om-europeiske-borgere'),
    updated: '2025-12-15',
    checked: READ,
  },
  helsenorge: {
    label: { fi: 'Helsenorge (Norja): lääkkeiden ostaminen EU- ja Eta-maista', en: 'Helsenorge (Norway): purchases of medicines in the EU/EEA' },
    url: one('https://www.helsenorge.no/en/treatment-abroad/purchases-of-medicines-in-the-eueea/'),
    updated: '2026-03-03',
    checked: READ,
  },
  gematik: {
    label: { fi: 'gematik (Saksa): kysymyksiä e-reseptistä', en: 'gematik (Germany): questions on the e-prescription' },
    url: one('https://www.gematik.de/anwendungen/e-rezept/faq-e-rezept'),
    updated: '2026-06-18',
    checked: READ,
  },
  euPatienten: {
    label: { fi: 'EU-PATIENTEN.DE, Saksan kansallinen yhteyspiste: reseptin lunastaminen', en: 'EU-PATIENTEN.DE, Germany’s national contact point: redeeming a prescription' },
    url: one('https://www.eu-patienten.de/de/behandlung_ausland/verordnungen_einloesen_eu/verordnungen_einloesen_eu.jsp'),
    updated: '2026-07-23',
    checked: READ,
  },
  swissPositionPaper: {
    label: {
      fi: 'Sveitsin apteekkien ohje ”Ärztliche Verschreibungen” (kannanotto 0025, apteekkariliitto pharmaSuissen sivuilla)',
      en: 'Swiss guidance for pharmacies, “Ärztliche Verschreibungen” (position paper 0025, on the site of the pharmacists’ association pharmaSuisse)',
    },
    url: one('https://pharmasuisse.org/system/files/media/documents/2025-07/0025_Aerztliche_Verschreibungen_V02_d.pdf'),
    updated: '2025-05-22',
    checked: READ,
  },
} satisfies Record<string, Source>;

export type SourceId = keyof typeof SOURCES;
