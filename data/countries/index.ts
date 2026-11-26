/**
 * The prescription guidance as the app reads it (PLAN.md section 8): for a prescription from
 * one country (`home`) and a pharmacy in another (`here`), what the "Resepti kotimaasta?"
 * banner says and what the counter card shows.
 *
 * Every sentence a pair gets is one of a few, picked by what the official pages say
 * (eprescription.ts, paper.ts), with the two countries' names put in. Nothing is said about a
 * pair that no page speaks of, except that nothing was found.
 */

import type { Locale } from '../../lib/i18n';
import type { CardPhrases, CardVariant } from '../../lib/types';
import { EXCHANGE, ePrescription, type EPrescription, type Note } from './eprescription.ts';
import { HERE, hereOf, type Here } from './here.ts';
import { HOMES, OTHER, homeOf, inEea } from './homes.ts';
import { paper, type PaperStatus } from './paper.ts';
import { cardFor } from './phrases.ts';
import type { SourceId } from './sources.ts';

export { EXCHANGE, NO_FOREIGN, NOT_ABROAD, ePrescription } from './eprescription.ts';
export type { Note } from './eprescription.ts';
export { HERE, hereOf } from './here.ts';
export { HOMES, OTHER, homeFromLanguages, homeOf, homesFor, inEea } from './homes.ts';
export { EVERYWHERE, REQUIRED, paper } from './paper.ts';
export { PHRASES, cardFor, countryName } from './phrases.ts';
export { SOURCES } from './sources.ts';
export type { Source, SourceId } from './sources.ts';

type Text = Record<Locale, string>;

export interface Guide {
  /** The country the prescription is from: one of HOMES, or OTHER. */
  home: string;
  /** The country of the pharmacy: one of HERE. */
  here: string;
  ePrescription: { status: EPrescription['status']; text: Text; notes: Note[]; sources: SourceId[] };
  paper: { status: PaperStatus; text: Text; notes: Note[]; sources: SourceId[] };
  /** The research trip's result in this country, made with prescriptions from Finland. */
  field?: Text;
  /** "latviaksi" / "in Latvian": the language of the counter card. */
  inLanguage: Text;
  card: CardPhrases;
}

/** How a home country outside the list stands in a sentence. */
const ELSEWHERE: Text = { fi: 'EU:n ja Eta-alueen ulkopuolella', en: 'outside the EU and the EEA' };

function electronic(status: EPrescription['status'], from: Text, to: Text): Text {
  switch (status) {
    case 'works':
      return { fi: `${from.fi} kirjoitettu sähköinen resepti käy ${to.fi}.`, en: `An e-prescription written ${from.en} can be used ${to.en}.` };
    case 'notHere':
      return { fi: `Toisessa maassa kirjoitettu sähköinen resepti ei käy ${to.fi}.`, en: `An e-prescription written in another country cannot be used ${to.en}.` };
    case 'notAbroad':
      return { fi: `${from.fi} kirjoitettu sähköinen resepti ei käy ulkomailla.`, en: `An e-prescription written ${from.en} cannot be used abroad.` };
    case 'notListed':
      return { fi: `${from.fi} kirjoitettu sähköinen resepti ei käy ${to.fi}.`, en: `An e-prescription written ${from.en} cannot be used ${to.en}.` };
    case 'disagree':
      return {
        fi: `Maiden omat sivut kertovat eri tavoin, käykö ${from.fi} kirjoitettu sähköinen resepti ${to.fi}.`,
        en: `The two countries’ own pages disagree on whether an e-prescription written ${from.en} can be used ${to.en}.`,
      };
    case 'unknown':
      return {
        fi: `Virallista tietoa siitä, käykö ${from.fi} kirjoitettu sähköinen resepti ${to.fi}, ei löytynyt. EU:n ohje on pyytää lääkäriltä myös paperinen resepti.`,
        en: `No official statement was found on whether an e-prescription written ${from.en} can be used ${to.en}. The EU’s advice is to ask your doctor for a paper prescription as well.`,
      };
  }
}

