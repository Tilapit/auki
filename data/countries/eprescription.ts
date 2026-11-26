/**
 * Electronic prescriptions across borders, pair by pair (PLAN.md section 8): can an
 * e-prescription written in one country be dispensed in another?
 *
 * There is no European list to read this from. The Commission's page on the service
 * (MyHealth@EU) names no country, and Your Europe gives one example. So the pairs come from
 * each country's own official page, read on the date in data/countries/sources.ts: the
 * countries where its e-prescriptions are dispensed (`outbound`), and the countries whose
 * e-prescriptions its pharmacies dispense (`inbound`). A pair is said to work when a page says
 * so, to not work when a page that lists its partners leaves it out, and to be unknown when no
 * page was read for either side. The app never fills a gap from one pair to another.
 *
 * Every list below is quoted in docs/research/prescriptions-across-borders.md.
 */

import type { Locale } from '../../lib/i18n';
import type { SourceId } from './sources.ts';

type Text = Record<Locale, string>;

export interface Note {
  text: Text;
  source: SourceId;
}

export interface ExchangePage {
  source: SourceId;
  /** Where an e-prescription written in this country is dispensed. */
  outbound: string[];
  /** Whose e-prescriptions this country's pharmacies dispense. */
  inbound: string[];
  /**
   * The page is too old to say what is missing: a pair it leaves out is not taken as a "no".
   * Croatia's only notice with a list is from October 2022.
   */
  dated?: boolean;
  /** What the page asks of its own people before they travel, when the pair works. */
  forOwn?: Text;
  /** What it says to visitors with an e-prescription from another country, when the pair works. */
  forVisitors?: Text;
}

const EIGHT = ['HR', 'CZ', 'EE', 'LV', 'LT', 'PL', 'PT', 'ES'];

