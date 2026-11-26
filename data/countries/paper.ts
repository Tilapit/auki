/**
 * Paper prescriptions across borders (PLAN.md section 8).
 *
 * The rule is the EU's: a prescription written in one EU or EEA country can be dispensed in
 * the others (Directive 2011/24/EU, Article 11, which the EEA Agreement has taken in), under
 * the dispensing country's own rules. Switzerland is outside it, in both directions. Finland
 * says more than the rule asks: it also takes paper prescriptions from Switzerland, and says in
 * so many words that it takes none from anywhere else.
 *
 * On top of the rule, what each country one can be in says of it, where its own authorities
 * were read. Each note names its source (data/countries/sources.ts).
 */

import type { Locale } from '../../lib/i18n';
import type { Note } from './eprescription.ts';
import { inEea, unionOf } from './homes.ts';
import type { SourceId } from './sources.ts';

type Text = Record<Locale, string>;

/**
 * recognised: the EU's rule covers the pair. accepted: outside the rule, and the country one
 * is in says it takes it (Finland, of Swiss prescriptions). notObliged: outside the rule, the
 * pharmacy need not take it. refused: the country one is in says it does not take it.
 * unknown: outside the rule and no official statement was found.
 */
export type PaperStatus = 'recognised' | 'accepted' | 'notObliged' | 'refused' | 'unknown';

export interface Paper {
  status: PaperStatus;
  sources: SourceId[];
  notes: Note[];
}

/** What the prescription has to show to be recognised: Your Europe's list, which is the directive's annex in plain words. */
export const REQUIRED: Text[] = [
  { fi: 'potilaan sukunimi, etunimi ja syntymäaika', en: 'the patient’s surname, first name and date of birth' },
  { fi: 'reseptin antamispäivä', en: 'the date the prescription was issued' },
  {
    fi: 'lääkärin sukunimi ja etunimi, ammatillinen pätevyys, suorat yhteystiedot, työosoite maineen ja allekirjoitus',
    en: 'the doctor’s surname and first name, professional qualification, direct contact details, work address with the country, and signature',
  },
  {
    fi: 'lääkkeen yleisnimi (ei kauppanimeä, joka voi olla toisessa maassa eri), muoto, määrä, vahvuus ja annostus',
    en: 'the medicine’s common name (not the brand name, which may differ in another country), form, quantity, strength and dosage',
  },
];

/** What holds for every pair the rule covers, from Your Europe. */
export const EVERYWHERE: Note[] = [
  {
    source: 'yourEurope',
    text: {
      fi: 'Apteekki noudattaa oman maansa sääntöjä, esimerkiksi aika- ja annosrajoja. Lääkettä ei välttämättä ole myynnissä siinä maassa, tai sillä on eri nimi.',
      en: 'The pharmacy applies its own country’s rules, such as time or dosage limits. The medicine may not be on sale in that country, or may have another name.',
    },
  },
];

/** What the authorities of the country one is in add, for a prescription the rule covers. */
const HERE_NOTES: Record<string, Note> = {
  FI: {
    source: 'euHealthcareFi',
    text: {
      fi: 'Suomessa lääkkeellä on oltava myyntilupa. Huumausaineiksi luokiteltavia ja tiettyjä keskushermostoon vaikuttavia lääkkeitä ei voi ostaa toisessa maassa kirjoitetulla reseptillä. Apteekki voi kieltäytyä, jos se epäilee reseptin aitoutta.',
      en: 'In Finland the medicine has to be licensed for sale there. Medicines classified as narcotics and certain medicines that affect the central nervous system cannot be bought with a prescription written in another country. A pharmacy may decline if it doubts that the prescription is genuine.',
    },
  },
  SE: {
    source: 'ehalsomyndigheten',
    text: {
      fi: 'Ruotsissa käy vain rajat ylittävää käyttöä varten kirjoitettu paperinen resepti. Sähköpostilla saatu ja itse tulostettu resepti ei kelpaa. Huumausaineiksi luokiteltuja lääkkeitä ei toimiteta toisen maan reseptillä.',
      en: 'In Sweden it has to be a paper prescription written for cross-border use. A prescription you received by email and printed yourself is not valid. Medicines classified as narcotics are not dispensed on a prescription from another country.',
    },
  },
  NO: {
    source: 'helsedirektoratetEea',
    text: {
      fi: 'Norjassa toimitetaan Eta-maan reseptillä vain reseptiryhmän C lääkkeitä, joilla on myyntilupa Norjassa. Apteekki voi kieltäytyä, jos reseptin aitoutta, sisältöä tai ymmärrettävyyttä on perusteltua syytä epäillä.',
      en: 'In Norway a prescription from an EEA country is dispensed only for medicines in prescription group C that are authorised in Norway. The pharmacy may refuse on justified doubt about the prescription’s authenticity, content or comprehensibility.',
    },
  },
  DK: {
    source: 'lifeInDenmark',
    text: {
      fi: 'Tanskan lääkeviraston mukaan toisen EU- tai Eta-maan lääkärin tai hammaslääkärin kirjoittama resepti voidaan toimittaa tanskalaisessa apteekissa.',
      en: 'The Danish Medicines Agency says a prescription issued by a doctor or dentist in another EU or EEA country can be dispensed by a Danish pharmacy.',
    },
  },
  DE: {
    source: 'euPatienten',
    text: {
      fi: 'Saksan kansallisen yhteyspisteen mukaan toisessa jäsenmaassa kirjoitetun reseptin lunastaminen Saksassa on periaatteessa mahdollista. Lääkettä ei aina ole Saksassa saatavana samassa muodossa tai samalla nimellä.',
      en: 'Germany’s national contact point says redeeming a prescription written in another member state is possible in principle in Germany. The medicine is not always available there in the same form or under the same name.',
    },
  },
};

const SWISS: Note = {
  source: 'swissPositionPaper',
  text: {
    fi: 'Sveitsin apteekkien ohjeen mukaan ulkomainen resepti ei periaatteessa kelpaa, ja lääkkeen antaminen sen perusteella on farmaseutin omalla vastuulla ja harkinnassa.',
    en: 'By the Swiss guidance for pharmacies a foreign prescription is in principle not valid, and handing over a medicine on it is the pharmacist’s own decision and responsibility.',
  },
};

/** What the official pages say about a paper prescription written in `home` and taken to a pharmacy in `here`. */
export function paper(home: string, here: string): Paper {
  if (inEea(home) && inEea(here)) {
    const local = HERE_NOTES[here];
    return { status: 'recognised', sources: ['yourEurope', 'directive', ...(local ? [local.source] : [])], notes: [...(local ? [local] : []), ...EVERYWHERE] };
  }
  if (here === 'FI') {
    // Finland names the countries it takes paper prescriptions from: the EU, the EEA and Switzerland, and no other.
    if (unionOf(home) === 'ch') return { status: 'accepted', sources: ['kantaForeign', 'euHealthcareFi'], notes: [HERE_NOTES.FI] };
    return { status: 'refused', sources: ['euHealthcareFi'], notes: [] };
  }
  if (here === 'CH') return { status: 'notObliged', sources: ['yourEuropeFaq', 'swissPositionPaper'], notes: [SWISS] };
  if (unionOf(home) === 'ch') return { status: 'notObliged', sources: ['yourEuropeFaq'], notes: [] };
  return { status: 'unknown', sources: ['yourEurope'], notes: [] };
}
