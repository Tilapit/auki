/**
 * What the app says about a prescription from Finland, country by country (PLAN.md section 8):
 * the status in one line, one tip, and what happened at the counter on Treat's research trip
 * of 3 to 13 November 2026.
 *
 * Where each line comes from:
 * - `status`: Kanta's list of the countries where a Finnish e-prescription can be bought, read
 *   on the date in `source.checked`. A country that is not on the list gets "does not work".
 * - `tip`: Kanta's guidance (the paper prescription), or the one thing the trip showed to matter
 *   most in that country.
 * - `field`: the trip's result, from docs/research/pharmacy-field-findings.md and PLAN.md 8.2,
 *   with its sample size, month and city. Never a pharmacy's name, never a person's. Samples are
 *   one to six pharmacies a city: the line says what happened, not what will.
 *
 * Wording rules (PLAN.md section 8): nothing here presents a medicine as sold without a
 * prescription, and no medicine is named. Finland has no entry: there is no banner at home.
 */

import type { Locale } from '../../lib/i18n';
import type { CardVariant } from '../../lib/types';

type Text = Record<Locale, string>;

export interface Guide {
  code: string;
  /** "Latviassa" / "in Latvia" */
  inCountry: Text;
  /** "latviaksi" / "in Latvian": the language of the counter card. */
  inLanguage: Text;
  status: Text;
  tip: Text;
  field?: Text;
  source: { label: string; url: string; checked: string };
  /** The counter card's language (a key of PHRASES), and which of its variants this country is offered. */
  language: string;
  variants: CardVariant[];
}

const KANTA = { label: 'Kanta', url: 'https://www.kanta.fi/en/buying-prescription-medicines-abroad', checked: '2026-11-25' };

const PHARMACIST: Text = {
  fi: 'Jos ensimmäinen vastaus on ei, pyydä farmaseuttia.',
  en: 'If the first answer is no, ask for the pharmacist.',
};
const PAPER: Text = {
  fi: 'Ota mukaan paperinen alkuperäisresepti.',
  en: 'Bring the paper original of the prescription.',
};
const ASK_EMAIL: Text = {
  fi: 'Kysy apteekista, voiko reseptin lähettää sinne sähköpostilla.',
  en: 'Ask the pharmacy whether the prescription can be emailed to them.',
};

const works = (fi: string, en: string): Text => ({ fi: `Suomalainen e-resepti toimii ${fi}.`, en: `A Finnish e-prescription works ${en}.` });
const not = (fi: string, en: string): Text => ({ fi: `Suomalainen e-resepti ei toimi ${fi}.`, en: `A Finnish e-prescription does not work ${en}.` });