/** One page per country that publishes its partners. Finland's is two Kanta pages with the same eight countries. */
export const EXCHANGE: Record<string, ExchangePage> = {
  FI: {
    source: 'kantaAbroad',
    outbound: EIGHT,
    inbound: EIGHT,
    forOwn: {
      fi: 'Ota mukaan passi tai henkilökortti ja asioi itse. Resepti ei käy ulkomailla, jos lääke on määrätty ajalle (esimerkiksi ”2 vuoden annos”) eikä pakkauksina tai kokonaismääränä, tai jos reseptillä on luovutuskielto.',
      en: 'Bring your passport or identity card, and go yourself. The prescription does not work abroad if the medicine is prescribed for a period of time (“2-year dose”) and not as packages or a total amount, or if you have set a denial of consent on it.',
    },
    forVisitors: {
      fi: 'Resepti käy jokaisessa Suomen apteekissa. Asioi itse ja ota mukaan passi tai kuvallinen henkilökortti. Jos kotimaasi vaatii suostumuksen reseptitietojen luovuttamiseen, anna se ennen apteekkiin menoa.',
      en: 'Any pharmacy in Finland can dispense it. Go in person with your passport or a photo identity card. If your country asks for consent before prescription data is shared, give it before you go to the pharmacy.',
    },
  },
  EE: {
    source: 'tehik',
    outbound: ['ES', 'HR', 'GR', 'CY', 'LT', 'LV', 'PL', 'PT', 'FI', 'CZ'],
    inbound: ['ES', 'HR', 'GR', 'CY', 'LT', 'LV', 'PL', 'PT', 'FI', 'CZ'],
  },
  PL: {
    source: 'pacjent',
    outbound: ['HR', 'CY', 'CZ', 'EE', 'FI', 'GR', 'LT', 'LV', 'PT', 'ES'],
    inbound: ['PT', 'GR', 'EE', 'LT', 'LV', 'FI', 'CZ', 'HR', 'CY', 'ES'],
    forOwn: {
      fi: 'Anna ensin suostumus rajat ylittävään e-reseptiin Puolan potilastilillä (Internetowe Konto Pacjenta). Palvelu on täysi-ikäisille, ja apteekissa näytetään kuvallinen henkilötodistus.',
      en: 'First give your consent to the cross-border e-prescription in the Internet Patient Account (Internetowe Konto Pacjenta). The service is for adults, and the pharmacy asks for an identity document with a photo.',
    },
  },
  ES: {
    source: 'sanidad',
    // The ministry's list does not split the two directions. It says every region works as issuer and as receiver.
    outbound: ['AT', 'CZ', 'CY', 'HR', 'EE', 'FI', 'GR', 'LV', 'LT', 'PL', 'PT'],
    inbound: ['AT', 'CZ', 'CY', 'HR', 'EE', 'FI', 'GR', 'LV', 'LT', 'PL', 'PT'],
    forOwn: {
      fi: 'Ota mukaan oma terveyskorttisi (tarjeta sanitaria) ja, jos siinä ei ole kuvaa, kuvallinen henkilötodistus. Eurooppalainen sairaanhoitokortti ei käy tähän. Reseptin on oltava oman itsehallintoalueesi kirjoittama.',
      en: 'Bring your own health card (tarjeta sanitaria) and, if it has no photo, an official photo document. The European Health Insurance Card is not valid for this. The prescription must have been written in your own autonomous community.',
    },
    forVisitors: {
      fi: 'Näytä kuvallinen henkilötodistus. Palvelu on käytössä kaikilla alueilla paitsi La Riojassa, jossa sitä vasta rakennetaan.',
      en: 'Show an identity document with a photo. The service runs in every region except La Rioja, where it is still being built.',
    },
  },
  PT: {
    source: 'sns24',
    outbound: ['HR', 'EE', 'FI', 'ES', 'PL', 'CZ', 'GR', 'LV', 'LT', 'CY'],
    inbound: ['FI', 'EE', 'HR', 'ES', 'PL', 'LT'],
    forOwn: {
      fi: 'Anna ensin lupa terveystietojesi jakamiseen SNS 24 -portaalin Autorizações-palvelussa. Apteekissa tarvitaan kansalaiskortti (Cartão de Cidadão) sekä reseptin tunnus ja PIN-koodi.',
      en: 'First authorise the sharing of your health data in the Autorizações service of the SNS 24 portal. At the pharmacy you need your Citizen Card (Cartão de Cidadão) and the prescription’s ID and PIN.',
    },
    forVisitors: {
      fi: 'Vain palveluun liittyneissä apteekeissa: ne on merkitty tarralla, joka kertoo, minkä maiden reseptit käyvät.',
      en: 'Only at pharmacies that have joined the service: they carry a sticker that names the countries whose prescriptions they take.',
    },
  },
  HR: {
    source: 'hzzo',
    dated: true,
    outbound: ['FI', 'EE', 'PT', 'ES'],
    inbound: ['FI', 'EE', 'PT', 'PL', 'ES'],
    forOwn: {
      fi: 'Anna ensin suostumus Portal zdravlja -palvelussa. Palvelu koskee kertareseptejä.',
      en: 'First give your consent in Portal zdravlja. The service is for non-repeat prescriptions.',
    },
  },
  CZ: {
    source: 'epreskripce',
    outbound: ['EE', 'FI', 'HR', 'CY', 'LT', 'LV', 'PL', 'AT', 'GR', 'ES'],
    inbound: ['EE', 'FI', 'CY', 'LT', 'LV', 'PL', 'PT', 'AT', 'GR', 'ES'],
  },
  LV: {
    source: 'eveseliba',
    outbound: ['AT', 'CZ', 'EE', 'GR', 'HR', 'CY', 'LT', 'PL', 'FI', 'ES'],
    inbound: ['AT', 'CZ', 'EE', 'GR', 'HR', 'CY', 'LT', 'PL', 'PT', 'FI', 'ES'],
    forOwn: {
      fi: 'Näytä apteekissa passi tai eID-kortti. Vaikuttavalla aineella kirjoitettu e-resepti ei käy toisessa maassa.',
      en: 'Show your passport or eID card at the pharmacy. An e-prescription written by active substance cannot be used in another country.',
    },
  },
  LT: {
    source: 'esveikata',
    outbound: ['LV', 'PL', 'ES', 'GR', 'PT', 'EE', 'CZ', 'FI', 'HR', 'CY'],
    inbound: ['LV', 'PL', 'ES', 'GR', 'PT', 'EE', 'CZ', 'FI', 'HR', 'CY'],
    forOwn: {
      fi: 'Näytä apteekissa passi tai henkilökortti. Koko määrätty määrä on ostettava kerralla.',
      en: 'Show your passport or identity card at the pharmacy. The whole prescribed quantity has to be bought at once.',
    },
  },
  GR: {
    source: 'ncpehealth',
    outbound: ['ES', 'PL', 'EE', 'LT', 'CZ', 'CY', 'LV'],
    inbound: ['ES', 'PL', 'EE', 'LT', 'CZ', 'CY', 'PT', 'LV'],
    forOwn: {
      fi: 'Näytä apteekissa henkilökortti tai passi. Kauppanimellä kirjoitettu resepti ei käy toisessa maassa.',
      en: 'Show your identity card or passport at the pharmacy. A prescription written by brand name cannot be used in another country.',
    },
    forVisitors: {
      fi: 'Resepti käy kaikissa Kreikan apteekeissa.',
      en: 'Every pharmacy in Greece can dispense it.',
    },
  },
};

