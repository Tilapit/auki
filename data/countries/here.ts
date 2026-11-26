/**
 * The countries one can be in: the app's coverage (PLAN.md section 8), Finland among them.
 * For each: how the app names it, the language of its pharmacies, and what Treat's research
 * trip of 3 to 13 November 2026 met at its counters.
 *
 * `field` is the trip's result, from docs/research/pharmacy-field-findings.md and PLAN.md 8.2,
 * with its sample size, month and city. It was made with prescriptions from Finland, and the
 * app says so wherever it shows a line: it is what a few pharmacies did on one day, never a
 * rule, and never about a prescription from another country. Never a pharmacy's name, never a
 * person's. Samples are one to six pharmacies a city.
 *
 * `doctorSends`: on the trip a prescription sent straight to the pharmacy by email or fax was
 * accepted there at least once, so the counter card offers the question.
 *
 * Wording rules (PLAN.md section 8): nothing here presents a medicine as sold without a
 * prescription.
 */

import type { Locale } from '../../lib/i18n';

type Text = Record<Locale, string>;

export interface Here {
  code: string;
  /** "Latviassa" / "in Latvia" */
  inCountry: Text;
  /** "latviaksi" / "in Latvian": the language of the counter card. */
  inLanguage: Text;
  /** The counter card's language: a key of PHRASES. */
  language: string;
  doctorSends?: boolean;
  field?: Text;
}