export const GUIDES: Guide[] = [
  {
    code: 'EE',
    inCountry: { fi: 'Virossa', en: 'in Estonia' },
    inLanguage: { fi: 'viroksi', en: 'in Estonian' },
    status: works('Virossa passilla', 'in Estonia with your passport'),
    tip: {
      fi: 'Tarkista OmaKannasta, että resepti on tavallinen e-resepti eikä ulkomaanostoa varten kirjoitettu.',
      en: 'Check in MyKanta that it is an ordinary e-prescription, not one written for purchases abroad.',
    },
    field: {
      fi: 'Kokeiltu Tallinnassa 11/2026: e-resepti löytyi 0/3 apteekista, luultavasti reseptin ulkomaanostomerkinnän takia. Paperinen alkuperäisresepti kävi 2/3 apteekissa.',
      en: 'Tried in Tallinn, 11/2026: the e-prescription was found at 0 of 3 pharmacies, most likely because it was marked for purchase abroad. A paper original was accepted at 2 of 3.',
    },
    source: KANTA,
    language: 'et',
    variants: ['ePrescription', 'paper'],
  },
  {
    code: 'LV',
    inCountry: { fi: 'Latviassa', en: 'in Latvia' },
    inLanguage: { fi: 'latviaksi', en: 'in Latvian' },
    status: works('Latviassa passilla', 'in Latvia with your passport'),
    tip: {
      fi: 'Jos kysytään ”insurance numberia”, se on henkilötunnuksesi passin tietosivulla.',
      en: 'If you are asked for an “insurance number”, it is your personal identity code on the passport’s data page.',
    },
    field: {
      fi: 'Kokeiltu Riiassa 11/2026: e-resepti löytyi 1/1 apteekista. Kun maan järjestelmä oli noin tunnin poissa käytöstä, e-reseptejä ei saatu mistään apteekista.',
      en: 'Tried in Riga, 11/2026: the e-prescription was found at 1 of 1 pharmacies. While the national system was down for about an hour, no pharmacy could fetch e-prescriptions.',
    },
    source: KANTA,
    language: 'lv',
    variants: ['ePrescription', 'paper'],
  },
  {
    code: 'LT',
    inCountry: { fi: 'Liettuassa', en: 'in Lithuania' },
    inLanguage: { fi: 'liettuaksi', en: 'in Lithuanian' },
    status: works('Liettuassa passilla', 'in Lithuania with your passport'),
    tip: PHARMACIST,
    field: {
      fi: 'Kokeiltu Liettuassa 11/2026: e-resepti löytyi 2/2 apteekista pelkällä passilla.',
      en: 'Tried in Lithuania, 11/2026: the e-prescription was found at 2 of 2 pharmacies with the passport alone.',
    },
    source: KANTA,
    language: 'lt',
    variants: ['ePrescription', 'paper'],
  },
  {
    code: 'PL',
    inCountry: { fi: 'Puolassa', en: 'in Poland' },
    inLanguage: { fi: 'puolaksi', en: 'in Polish' },
    status: works('noin 90 %:ssa Puolan apteekeista', 'in about 90% of pharmacies in Poland'),
    tip: {
      fi: 'Jos reseptiä ei löydy, pyydä farmaseuttia. ”Insurance number” on henkilötunnuksesi passin tietosivulla.',
      en: 'If the prescription is not found, ask for the pharmacist. An “insurance number” is your personal identity code on the passport’s data page.',
    },
    field: {
      fi: 'Kokeiltu Varsovassa 11/2026: e-resepti löytyi 2/3 apteekista, kerran vasta kun farmaseutti tuli avuksi.',
      en: 'Tried in Warsaw, 11/2026: the e-prescription was found at 2 of 3 pharmacies, once only after the pharmacist took over.',
    },
    source: KANTA,
    language: 'pl',
    variants: ['ePrescription', 'paper'],
  },
  {
    code: 'CZ',
    inCountry: { fi: 'Tšekissä', en: 'in Czechia' },
    inLanguage: { fi: 'tšekiksi', en: 'in Czech' },
    status: works('Tšekissä vain osassa apteekkeja', 'in only some pharmacies in Czechia'),
    tip: PAPER,
    field: {
      fi: 'Kokeiltu Prahassa 11/2026: e-resepti löytyi 0/3 apteekista. Paperinen alkuperäisresepti kävi 2/3 apteekissa.',
      en: 'Tried in Prague, 11/2026: the e-prescription was found at 0 of 3 pharmacies. A paper original was accepted at 2 of 3.',
    },
    source: KANTA,
    language: 'cs',
    variants: ['ePrescription', 'paper'],
  },
  {
    code: 'HR',
    inCountry: { fi: 'Kroatiassa', en: 'in Croatia' },
    inLanguage: { fi: 'kroatiaksi', en: 'in Croatian' },
    status: works('Kroatiassa', 'in Croatia'),
    tip: {
      fi: 'Ota mukaan eurooppalainen sairaanhoitokortti. Jos ensimmäinen vastaus on ei, kysy uudelleen ja pyydä farmaseuttia.',
      en: 'Carry your European Health Insurance Card. If the first answer is no, ask again, and ask for the pharmacist.',
    },
    field: {
      fi: 'Kokeiltu Zagrebissa 11/2026: e-resepti toimi pelkällä henkilötodistuksella 1/5 apteekissa. Kaksi halusi myös eurooppalaisen sairaanhoitokortin, ja kaksi ei löytänyt järjestelmää.',
      en: 'Tried in Zagreb, 11/2026: the e-prescription worked with an ID alone at 1 of 5 pharmacies. Two also wanted the European Health Insurance Card, and two could not find the system.',
    },
    source: KANTA,
    language: 'hr',
    variants: ['ePrescription', 'paper', 'doctorSends'],
  },
  {
    code: 'PT',
    inCountry: { fi: 'Portugalissa', en: 'in Portugal' },
    inLanguage: { fi: 'portugaliksi', en: 'in Portuguese' },
    status: works('Portugalissa vain osassa apteekkeja', 'in only some pharmacies in Portugal'),
    tip: { fi: 'Ota mukaan paperinen resepti.', en: 'Bring a paper prescription.' },
    field: {
      fi: 'Kokeiltu Lissabonissa 11/2026: yksikään 6 apteekista ei pystynyt hakemaan e-reseptiä. Paperinen resepti kävi 3/3 apteekissa.',
      en: 'Tried in Lisbon, 11/2026: none of 6 pharmacies had a way to look the e-prescription up. A paper prescription was accepted at 3 of 3.',
    },
    source: KANTA,
    language: 'pt',
    variants: ['ePrescription', 'paper'],
  },
  {
    code: 'ES',
    inCountry: { fi: 'Espanjassa', en: 'in Spain' },
    inLanguage: { fi: 'espanjaksi', en: 'in Spanish' },
    status: works('Espanjassa vain osassa alueita', 'in only some regions of Spain'),
    tip: {
      fi: 'Jos reseptiä ei löydy, pyydä farmaseuttia. Henkilötunnuksesi on passin tietosivulla.',
      en: 'If the prescription is not found, ask for the pharmacist. Your personal identity code is on the passport’s data page.',
    },
    field: {
      fi: 'Kokeiltu Barcelonassa, Málagassa ja Fuengirolassa 11/2026: e-resepti löytyi 1/8 apteekista, henkilötunnuksella.',
      en: 'Tried in Barcelona, Málaga and Fuengirola, 11/2026: the e-prescription was found at 1 of 8 pharmacies, with the personal identity code.',
    },
    source: KANTA,
    language: 'es',
    variants: ['ePrescription', 'paper'],
  },
  {
    code: 'DE',
    inCountry: { fi: 'Saksassa', en: 'in Germany' },
    inLanguage: { fi: 'saksaksi', en: 'in German' },
    status: not('Saksassa', 'in Germany'),
    tip: {
      fi: 'Ota mukaan paperinen alkuperäisresepti, tai pyydä lääkäriä lähettämään resepti suoraan apteekkiin.',
      en: 'Bring the paper original, or ask your doctor to send the prescription straight to the pharmacy.',
    },
    field: {
      fi: 'Kokeiltu Berliinissä, Frankfurtissa, Stuttgartissa ja Münchenissä 11/2026: lääkärin sähköposti kävi 8/11 apteekissa. Frankfurtissa 4/4 vaati alkuperäisen paperireseptin.',
      en: 'Tried in Berlin, Frankfurt, Stuttgart and Munich, 11/2026: a doctor’s email was accepted at 8 of 11 pharmacies. In Frankfurt 4 of 4 required the paper original.',
    },
    source: KANTA,
    language: 'de',
    variants: ['paper', 'doctorSends'],
  },
  {
    code: 'AT',
    inCountry: { fi: 'Itävallassa', en: 'in Austria' },
    inLanguage: { fi: 'saksaksi', en: 'in German' },
    status: not('Itävallassa', 'in Austria'),
    tip: PHARMACIST,
    field: {
      fi: 'Kokeiltu Wienissä 11/2026: resepti puhelimen näytöltä, PDF:nä tai kuvana, kävi 4/4 apteekissa.',
      en: 'Tried in Vienna, 11/2026: the prescription shown on a phone, as a PDF or a photo, was accepted at 4 of 4 pharmacies.',
    },
    source: KANTA,
    language: 'de',
    variants: ['paper', 'doctorSends'],
  },
  {
    code: 'CH',
    inCountry: { fi: 'Sveitsissä', en: 'in Switzerland' },
    inLanguage: { fi: 'saksaksi', en: 'in German' },
    status: not('Sveitsissä', 'in Switzerland'),
    tip: ASK_EMAIL,
    field: {
      fi: 'Kokeiltu Zürichissä 11/2026: sähköpostilla lähetetty resepti kävi 3/3 apteekissa.',
      en: 'Tried in Zürich, 11/2026: a prescription sent by email was accepted at 3 of 3 pharmacies.',
    },
    source: KANTA,
    language: 'de',
    variants: ['paper', 'doctorSends'],
  },
  {
    code: 'DK',
    inCountry: { fi: 'Tanskassa', en: 'in Denmark' },
    inLanguage: { fi: 'tanskaksi', en: 'in Danish' },
    status: not('Tanskassa', 'in Denmark'),
    tip: PAPER,
    field: {
      fi: 'Kokeiltu Kööpenhaminassa 11/2026: lääkärin sähköposti kävi 1/3 apteekissa, ja faksilla lähetetty resepti toimitettiin kerran. Resepti puhelimen näytöltä ei käynyt (0/1).',
      en: 'Tried in Copenhagen, 11/2026: a doctor’s email was accepted at 1 of 3 pharmacies, and a prescription sent by fax was dispensed once. A prescription on a phone was refused (0 of 1).',
    },
    source: KANTA,
    language: 'da',
    variants: ['paper', 'doctorSends'],
  },
  {
    code: 'NO',
    inCountry: { fi: 'Norjassa', en: 'in Norway' },
    inLanguage: { fi: 'norjaksi', en: 'in Norwegian' },
    status: not('Norjassa', 'in Norway'),
    tip: PAPER,
    field: {
      fi: 'Kokeiltu Norjassa 11/2026: 2/3 apteekista sanoi, että vain alkuperäinen paperiresepti käy. Lääkärin sähköposti kävi 1/3 apteekissa.',
      en: 'Tried in Norway, 11/2026: 2 of 3 pharmacies said only the paper original works. A doctor’s email was accepted at 1 of 3.',
    },
    source: KANTA,
    language: 'nb',
    variants: ['paper', 'doctorSends'],
  },
  {
    code: 'SE',
    inCountry: { fi: 'Ruotsissa', en: 'in Sweden' },
    inLanguage: { fi: 'ruotsiksi', en: 'in Swedish' },
    status: not('Ruotsissa', 'in Sweden'),
    tip: PAPER,
    source: KANTA,
    language: 'sv',
    variants: ['paper'],
  },
  {
    code: 'GR',
    inCountry: { fi: 'Kreikassa', en: 'in Greece' },
    inLanguage: { fi: 'kreikaksi', en: 'in Greek' },
    status: not('Kreikassa', 'in Greece'),
    tip: {
      fi: 'Jos ulkomainen resepti ei käy, farmaseutti osaa neuvoa paikallisen lääkärin.',
      en: 'If a foreign prescription is not accepted, the pharmacist can point you to a local doctor.',
    },
    field: {
      fi: 'Kokeiltu Ateenassa 11/2026: antibioottia ei saanut ulkomaisella reseptillä yhdestäkään 4 apteekista.',
      en: 'Tried in Athens, 11/2026: none of 4 pharmacies dispensed an antibiotic on a foreign prescription.',
    },
    source: KANTA,
    language: 'el',
    variants: ['paper'],
  },
  {
    code: 'HU',
    inCountry: { fi: 'Unkarissa', en: 'in Hungary' },
    inLanguage: { fi: 'unkariksi', en: 'in Hungarian' },
    status: not('Unkarissa', 'in Hungary'),
    tip: {
      fi: 'Ota mukaan paperinen alkuperäisresepti, jossa on lääkärin allekirjoitus ja leima.',
      en: 'Bring the paper original with the doctor’s signature and stamp.',
    },
    field: {
      fi: 'Kokeiltu Budapestissa 11/2026: resepti puhelimen näytöltä tai tulosteena hylättiin 3/5 apteekissa.',
      en: 'Tried in Budapest, 11/2026: a prescription on a phone or as a printout was refused at 3 of 5 pharmacies.',
    },
    source: KANTA,
    language: 'hu',
    variants: ['paper'],
  },
  {
    code: 'IT',
    inCountry: { fi: 'Italiassa', en: 'in Italy' },
    inLanguage: { fi: 'italiaksi', en: 'in Italian' },
    status: not('Italiassa', 'in Italy'),
    tip: PHARMACIST,
    field: {
      fi: 'Kokeiltu Milanossa ja Roomassa 11/2026: resepti puhelimen näytöltä kävi Milanossa 4/4 apteekissa, ja Roomassa 3/3 apteekkia olisi toimittanut lääkkeen.',
      en: 'Tried in Milan and Rome, 11/2026: a prescription on a phone was accepted at 4 of 4 pharmacies in Milan, and in Rome 3 of 3 would have dispensed.',
    },
    source: KANTA,
    language: 'it',
    variants: ['paper', 'doctorSends'],
  },
  {
    code: 'MT',
    inCountry: { fi: 'Maltalla', en: 'in Malta' },
    inLanguage: { fi: 'englanniksi', en: 'in English' },
    status: not('Maltalla', 'in Malta'),
    tip: {
      fi: 'Pyydä farmaseuttia: Maltalla ratkaisun tekee hän.',
      en: 'Ask for the pharmacist: in Malta the decision is theirs.',
    },
    field: {
      fi: 'Kokeiltu Maltalla 11/2026: resepti puhelimen näytöltä kävi 2/3 apteekissa. Kolmannessa farmaseutti ei ollut paikalla.',
      en: 'Tried in Malta, 11/2026: a prescription on a phone was accepted at 2 of 3 pharmacies. At the third no pharmacist was on duty.',
    },
    source: KANTA,
    language: 'en',
    variants: ['paper'],
  },
  {
    code: 'SI',
    inCountry: { fi: 'Sloveniassa', en: 'in Slovenia' },
    inLanguage: { fi: 'sloveeniksi', en: 'in Slovenian' },
    status: not('Sloveniassa', 'in Slovenia'),
    tip: ASK_EMAIL,
    field: {
      fi: 'Kokeiltu Ljubljanassa 11/2026: sähköpostilla lähetetty resepti kävi 2/3 apteekissa. Kolmas vaati alkuperäisen paperireseptin tai paikallisen reseptin.',
      en: 'Tried in Ljubljana, 11/2026: a prescription sent by email was accepted at 2 of 3 pharmacies. The third required the paper original or a local prescription.',
    },
    source: KANTA,
    language: 'sl',
    variants: ['paper', 'doctorSends'],
  },
  {
    code: 'SK',
    inCountry: { fi: 'Slovakiassa', en: 'in Slovakia' },
    inLanguage: { fi: 'slovakiksi', en: 'in Slovak' },
    status: not('Slovakiassa', 'in Slovakia'),
    tip: {
      fi: 'Kysy apteekista, voiko reseptin lähettää sinne sähköpostilla. Käytäntö vaihtelee apteekista toiseen.',
      en: 'Ask the pharmacy whether the prescription can be emailed to them. Practice varies from one pharmacy to the next.',
    },
    field: {
      fi: 'Kokeiltu Bratislavassa 11/2026, 6 apteekkia: useampi hyväksyi sähköpostilla lähetetyn reseptin, ja osa vaati paperisen.',
      en: 'Tried in Bratislava, 11/2026, 6 pharmacies: several accepted a prescription sent by email, and some required the paper one.',
    },
    source: KANTA,
    language: 'sk',
    variants: ['paper', 'doctorSends'],
  },
];