/** Finland's list of whose e-prescriptions it dispenses is on another Kanta page than its list of where its own are dispensed. */
const INBOUND_SOURCE: Partial<Record<string, SourceId>> = { FI: 'kantaForeign' };

/**
 * Countries whose own authorities say that pharmacies there take no e-prescription from
 * another country today, whoever wrote it.
 */
export const NO_FOREIGN: Record<string, Note> = {
  SE: {
    source: 'ehalsomyndigheten',
    text: {
      fi: 'Ruotsin apteekit eivät toistaiseksi pysty käsittelemään muiden maiden sähköisiä reseptejä.',
      en: 'Swedish pharmacies cannot currently handle e-prescriptions from other countries.',
    },
  },
  DK: {
    source: 'lifeInDenmark',
    text: {
      fi: 'Tanskan lääkeviraston mukaan reseptejä ei toistaiseksi voi välittää sähköisesti jäsenmaasta toiseen.',
      en: 'The Danish Medicines Agency says that for the time being prescriptions cannot be issued electronically across the member states.',
    },
  },
  NO: {
    source: 'helsedirektoratetMyHealth',
    text: {
      fi: 'Norjassa muiden maiden sähköisten reseptien vastaanotto on rakennettu, mutta sitä ei ole otettu käyttöön.',
      en: 'In Norway the receiving of e-prescriptions from other countries has been built but is not in use.',
    },
  },
  DE: {
    source: 'gematik',
    text: {
      fi: 'Saksan e-reseptipalvelusta vastaavan gematikin mukaan muiden EU-maiden sähköisiä reseptejä ei vielä voi lunastaa Saksassa.',
      en: 'gematik, which runs Germany’s e-prescription service, says e-prescriptions from other EU countries cannot yet be redeemed in Germany.',
    },
  },
  CH: {
    source: 'swissPositionPaper',
    text: {
      fi: 'Sveitsin apteekkien ohjeen mukaan ainoa hyväksytty sähköinen resepti on Sveitsin oma.',
      en: 'By the Swiss guidance for pharmacies, the only recognised electronic prescription is Switzerland’s own.',
    },
  },
};

/** Countries whose own authorities say that their e-prescription cannot be used abroad today. */
export const NOT_ABROAD: Record<string, Note> = {
  NO: {
    source: 'helsenorge',
    text: {
      fi: 'Helsenorgen mukaan norjalaisen reseptin käyttöön ulkomailla tarvitaan paperinen resepti. E-reseptin tuloste ei riitä.',
      en: 'Helsenorge says that to use a Norwegian prescription abroad you need a paper prescription. A printout of an e-prescription is not enough.',
    },
  },
  DK: NO_FOREIGN.DK,
};

/** Where only some pharmacies take part, by the statement of another country's ministry about the service as a whole. */
const SOME_PHARMACIES: Partial<Record<string, Note>> = {
  CZ: {
    source: 'sanidad',
    text: { fi: 'Tšekissä palvelu ei ole käytössä kaikissa apteekeissa.', en: 'In Czechia the service is not available in every pharmacy.' },
  },
  PT: {
    source: 'sanidad',
    text: { fi: 'Portugalissa palvelu ei ole käytössä kaikissa apteekeissa.', en: 'In Portugal the service is not available in every pharmacy.' },
  },
};

