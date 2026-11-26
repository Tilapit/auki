import { describe, expect, it } from 'vitest';
import {
  EVERYWHERE,
  EXCHANGE,
  HERE,
  HOMES,
  NOT_ABROAD,
  NO_FOREIGN,
  OTHER,
  PHRASES,
  REQUIRED,
  SOURCES,
  cardFor,
  countryName,
  ePrescription,
  everyPair,
  guideFor,
  homeFromLanguages,
  homesFor,
  paper,
  type Guide,
  type Source,
  type SourceId,
} from '@/data/countries';
import { COUNTRY_CODES } from '@/lib/countries';
import { kamppi, resultOf, HERE as POSITION, MONDAY_EVENING } from '@/lib/fixtures/tiles';
import { suggestedHome } from '@/lib/home';
import { toScene } from '@/lib/live';

/**
 * The prescription guidance (data/countries/, PLAN.md section 8): what the "Resepti
 * kotimaasta?" banner and the counter card are made of, for a prescription from any country
 * at a pharmacy in any covered one. These hold the rules the data and the texts have to keep,
 * whoever edits them next.
 */

const pairs = everyPair();
const guides = pairs.map(({ home, here }) => ({ home, here, guide: guideFor(home, here)! }));
const key = (home: string, here: string) => `${home} to ${here}`;
const textsOf = (guide: Guide) => [guide.ePrescription.text, guide.paper.text, ...guide.ePrescription.notes.map((note) => note.text), ...guide.paper.notes.map((note) => note.text), ...(guide.field ? [guide.field] : [])];