export const HERE: Here[] = [
  {
    code: 'FI',
    inCountry: { fi: 'Suomessa', en: 'in Finland' },
    inLanguage: { fi: 'suomeksi', en: 'in Finnish' },
    language: 'fi',
  },
  {
    code: 'EE',
    inCountry: { fi: 'Virossa', en: 'in Estonia' },
    inLanguage: { fi: 'viroksi', en: 'in Estonian' },
    language: 'et',
    field: {
      fi: 'Kokeiltu Tallinnassa 11/2026: e-resepti löytyi 0/3 apteekista, luultavasti reseptin ulkomaanostomerkinnän takia. Paperinen alkuperäisresepti kävi 2/3 apteekissa.',
      en: 'Tried in Tallinn, 11/2026: the e-prescription was found at 0 of 3 pharmacies, most likely because it was marked for purchase abroad. A paper original was accepted at 2 of 3.',
    },
  },
  {
    code: 'LV',
    inCountry: { fi: 'Latviassa', en: 'in Latvia' },
    inLanguage: { fi: 'latviaksi', en: 'in Latvian' },
    language: 'lv',
    field: {
      fi: 'Kokeiltu Riiassa 11/2026: e-resepti löytyi 1/1 apteekista. Kun maan järjestelmä oli noin tunnin poissa käytöstä, e-reseptejä ei saatu mistään apteekista.',
      en: 'Tried in Riga, 11/2026: the e-prescription was found at 1 of 1 pharmacies. While the national system was down for about an hour, no pharmacy could fetch e-prescriptions.',
    },
  },
  {
    code: 'LT',
    inCountry: { fi: 'Liettuassa', en: 'in Lithuania' },
    inLanguage: { fi: 'liettuaksi', en: 'in Lithuanian' },
    language: 'lt',
    field: {
      fi: 'Kokeiltu Liettuassa 11/2026: e-resepti löytyi 2/2 apteekista pelkällä passilla.',
      en: 'Tried in Lithuania, 11/2026: the e-prescription was found at 2 of 2 pharmacies with the passport alone.',
    },
  },
  {
    code: 'PL',
    inCountry: { fi: 'Puolassa', en: 'in Poland' },
    inLanguage: { fi: 'puolaksi', en: 'in Polish' },
    language: 'pl',
    field: {
      fi: 'Kokeiltu Varsovassa 11/2026: e-resepti löytyi 2/3 apteekista, kerran vasta kun farmaseutti tuli avuksi.',
      en: 'Tried in Warsaw, 11/2026: the e-prescription was found at 2 of 3 pharmacies, once only after the pharmacist took over.',
    },
  },
  {
    code: 'CZ',
    inCountry: { fi: 'Tšekissä', en: 'in Czechia' },
    inLanguage: { fi: 'tšekiksi', en: 'in Czech' },
    language: 'cs',
    field: {
      fi: 'Kokeiltu Prahassa 11/2026: e-resepti löytyi 0/3 apteekista. Paperinen alkuperäisresepti kävi 2/3 apteekissa.',
      en: 'Tried in Prague, 11/2026: the e-prescription was found at 0 of 3 pharmacies. A paper original was accepted at 2 of 3.',
    },
  },
  {
    code: 'HR',
    inCountry: { fi: 'Kroatiassa', en: 'in Croatia' },
    inLanguage: { fi: 'kroatiaksi', en: 'in Croatian' },
    language: 'hr',
    doctorSends: true,
    field: {
      fi: 'Kokeiltu Zagrebissa 11/2026: e-resepti toimi pelkällä henkilötodistuksella 1/5 apteekissa. Kaksi halusi myös eurooppalaisen sairaanhoitokortin, ja kaksi ei löytänyt järjestelmää.',
      en: 'Tried in Zagreb, 11/2026: the e-prescription worked with an ID alone at 1 of 5 pharmacies. Two also wanted the European Health Insurance Card, and two could not find the system.',
    },
  },
  {
    code: 'PT',
    inCountry: { fi: 'Portugalissa', en: 'in Portugal' },
    inLanguage: { fi: 'portugaliksi', en: 'in Portuguese' },
    language: 'pt',
    field: {
      fi: 'Kokeiltu Lissabonissa 11/2026: yksikään 6 apteekista ei pystynyt hakemaan e-reseptiä. Paperinen resepti kävi 3/3 apteekissa.',
      en: 'Tried in Lisbon, 11/2026: none of 6 pharmacies had a way to look the e-prescription up. A paper prescription was accepted at 3 of 3.',
    },
  },
  {
    code: 'ES',
    inCountry: { fi: 'Espanjassa', en: 'in Spain' },
    inLanguage: { fi: 'espanjaksi', en: 'in Spanish' },
    language: 'es',
    field: {
      fi: 'Kokeiltu Barcelonassa, Málagassa ja Fuengirolassa 11/2026: e-resepti löytyi 1/8 apteekista, henkilötunnuksella.',
      en: 'Tried in Barcelona, Málaga and Fuengirola, 11/2026: the e-prescription was found at 1 of 8 pharmacies, with the personal identity code.',
    },
  },
  {
    code: 'DE',
    inCountry: { fi: 'Saksassa', en: 'in Germany' },
    inLanguage: { fi: 'saksaksi', en: 'in German' },
    language: 'de',
    doctorSends: true,
    field: {
      fi: 'Kokeiltu Berliinissä, Frankfurtissa, Stuttgartissa ja Münchenissä 11/2026: lääkärin sähköposti kävi 8/11 apteekissa. Frankfurtissa 4/4 vaati alkuperäisen paperireseptin.',
      en: 'Tried in Berlin, Frankfurt, Stuttgart and Munich, 11/2026: a doctor’s email was accepted at 8 of 11 pharmacies. In Frankfurt 4 of 4 required the paper original.',
    },
  },
  {
    code: 'AT',
    inCountry: { fi: 'Itävallassa', en: 'in Austria' },
    inLanguage: { fi: 'saksaksi', en: 'in German' },
    language: 'de',
    doctorSends: true,
    field: {
      fi: 'Kokeiltu Wienissä 11/2026: resepti puhelimen näytöltä, PDF:nä tai kuvana, kävi 4/4 apteekissa.',
      en: 'Tried in Vienna, 11/2026: the prescription shown on a phone, as a PDF or a photo, was accepted at 4 of 4 pharmacies.',
    },
  },
  {
    code: 'CH',
    inCountry: { fi: 'Sveitsissä', en: 'in Switzerland' },
    inLanguage: { fi: 'saksaksi', en: 'in German' },
    language: 'de',
    doctorSends: true,
    field: {
      fi: 'Kokeiltu Zürichissä 11/2026: sähköpostilla lähetetty resepti kävi 3/3 apteekissa.',
      en: 'Tried in Zürich, 11/2026: a prescription sent by email was accepted at 3 of 3 pharmacies.',
    },
  },
  {
    code: 'DK',
    inCountry: { fi: 'Tanskassa', en: 'in Denmark' },
    inLanguage: { fi: 'tanskaksi', en: 'in Danish' },
    language: 'da',
    doctorSends: true,
    field: {
      fi: 'Kokeiltu Kööpenhaminassa 11/2026: lääkärin sähköposti kävi 1/3 apteekissa, ja faksilla lähetetty resepti toimitettiin kerran. Resepti puhelimen näytöltä ei käynyt (0/1).',
      en: 'Tried in Copenhagen, 11/2026: a doctor’s email was accepted at 1 of 3 pharmacies, and a prescription sent by fax was dispensed once. A prescription on a phone was refused (0 of 1).',
    },
  },
  {
    code: 'NO',
    inCountry: { fi: 'Norjassa', en: 'in Norway' },
    inLanguage: { fi: 'norjaksi', en: 'in Norwegian' },
    language: 'nb',
    doctorSends: true,
    field: {
      fi: 'Kokeiltu Norjassa 11/2026: 2/3 apteekista sanoi, että vain alkuperäinen paperiresepti käy. Lääkärin sähköposti kävi 1/3 apteekissa.',
      en: 'Tried in Norway, 11/2026: 2 of 3 pharmacies said only the paper original works. A doctor’s email was accepted at 1 of 3.',
    },
  },
  {
    code: 'SE',
    inCountry: { fi: 'Ruotsissa', en: 'in Sweden' },
    inLanguage: { fi: 'ruotsiksi', en: 'in Swedish' },
    language: 'sv',
  },
  {
    code: 'GR',
    inCountry: { fi: 'Kreikassa', en: 'in Greece' },
    inLanguage: { fi: 'kreikaksi', en: 'in Greek' },
    language: 'el',
    field: {
      fi: 'Kokeiltu Ateenassa 11/2026: antibioottia ei saanut ulkomaisella reseptillä yhdestäkään 4 apteekista.',
      en: 'Tried in Athens, 11/2026: none of 4 pharmacies dispensed an antibiotic on a foreign prescription.',
    },
  },
  {
    code: 'HU',
    inCountry: { fi: 'Unkarissa', en: 'in Hungary' },
    inLanguage: { fi: 'unkariksi', en: 'in Hungarian' },
    language: 'hu',
    field: {
      fi: 'Kokeiltu Budapestissa 11/2026: resepti puhelimen näytöltä tai tulosteena hylättiin 3/5 apteekissa.',
      en: 'Tried in Budapest, 11/2026: a prescription on a phone or as a printout was refused at 3 of 5 pharmacies.',
    },
  },
  {
    code: 'IT',
    inCountry: { fi: 'Italiassa', en: 'in Italy' },
    inLanguage: { fi: 'italiaksi', en: 'in Italian' },
    language: 'it',
    doctorSends: true,
    field: {
      fi: 'Kokeiltu Milanossa ja Roomassa 11/2026: resepti puhelimen näytöltä kävi Milanossa 4/4 apteekissa, ja Roomassa 3/3 apteekkia olisi toimittanut lääkkeen.',
      en: 'Tried in Milan and Rome, 11/2026: a prescription on a phone was accepted at 4 of 4 pharmacies in Milan, and in Rome 3 of 3 would have dispensed.',
    },
  },
  {
    code: 'MT',
    inCountry: { fi: 'Maltalla', en: 'in Malta' },
    inLanguage: { fi: 'englanniksi', en: 'in English' },
    language: 'en',
    field: {
      fi: 'Kokeiltu Maltalla 11/2026: resepti puhelimen näytöltä kävi 2/3 apteekissa. Kolmannessa farmaseutti ei ollut paikalla.',
      en: 'Tried in Malta, 11/2026: a prescription on a phone was accepted at 2 of 3 pharmacies. At the third no pharmacist was on duty.',
    },
  },
  {
    code: 'SI',
    inCountry: { fi: 'Sloveniassa', en: 'in Slovenia' },
    inLanguage: { fi: 'sloveeniksi', en: 'in Slovenian' },
    language: 'sl',
    doctorSends: true,
    field: {
      fi: 'Kokeiltu Ljubljanassa 11/2026: sähköpostilla lähetetty resepti kävi 2/3 apteekissa. Kolmas vaati alkuperäisen paperireseptin tai paikallisen reseptin.',
      en: 'Tried in Ljubljana, 11/2026: a prescription sent by email was accepted at 2 of 3 pharmacies. The third required the paper original or a local prescription.',
    },
  },
  {
    code: 'SK',
    inCountry: { fi: 'Slovakiassa', en: 'in Slovakia' },
    inLanguage: { fi: 'slovakiksi', en: 'in Slovak' },
    language: 'sk',
    doctorSends: true,
    field: {
      fi: 'Kokeiltu Bratislavassa 11/2026, 6 apteekkia: useampi hyväksyi sähköpostilla lähetetyn reseptin, ja osa vaati paperisen.',
      en: 'Tried in Bratislava, 11/2026, 6 pharmacies: several accepted a prescription sent by email, and some required the paper one.',
    },
  },
];

const BY_CODE = new Map(HERE.map((entry) => [entry.code, entry]));

export const hereOf = (code: string | undefined): Here | undefined => (code ? BY_CODE.get(code) : undefined);