/** What one country's page says of one destination only. */
const PAIR_NOTES: Record<string, Note> = {
  'FI>PL': { source: 'kantaAbroad', text: { fi: 'Puolan apteekeista mukana on noin 90\u00A0%.', en: 'About 90% of pharmacies in Poland take part.' } },
  'FI>CZ': { source: 'kantaAbroad', text: { fi: 'Apteekit, joissa suomalainen resepti käy, voi tarkistaa Tšekin viranomaisen sivulta epreskripce.gov.cz.', en: 'The pharmacies that accept a Finnish prescription are listed on the Czech authority’s site, epreskripce.gov.cz.' } },
  'FI>PT': { source: 'kantaAbroad', text: { fi: 'Apteekit, joissa suomalainen resepti käy, voi tarkistaa Portugalin viranomaisen sivulta spms.min-saude.pt.', en: 'The pharmacies that accept a Finnish prescription are listed on the Portuguese authority’s site, spms.min-saude.pt.' } },
};

export type EPrescription =
  /** A page says the pair works. `sources`: the home country's page, the other country's, or both. */
  | { status: 'works'; sources: SourceId[]; notes: Note[] }
  /** Pharmacies of the country one is in take no e-prescription from abroad, by its own authorities. */
  | { status: 'notHere'; sources: SourceId[]; notes: Note[] }
  /** The home country's own authorities say its e-prescription can't be used abroad. */
  | { status: 'notAbroad'; sources: SourceId[]; notes: Note[] }
  /** A page that lists its partners was read, and this pair is not among them. */
  | { status: 'notListed'; sources: SourceId[]; notes: Note[] }
  /** One country's page says yes and the other's, as current, leaves the pair out. */
  | { status: 'disagree'; sources: SourceId[]; notes: Note[] }
  /** No official statement was found for either side. */
  | { status: 'unknown'; sources: SourceId[]; notes: Note[] };

const inboundSource = (country: string): SourceId => INBOUND_SOURCE[country] ?? EXCHANGE[country].source;

/** What the official pages say about an e-prescription written in `home` and taken to a pharmacy in `here`. */
export function ePrescription(home: string, here: string): EPrescription {
  const from = EXCHANGE[home];
  const to = EXCHANGE[here];
  const sent = from?.outbound.includes(here) ?? false;
  const taken = to?.inbound.includes(home) ?? false;

  if (NO_FOREIGN[here]) return { status: 'notHere', sources: [NO_FOREIGN[here].source], notes: [NO_FOREIGN[here]] };

  if (sent || taken) {
    // A page that is current and leaves the pair out, against one that has it: say so, don't pick a side.
    const denied = (sent && to && !to.dated && !taken) || (taken && from && !from.dated && !sent);
    const sources = [...(sent ? [from.source] : []), ...(taken ? [inboundSource(here)] : [])];
    if (denied) return { status: 'disagree', sources: [from!.source, inboundSource(here)], notes: [] };
    const notes: Note[] = [];
    if (from?.forOwn) notes.push({ text: from.forOwn, source: from.source });
    const pair = PAIR_NOTES[`${home}>${here}`];
    if (pair) notes.push(pair);
    else if (to?.forVisitors) notes.push({ text: to.forVisitors, source: inboundSource(here) });
    else if (SOME_PHARMACIES[here]) notes.push(SOME_PHARMACIES[here]);
    return { status: 'works', sources: [...new Set(sources)], notes };
  }

  if (NOT_ABROAD[home]) return { status: 'notAbroad', sources: [NOT_ABROAD[home].source], notes: [NOT_ABROAD[home]] };

  // Pages that list their partners, and are current enough to be read for what they leave out.
  const silent = [...(from && !from.dated ? [from.source] : []), ...(to && !to.dated ? [inboundSource(here)] : [])];
  if (silent.length > 0) return { status: 'notListed', sources: silent, notes: [] };
  return { status: 'unknown', sources: ['yourEurope'], notes: [] };
}
