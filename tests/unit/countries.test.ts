import { describe, expect, it } from 'vitest';
import { GUIDES, PHRASES, abroadFor } from '@/data/countries';
import { COUNTRY_CODES } from '@/lib/countries';
import { kamppi, resultOf, HERE, MONDAY_EVENING } from '@/lib/fixtures/tiles';
import { toScene } from '@/lib/live';

/**
 * The country guide (data/countries/, PLAN.md section 8): what the "Resepti Suomesta?" banner
 * and the counter card are made of. These hold the rules the texts have to keep, whoever
 * edits them next.
 */

const texts = (guide: (typeof GUIDES)[number]) => [guide.status, guide.tip, ...(guide.field ? [guide.field] : [])];

describe('every covered country but Finland has a guide', () => {
  it('one each, and none for Finland: there is no banner at home', () => {
    expect(GUIDES.map((guide) => guide.code).sort()).toEqual(COUNTRY_CODES.filter((code) => code !== 'FI').sort());
    expect(abroadFor('FI')).toBeUndefined();
    expect(abroadFor(undefined)).toBeUndefined();
    expect(abroadFor('XX')).toBeUndefined();
  });

  it('says in both languages whether a Finnish e-prescription works there, as Kanta lists it', () => {
    // Kanta's list, read on 25 Nov 2026: Croatia, Czechia, Estonia, Latvia, Lithuania, Poland, Portugal, Spain.
    const listed = ['HR', 'CZ', 'EE', 'LV', 'LT', 'PL', 'PT', 'ES'];
    for (const guide of GUIDES) {
      const works = listed.includes(guide.code);
      expect(guide.status.fi, guide.code).toMatch(works ? /^Suomalainen e-resepti toimii / : /^Suomalainen e-resepti ei toimi /);
      expect(guide.status.en, guide.code).toMatch(works ? /^A Finnish e-prescription works / : /^A Finnish e-prescription does not work /);
      // The card offers the e-prescription lines exactly where one can be used.
      expect(guide.variants.includes('ePrescription'), guide.code).toBe(works);
      expect(guide.variants, guide.code).toContain('paper');
    }
  });

  it('names its source and the day it was checked', () => {
    for (const guide of GUIDES) {
      expect(guide.source.label, guide.code).toBe('Kanta');
      expect(guide.source.url, guide.code).toMatch(/^https:\/\/www\.kanta\.fi\//);
      expect(guide.source.checked, guide.code).toMatch(/^2026-\d\d-\d\d$/);
    }
  });
});

describe('the field results', () => {
  const tried = GUIDES.filter((guide) => guide.field);

  it('are there for every country the trip tried, with the month, a place and how many pharmacies', () => {
    // Sweden was not tried at a counter: its row in PLAN.md 8.2 is the public rule.
    expect(GUIDES.filter((guide) => !guide.field).map((guide) => guide.code)).toEqual(['SE']);
    for (const guide of tried) {
      expect(guide.field!.fi, guide.code).toMatch(/^Kokeiltu \p{Lu}[^:]* 11\/2026[:,]/u);
      expect(guide.field!.en, guide.code).toMatch(/^Tried in \p{Lu}[^:]*, 11\/2026[:,]/u);
      // A count of pharmacies in both: "2/3 apteekista", "yksikään 6 apteekista", "2 of 3", "none of 6".
      expect(guide.field!.fi, guide.code).toMatch(/\d\/\d+ apteek|\d apteek/);
      expect(guide.field!.en, guide.code).toMatch(/\d of \d+|\d pharmacies/);
    }
  });

  it('say the same numbers in Finnish and in English', () => {
    for (const guide of tried) {
      const fractions = (text: string, pattern: RegExp) => [...text.matchAll(pattern)].map((match) => `${match[1]}/${match[2]}`).sort();
      expect(fractions(guide.field!.en, /(\d+) of (\d+)/g), guide.code).toEqual(fractions(guide.field!.fi, /(\d+)\/(\d+)(?!\d)(?!\/)/g).filter((fraction) => fraction !== '11/2026'));
    }
  });
});

describe('the wording rules', () => {
  it('never offers a medicine without its prescription, and gives no medical advice', () => {
    for (const guide of GUIDES) {
      for (const text of texts(guide)) {
        expect(text.fi, guide.code).not.toMatch(/ilman reseptiä|käsikauppa|itsehoito/i);
        expect(text.en, guide.code).not.toMatch(/without a prescription|over the counter/i);
      }
    }
  });

  it('follows the copy rules: no exclamation marks or em dashes, Finnish quotation marks, a hard space before the per cent sign', () => {
    for (const guide of GUIDES) {
      for (const text of texts(guide)) {
        for (const line of [text.fi, text.en]) expect(line, guide.code).not.toMatch(/[!—]/);
        expect(text.fi, guide.code).not.toMatch(/["“]/);
        expect(text.fi, guide.code).not.toMatch(/\d %/);
        expect(text.fi, guide.code).toMatch(/\.$/);
        expect(text.en, guide.code).toMatch(/\.$/);
      }
    }
  });
});

describe('the counter card', () => {
  it('has lines in the country’s language for every variant the country is offered, and the English under them', () => {
    for (const guide of GUIDES) {
      const { card, country } = abroadFor(guide.code)!;
      expect(country.code).toBe(guide.code);
      expect(Object.keys(card.variants), guide.code).toEqual(guide.variants);
      for (const lines of Object.values(card.variants)) {
        expect(lines.local.length, guide.code).toBeGreaterThanOrEqual(2);
        expect(lines.english, guide.code).toMatch(/^Hello\. /);
      }
      expect(card.pharmacist.local.length, guide.code).toBeGreaterThan(10);
      expect(card.lang, guide.code).toBe(PHRASES[guide.language].lang);
    }
  });

  it('says of every translation that it has not been checked: only the English masters count as reviewed', () => {
    expect(Object.entries(PHRASES).filter(([, language]) => language.reviewed).map(([key]) => key)).toEqual(['en']);
  });

  it('asks for the pharmacist in every language, and for nothing else', () => {
    for (const [key, language] of Object.entries(PHRASES)) {
      expect(language.pharmacist, key).toMatch(/[?;]$/);
      for (const lines of Object.values(language.variants)) expect(lines.join(' '), key).not.toMatch(/\d{3}/);
    }
  });
});

describe('in the live results', () => {
  const sceneIn = (country: string) => toScene({ position: HERE, result: resultOf(kamppi.map((pharmacy) => ({ ...pharmacy, country }))), now: MONDAY_EVENING, deviceZone: 'Europe/Helsinki' });

  it('the banner and the card follow the country of the pharmacy the card leads with', () => {
    expect(sceneIn('FI').country).toBeUndefined();
    expect(sceneIn('FI').card).toBeUndefined();
    expect(sceneIn('LV').country?.code).toBe('LV');
    expect(sceneIn('LV').card?.lang).toBe('lv');
    expect(sceneIn('DE').card?.variants.ePrescription).toBeUndefined();
    expect(Object.keys(sceneIn('DE').card?.variants ?? {})).toEqual(['paper', 'doctorSends']);
  });
});
