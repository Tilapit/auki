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
import { date } from '../../lib/format.ts';
import type { CardPhrases, CardVariant } from '../../lib/types';
import { EXCHANGE, ePrescription, type EPrescription, type Note } from './eprescription.ts';
import { HERE, hereOf, type Here } from './here.ts';
import { HOMES, OTHER, homeOf, inEea } from './homes.ts';
import { paper, type PaperStatus } from './paper.ts';
import { cardFor } from './phrases.ts';
import { SOURCES, type Source, type SourceId } from './sources.ts';

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

function electronic(status: Exclude<EPrescription['status'], 'notListed'>, from: Text, to: Text): Text {
  switch (status) {
    case 'works':
      return { fi: `${from.fi} kirjoitettu sähköinen resepti käy ${to.fi}.`, en: `An e-prescription written ${from.en} can be used ${to.en}.` };
    case 'notHere':
      return { fi: `Toisessa maassa kirjoitettu sähköinen resepti ei käy ${to.fi}.`, en: `An e-prescription written in another country cannot be used ${to.en}.` };
    case 'notAbroad':
      return { fi: `${from.fi} kirjoitettu sähköinen resepti ei käy ulkomailla.`, en: `An e-prescription written ${from.en} cannot be used abroad.` };
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

/** Whose page a source is: its label up to the colon, "TEHIK (Viro)". */
const publisher = (source: SourceId, locale: Locale): string => SOURCES[source].label[locale].split(': ')[0];

/** "TEHIK (Viro), luettu 26.11.2026": whose list it is, with the page's own date where it shows one and the day it was read where it shows none. */
function listOf(source: SourceId): Text {
  const { updated, checked }: Source = SOURCES[source];
  return {
    fi: `${publisher(source, 'fi')}, ${updated ? `päivitetty ${date('fi', updated)}` : `luettu ${date('fi', checked)}`}`,
    en: `${publisher(source, 'en')}, ${updated ? `updated ${date('en', updated)}` : `read ${date('en', checked)}`}`,
  };
}

/** How a country stands as the last word of an English sentence: "Germany", "the Netherlands". */
const theCountry = (inCountry: Text): string => inCountry.en.replace(/^in /, '');

/**
 * A pair that a list of partners leaves out. Nobody has said that the e-prescription is
 * refused: a list was read and the country is not on it. So the answer is not "ei käy". It
 * says which list the country is missing from, whose list that is and its date, and where the
 * EU's rule covers the pair, that a paper prescription is the way that works.
 */
function notListed(home: string, here: string, names: { home?: Text; here: Text }, from: Text, to: Text, sources: SourceId[], onPaper: boolean): Text {
  const own = EXCHANGE[home] && !EXCHANGE[home].dated;
  const theirs = EXCHANGE[here] && !EXCHANGE[here].dated;
  const lists = sources.map(listOf);
  const found: Text =
    own && theirs
      ? {
          // Both lists, and this direction only: the other way round the same two countries may well be listed.
          fi: `Kummankaan maan luettelossa ei mainita, että ${from.fi} kirjoitettu sähköinen resepti kävisi ${to.fi}.`,
          en: `Neither country’s list says that an e-prescription written ${from.en} can be used ${to.en}.`,
        }
      : theirs
        ? names.home
          ? {
              fi: `${names.home.fi} ei ole niiden maiden luettelossa, joiden sähköiset reseptit käyvät ${to.fi}.`,
              en: `The list of countries whose e-prescriptions are dispensed ${to.en} does not include ${theCountry(from)}.`,
            }
          : {
              fi: `Niiden maiden luettelossa, joiden sähköiset reseptit käyvät ${to.fi}, ei ole maita EU:n ja Eta-alueen ulkopuolelta.`,
              en: `The list of countries whose e-prescriptions are dispensed ${to.en} has none from outside the EU and the EEA.`,
            }
        : {
            fi: `${names.here.fi} ei ole niiden maiden luettelossa, joissa ${from.fi} kirjoitettu sähköinen resepti käy.`,
            en: `The list of countries where an e-prescription written ${from.en} can be used does not include ${theCountry(to)}.`,
          };
  const whose: Text = {
    fi: `${lists.length > 1 ? 'Luettelot' : 'Luettelo'}: ${lists.map((list) => list.fi).join('; ')}.`,
    en: `${lists.length > 1 ? 'Lists' : 'List'}: ${lists.map((list) => list.en).join('; ')}.`,
  };
  const way: Text | undefined = onPaper ? { fi: 'Paperinen resepti käy EU:n säännön nojalla.', en: 'A paper prescription works under the EU’s rule.' } : undefined;
  return { fi: [found.fi, whose.fi, way?.fi].filter(Boolean).join(' '), en: [found.en, whose.en, way?.en].filter(Boolean).join(' ') };
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
      text:
        electronicFacts.status === 'notListed'
          ? notListed(code, place.code, { home: known?.name, here: homeOf(place.code)!.name }, from, to, electronicFacts.sources, paperFacts.status === 'recognised')
          : electronic(electronicFacts.status, from, to),
      notes: electronicFacts.notes,
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