describe('the countries', () => {
  it('one can be in every covered country, Finland among them', () => {
    expect(HERE.map((place) => place.code).sort()).toEqual([...COUNTRY_CODES].sort());
  });

  it('a prescription can be from any EU or EEA country, Switzerland or the United Kingdom, each once', () => {
    const codes = HOMES.map((home) => home.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(HOMES.filter((home) => home.union === 'eu')).toHaveLength(27);
    expect(HOMES.filter((home) => home.union === 'eea').map((home) => home.code).sort()).toEqual(['IS', 'LI', 'NO']);
    expect(HOMES.filter((home) => home.union === 'ch').map((home) => home.code)).toEqual(['CH']);
    expect(HOMES.filter((home) => home.union === 'none').map((home) => home.code)).toEqual(['GB']);
    // Every country one can be in is a country one can be from.
    for (const place of HERE) expect(codes, place.code).toContain(place.code);
  });

  it('names each as the browser’s own data does, in both languages', () => {
    for (const home of HOMES) {
      expect(home.name.fi, home.code).toBe(countryName(home.code, 'fi'));
      // The Unicode consortium says "Czechia" and "United Kingdom" as the app does.
      expect(home.name.en, home.code).toBe(countryName(home.code, 'en'));
      expect(home.inCountry.en, home.code).toMatch(new RegExp(`^in (the )?${home.name.en}$`));
      // The Finnish inessive, or the adessive of the island states: it begins as the name does.
      expect(home.inCountry.fi, home.code).toMatch(/(ssa|ssä|lla|llä)$/);
      expect(home.inCountry.fi.slice(0, 3), home.code).toBe(home.name.fi.slice(0, 3));
    }
    expect(homesFor('fi').map((home) => home.name.fi).slice(0, 3)).toEqual(['Alankomaat', 'Belgia', 'Bulgaria']);
    expect(homesFor('en').map((home) => home.name.en).slice(0, 3)).toEqual(['Austria', 'Belgium', 'Bulgaria']);
  });
});

describe('the home country the browser suggests', () => {
  it.each([
    [['fi-FI', 'en-US'], 'FI'],
    [['de-AT', 'de', 'en'], 'AT'],
    [['sv'], 'SE'],
    [['fi'], 'FI'],
    [['nb-NO'], 'NO'],
    // Many who are not British read their phone in British English: another language decides.
    [['en-GB', 'fi-FI'], 'FI'],
    [['en-GB', 'et'], 'EE'],
    // English alone gives its region.
    [['en-GB'], 'GB'],
    [['en-IE', 'en'], 'IE'],
    // A region the list does not know is passed over, not guessed at.
    [['en-US', 'de-DE'], 'DE'],
    [['es-MX', 'es-ES'], 'ES'],
  ])('%j is %s', (languages, home) => {
    expect(homeFromLanguages(languages)).toBe(home);
  });

  it.each([[['en-US']], [['en']], [['ja-JP', 'en-US']], [['not a tag']], [[]]])('%j suggests none: the banner asks', (languages) => {
    expect(homeFromLanguages(languages)).toBeUndefined();
  });

  it('falls back on the page’s own language, which only Finnish names a country by', () => {
    expect(suggestedHome(['en-US'], 'fi')).toBe('FI');
    expect(suggestedHome(['en-US'], 'en')).toBeUndefined();
    expect(suggestedHome(undefined, 'en')).toBeUndefined();
    expect(suggestedHome(['de-DE'], 'fi')).toBe('DE');
  });
});

describe('electronic prescriptions, pair by pair', () => {
  it('every page lists countries the app knows, never itself, and names a source that was read', () => {
    const known = HOMES.map((home) => home.code);
    for (const [country, page] of Object.entries(EXCHANGE)) {
      expect(known, country).toContain(country);
      for (const partner of [...page.outbound, ...page.inbound]) {
        expect(known, `${country}: ${partner}`).toContain(partner);
        expect(partner, country).not.toBe(country);
      }
      expect(new Set(page.outbound).size, country).toBe(page.outbound.length);
      expect(new Set(page.inbound).size, country).toBe(page.inbound.length);
      expect(SOURCES[page.source], country).toBeDefined();
    }
  });

  it('Finland’s eight are Kanta’s, in both directions', () => {
    // Kanta, read on 26 Nov 2026: Croatia, Czechia, Estonia, Latvia, Lithuania, Poland, Portugal, Spain.
    const eight = ['CZ', 'EE', 'ES', 'HR', 'LT', 'LV', 'PL', 'PT'];
    expect([...EXCHANGE.FI.outbound].sort()).toEqual(eight);
    expect([...EXCHANGE.FI.inbound].sort()).toEqual(eight);
    for (const here of HERE.map((place) => place.code).filter((code) => code !== 'FI')) {
      expect(ePrescription('FI', here).status === 'works', here).toBe(eight.includes(here));
    }
    for (const home of eight) expect(guideFor(home, 'FI')!.ePrescription.sources, home).toContain('kantaForeign');
  });

  it('no two current pages disagree about a pair today', () => {
    // When one does, the banner says that they disagree: this fails first, so that somebody reads both pages again.
    expect(guides.filter(({ guide }) => guide.ePrescription.status === 'disagree').map(({ home, here }) => key(home, here))).toEqual([]);
  });

  it('the pairs that work one way only are one way only', () => {
    // Each as both countries' pages have it: Portugal's prescriptions are dispensed in Czechia, Latvia and Greece, and not theirs in Portugal.
    for (const other of ['CZ', 'LV', 'GR']) {
      expect(ePrescription('PT', other).status, `PT to ${other}`).toBe('works');
      expect(ePrescription(other, 'PT').status, `${other} to PT`).toBe('notListed');
    }
  });

  it('a page from 2022 is not read for what it leaves out', () => {
    // Croatia's only notice with a list is from October 2022. Poland, Latvia and Lithuania list Croatia now.
    expect(EXCHANGE.HR.dated).toBe(true);
    expect((SOURCES[EXCHANGE.HR.source] as Source).updated).toBe('2022-10-20');
    for (const here of ['PL', 'LV', 'LT']) {
      const answer = ePrescription('HR', here);
      expect(answer.status, here).toBe('works');
      expect(answer.sources, here).toEqual([EXCHANGE[here].source]);
    }
    // Czechia says no in so many words: that stands. And with no other page to go by, nothing is claimed.
    expect(ePrescription('HR', 'CZ')).toMatchObject({ status: 'notListed', sources: ['epreskripce'] });
    expect(ePrescription('HR', 'AT').status).toBe('unknown');
    expect(ePrescription('DE', 'HR').status).toBe('unknown');
  });

  it('where the country one is in takes none from abroad, that is the answer for everyone', () => {
    expect(Object.keys(NO_FOREIGN).sort()).toEqual(['CH', 'DE', 'DK', 'NO', 'SE']);
    for (const here of Object.keys(NO_FOREIGN)) {
      for (const home of [...HOMES.map((entry) => entry.code), OTHER].filter((code) => code !== here)) {
        expect(ePrescription(home, here), key(home, here)).toMatchObject({ status: 'notHere', sources: [NO_FOREIGN[here].source] });
      }
    }
  });

  it('a pair is said to work only where a page that was read names it', () => {
    for (const { home, here, guide } of guides) {
      const sent = EXCHANGE[home]?.outbound.includes(here) ?? false;
      const taken = EXCHANGE[here]?.inbound.includes(home) ?? false;
      if (guide.ePrescription.status === 'works') expect(sent || taken, key(home, here)).toBe(true);
      // And nothing is claimed either way where no page speaks: the answer is that nothing was found.
      if (!EXCHANGE[home] && !EXCHANGE[here] && !NO_FOREIGN[here] && !NOT_ABROAD[home]) expect(guide.ePrescription.status, key(home, here)).toBe('unknown');
    }
  });

  it('says of every pair what was found, in one of six ways', () => {
    const counts: Record<string, number> = {};
    for (const { guide } of guides) counts[guide.ePrescription.status] = (counts[guide.ePrescription.status] ?? 0) + 1;
    // 33 countries one can be from, 21 one can be in, less the 21 pairs at home.
    expect(pairs).toHaveLength(33 * 21 - 21);
    expect(counts).toEqual({ works: 95, notListed: 238, notHere: 160, notAbroad: 32, unknown: 147 });
  });
});

describe('paper prescriptions', () => {
  it('the EU’s rule covers every pair of EU and EEA countries, and no other', () => {
    for (const { home, here, guide } of guides) {
      const covered = (code: string) => ['eu', 'eea'].includes(HOMES.find((entry) => entry.code === code)?.union ?? 'none');
      expect(guide.paper.status === 'recognised', key(home, here)).toBe(covered(home) && covered(here));
      if (guide.paper.status === 'recognised') {
        expect(guide.paper.sources, key(home, here)).toEqual(expect.arrayContaining(['yourEurope', 'directive']));
        expect(guide.paper.notes, key(home, here)).toEqual(expect.arrayContaining(EVERYWHERE));
      }
    }
  });

  it('Switzerland is outside it both ways, except that Finland says it takes Swiss paper prescriptions', () => {
    expect(paper('DE', 'CH')).toMatchObject({ status: 'notObliged', sources: ['yourEuropeFaq', 'swissPositionPaper'] });
    expect(paper('CH', 'DE')).toMatchObject({ status: 'notObliged', sources: ['yourEuropeFaq'] });
    expect(paper('CH', 'FI')).toMatchObject({ status: 'accepted', sources: ['kantaForeign', 'euHealthcareFi'] });
  });

  it('from outside the EU, the EEA and Switzerland: Finland says no, and of the rest nothing was found', () => {
    for (const home of ['GB', OTHER]) {
      expect(paper(home, 'FI'), home).toMatchObject({ status: 'refused', sources: ['euHealthcareFi'] });
      for (const here of ['LV', 'DE', 'ES', 'SE']) expect(paper(home, here).status, key(home, here)).toBe('unknown');
    }
  });

  it('lists what the prescription has to show, as Your Europe does: four things', () => {
    expect(REQUIRED).toHaveLength(4);
  });
});

describe('the sources', () => {
  it('each has a publisher’s name in both languages, an address, and the day it was read', () => {
    for (const [id, source] of Object.entries(SOURCES) as [string, Source][]) {
      expect(source.label.fi.length, id).toBeGreaterThan(8);
      expect(source.label.en.length, id).toBeGreaterThan(8);
      for (const url of Object.values(source.url)) expect(url, id).toMatch(/^https?:\/\/[a-z0-9.-]+\.[a-z]{2,}\//);
      expect(source.checked, id).toMatch(/^2026-\d\d-\d\d$/);
      if (source.updated !== undefined) {
        expect(source.updated, id).toMatch(/^20\d\d-\d\d-\d\d$/);
        // A page can't have been changed after it was read.
        expect(source.updated <= source.checked, id).toBe(true);
      }
    }
  });

  it('every answer names at least one, and every note its own', () => {
    for (const { home, here, guide } of guides) {
      expect(guide.ePrescription.sources.length, key(home, here)).toBeGreaterThan(0);
      expect(guide.paper.sources.length, key(home, here)).toBeGreaterThan(0);
      const named: SourceId[] = [...guide.ePrescription.sources, ...guide.paper.sources, ...guide.ePrescription.notes.map((note) => note.source), ...guide.paper.notes.map((note) => note.source)];
      for (const source of named) expect(SOURCES[source], `${key(home, here)}: ${source}`).toBeDefined();
    }
  });

  it('none is left unused', () => {
    const used = new Set<string>(guides.flatMap(({ guide }) => [...guide.ePrescription.sources, ...guide.paper.sources, ...guide.ePrescription.notes.map((note) => note.source), ...guide.paper.notes.map((note) => note.source)]));
    expect(Object.keys(SOURCES).filter((id) => !used.has(id))).toEqual([]);
  });
});

describe('the field results', () => {
  const tried = HERE.filter((place) => place.field);

  it('are there for every country the trip tried, with the month, a place and how many pharmacies', () => {
    // Sweden was not tried at a counter, and Finland is where the prescriptions were from.
    expect(HERE.filter((place) => !place.field).map((place) => place.code)).toEqual(['FI', 'SE']);
    for (const place of tried) {
      expect(place.field!.fi, place.code).toMatch(/^Kokeiltu \p{Lu}[^:]* 11\/2026[:,]/u);
      expect(place.field!.en, place.code).toMatch(/^Tried in \p{Lu}[^:]*, 11\/2026[:,]/u);
      // A count of pharmacies in both: "2/3 apteekista", "yksikään 6 apteekista", "2 of 3", "none of 6".
      expect(place.field!.fi, place.code).toMatch(/\d\/\d+ apteek|\d apteek/);
      expect(place.field!.en, place.code).toMatch(/\d of \d+|\d pharmacies/);
    }
  });

  it('say the same numbers in Finnish and in English', () => {
    for (const place of tried) {
      const fractions = (text: string, pattern: RegExp) => [...text.matchAll(pattern)].map((match) => `${match[1]}/${match[2]}`).sort();
      expect(fractions(place.field!.en, /(\d+) of (\d+)/g), place.code).toEqual(fractions(place.field!.fi, /(\d+)\/(\d+)(?!\d)(?!\/)/g).filter((fraction) => fraction !== '11/2026'));
    }
  });

  it('go with the country one is in, whoever’s prescription it is: the banner labels them as Finnish', () => {
    expect(guideFor('DE', 'LV')!.field).toEqual(guideFor('FI', 'LV')!.field);
    expect(guideFor('EE', 'FI')!.field).toBeUndefined();
  });
});

describe('the wording rules', () => {
  it('never offers a medicine without its prescription, and gives no medical advice', () => {
    for (const { home, here, guide } of guides) {
      for (const text of textsOf(guide)) {
        expect(text.fi, key(home, here)).not.toMatch(/ilman reseptiä|käsikauppa|itsehoito/i);
        expect(text.en, key(home, here)).not.toMatch(/without a prescription|over the counter/i);
      }
    }
  });

  it('follows the copy rules: no exclamation marks or em dashes, Finnish quotation marks, a hard space before the per cent sign', () => {
    for (const { home, here, guide } of guides) {
      for (const text of textsOf(guide)) {
        for (const line of [text.fi, text.en]) expect(line, key(home, here)).not.toMatch(/[!—]/);
        expect(text.fi, key(home, here)).not.toMatch(/["“]/);
        expect(text.fi, key(home, here)).not.toMatch(/\d %/);
        expect(text.fi, key(home, here)).toMatch(/\.$/);
        expect(text.en, key(home, here)).toMatch(/\.$/);
      }
    }
  });

  it('says plainly where nothing was found, and claims nothing with it', () => {
    const none = guideFor('FR', 'IT')!;
    expect(none.ePrescription.status).toBe('unknown');
    expect(none.ePrescription.text.fi).toBe('Virallista tietoa siitä, käykö Ranskassa kirjoitettu sähköinen resepti Italiassa, ei löytynyt. EU:n ohje on pyytää lääkäriltä myös paperinen resepti.');
    expect(none.ePrescription.text.en).toBe('No official statement was found on whether an e-prescription written in France can be used in Italy. The EU’s advice is to ask your doctor for a paper prescription as well.');
    expect(guideFor(OTHER, 'IT')!.paper.text.en).toContain('No official statement was found on whether a prescription written outside the EU and the EEA is accepted in Italy.');
  });

  it('never names the company whose research trip the field results are from', () => {
    for (const { home, here, guide } of guides) for (const text of textsOf(guide)) expect(`${text.fi} ${text.en}`, key(home, here)).not.toMatch(/Treat/);
  });
});

describe('the counter card', () => {
  it('is in the language of the country one is in, with a paper line for every pair and the English under it', () => {
    for (const { home, here, guide } of guides) {
      const place = HERE.find((entry) => entry.code === here)!;
      expect(guide.card.lang, key(home, here)).toBe(PHRASES[place.language].lang);
      expect(guide.card.variants.paper, key(home, here)).toBeDefined();
      for (const lines of Object.values(guide.card.variants)) {
        expect(lines.local.length, key(home, here)).toBeGreaterThanOrEqual(2);
        expect(lines.english, key(home, here)).toMatch(/^Hello\. /);
      }
      expect(guide.card.pharmacist.local.length, key(home, here)).toBeGreaterThan(10);
    }
  });

  it('offers the e-prescription lines exactly where a page says the pair works, and has them in that language', () => {
    for (const { home, here, guide } of guides) {
      expect(guide.card.variants.ePrescription !== undefined, key(home, here)).toBe(guide.ePrescription.status === 'works');
    }
  });

  it('names the prescription’s country in the pharmacy’s language, after a colon, and leaves it out when it is not known', () => {
    expect(guideFor('DE', 'LV')!.card.variants.paper!.local).toEqual(['Labdien! Šī ir oriģināla recepte, ko izrakstījis ārsts citā Eiropas Savienības vai Eiropas Ekonomikas zonas valstī.', 'Valsts: Vācija. Vai varat izsniegt zāles pēc šīs receptes?']);
    expect(guideFor('DE', 'LV')!.card.variants.paper!.english).toBe('Hello. This is an original prescription from a doctor in another EU or EEA country. Country: Germany. Can you dispense it?');
    expect(guideFor('EE', 'FI')!.card.variants.ePrescription!.local).toEqual(['Hei! Minulla on toisessa EU-maassa kirjoitettu sähköinen resepti.', 'Voisitteko hakea sähköisen eurooppalaisen reseptini? Maa: Viro.', 'Tässä on passini tai henkilökorttini.']);
    // Outside the EU and the EEA the card does not claim the rule, and a country the list lacks is not named.
    expect(guideFor('GB', 'IT')!.card.variants.paper!.english).toBe('Hello. This is an original prescription from a doctor in another country. Country: United Kingdom. Can you dispense it?');
    expect(guideFor(OTHER, 'IT')!.card.variants.paper!.english).toBe('Hello. This is an original prescription from a doctor in another country. Can you dispense it?');
  });

  it('keeps the line about the Finnish identity code for a prescription from Finland only', () => {
    expect(guideFor('FI', 'LV')!.card.variants.ePrescription!.local[2]).toBe(PHRASES.lv.finnishId);
    expect(guideFor('EE', 'LV')!.card.variants.ePrescription!.local[2]).toBe(PHRASES.lv.ePrescription![2]);
  });

  it('offers "the doctor sends it" where the trip saw it accepted, as before', () => {
    expect(HERE.filter((place) => place.doctorSends).map((place) => place.code)).toEqual(['HR', 'DE', 'AT', 'CH', 'DK', 'NO', 'IT', 'SI', 'SK']);
    for (const place of HERE) expect(guideFor(place.code === 'EE' ? 'FI' : 'EE', place.code)!.card.variants.doctorSends !== undefined, place.code).toBe(place.doctorSends === true);
  });

  it('says of every translation that it has not been checked: only the app’s own two languages count as reviewed', () => {
    expect(Object.entries(PHRASES).filter(([, language]) => language.reviewed).map(([code]) => code)).toEqual(['en', 'fi']);
    expect(cardFor('lv', ['paper'], { code: 'DE', eea: true })!.reviewed).toBe(false);
    expect(cardFor('xx', ['paper'], { code: 'DE', eea: true })).toBeUndefined();
  });

  it('has a language for every country one can be in, and every language has its word for "country"', () => {
    for (const place of HERE) expect(PHRASES[place.language], place.code).toBeDefined();
    for (const [code, language] of Object.entries(PHRASES)) {
      expect(language.country.length, code).toBeGreaterThan(2);
      expect(language.pharmacist, code).toMatch(/[?;]$/);
      expect(countryName('FI', language.lang), code).toBeDefined();
      for (const line of [...(language.ePrescription ?? []), ...language.paper, ...(language.doctorSends ?? [])]) expect(line, code).not.toMatch(/\d{3}|\{|\}/);
    }
  });
});

describe('in the live results', () => {
  const sceneIn = (country: string) => toScene({ position: POSITION, result: resultOf(kamppi.map((pharmacy) => ({ ...pharmacy, country }))), now: MONDAY_EVENING, deviceZone: 'Europe/Helsinki' });

  it('the scene carries the country of the pharmacy the card leads with, and nothing about the user', () => {
    expect(sceneIn('FI').here).toBe('FI');
    expect(sceneIn('LV').here).toBe('LV');
    expect(sceneIn('LV').home).toBeUndefined();
  });

  it('there is guidance for any other country’s prescription there, and none at home', () => {
    expect(guideFor('FI', sceneIn('FI').here)).toBeUndefined();
    expect(guideFor('EE', sceneIn('FI').here)?.card.lang).toBe('fi');
    expect(guideFor('FI', sceneIn('LV').here)?.card.lang).toBe('lv');
    expect(guideFor(undefined, sceneIn('LV').here)).toBeUndefined();
    expect(guideFor('FI', 'FR')).toBeUndefined();
  });
});