/** Why a pair that no list has is said not to work: whose list it is missing from. */
function missing(home: string, here: string, from: Text, to: Text, sources: SourceId[]): Note[] {
  const own = EXCHANGE[home] && !EXCHANGE[home].dated;
  const theirs = EXCHANGE[here] && !EXCHANGE[here].dated;
  const text: Text =
    own && theirs
      ? { fi: 'Kumpikaan maa ei mainitse toista omassa luettelossaan.', en: 'Neither country’s own list includes the other.' }
      : theirs
        ? {
            fi: `Luettelossa maista, joiden sähköiset reseptit käyvät ${to.fi}, ei ole tätä maata.`,
            en: `The list of countries whose e-prescriptions are dispensed ${to.en} does not include this one.`,
          }
        : {
            fi: `Luettelossa maista, joissa ${from.fi} kirjoitettu sähköinen resepti käy, ei ole tätä maata.`,
            en: `The list of countries where an e-prescription written ${from.en} can be used does not include this one.`,
          };
  return [{ text, source: sources[0] }];
}

function onPaper(status: PaperStatus, home: string, here: string, from: Text, to: Text): Text {
  switch (status) {
    case 'recognised':
      return { fi: `${from.fi} kirjoitettu paperinen resepti kelpaa ${to.fi}, kun siinä on vaaditut tiedot.`, en: `A paper prescription written ${from.en} is valid ${to.en} when it has the required details.` };
    case 'accepted':
      return { fi: `${from.fi} kirjoitetulla paperisella reseptillä voi ostaa lääkkeitä ${to.fi}.`, en: `A paper prescription written ${from.en} can be used to buy medicines ${to.en}.` };
    case 'notObliged':
      return here === 'CH'
        ? { fi: 'Sveitsin apteekkien ei tarvitse hyväksyä muissa maissa kirjoitettuja reseptejä.', en: 'Pharmacies in Switzerland are not obliged to accept prescriptions written in other countries.' }
        : { fi: 'EU-maiden ei tarvitse hyväksyä Sveitsissä kirjoitettuja reseptejä.', en: 'EU countries are not obliged to recognise prescriptions written in Switzerland.' };
    case 'refused':
      return { fi: 'EU- ja Eta-maiden sekä Sveitsin ulkopuolella kirjoitettu resepti ei käy Suomessa.', en: 'A prescription written outside the EU, the EEA and Switzerland is not accepted in Finland.' };
    case 'unknown':
      return {
        fi: `EU:n sääntö toisessa maassa kirjoitetuista resepteistä koskee EU- ja Eta-maiden reseptejä. Virallista tietoa siitä, käykö ${from.fi} kirjoitettu resepti ${to.fi}, ei löytynyt.`,
        en: `The EU’s rule on prescriptions from another country covers those written in EU and EEA countries. No official statement was found on whether a prescription written ${from.en} is accepted ${to.en}.`,
      };
  }
}

/** The card's variants for a pair: e-prescription lines only where a page says the pair works. */
function variantsFor(status: EPrescription['status'], here: Here): CardVariant[] {
  return [...(status === 'works' || status === 'disagree' ? (['ePrescription'] as const) : []), 'paper', ...(here.doctorSends ? (['doctorSends'] as const) : [])];
}

/**
 * The guidance for a prescription from `home` at a pharmacy in `here`. Undefined at home, in a
 * country the app does not cover, and while the home country is not known: then there is
 * nothing to say yet, and the banner asks.
 */
export function guideFor(home: string | undefined, here: string | undefined): Guide | undefined {
  const place = hereOf(here);
  if (!place || !home || home === place.code) return undefined;
  const known = homeOf(home);
  const code = known ? known.code : OTHER;
  const from = known ? known.inCountry : ELSEWHERE;
  const to = place.inCountry;

  const electronicFacts = ePrescription(code, place.code);
  const paperFacts = paper(code, place.code);
  const card = cardFor(place.language, variantsFor(electronicFacts.status, place), { code: known?.code, eea: inEea(code) });
  if (!card) return undefined;

  return {
    home: code,
    here: place.code,
    ePrescription: {
      status: electronicFacts.status,
      text: electronic(electronicFacts.status, from, to),
      notes: electronicFacts.status === 'notListed' ? missing(code, place.code, from, to, electronicFacts.sources) : electronicFacts.notes,
      sources: electronicFacts.sources,
    },
    paper: { status: paperFacts.status, text: onPaper(paperFacts.status, code, place.code, from, to), notes: paperFacts.notes, sources: paperFacts.sources },
    ...(place.field ? { field: place.field } : {}),
    inLanguage: place.inLanguage,
    card,
  };
}

/** Every pair the app can be asked about: for the tests, and for reading the texts through in /dev/states. */
export function everyPair(): { home: string; here: string }[] {
  return [...HOMES.map((entry) => entry.code), OTHER].flatMap((home) => HERE.filter((place) => place.code !== home).map((place) => ({ home, here: place.code })));
}
