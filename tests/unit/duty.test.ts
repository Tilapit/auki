import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DUTY, dutyFor, dutyHasWay } from '@/data/countries/duty';
import { COUNTRY_CODES } from '@/lib/countries';
import { DUTY_ROTATES, dutyRotates } from '@/lib/duty';
import { leipzigFarOpen, leipzigNothingOpen, leipzigOneOpen } from '@/lib/fixtures/leipzig';
import { malaga, malagaLate, malagaNear } from '@/lib/fixtures/malaga';
import en from '@/lib/i18n/en';
import fi from '@/lib/i18n/fi';
import { arrange, dutyPlace } from '@/lib/results';
import type { Pharmacy, Scene } from '@/lib/types';

/**
 * The duty pharmacy (PLAN.md sections 5 and 8.1). What the data may hold, that the first
 * load's short list agrees with it, where the lookup goes in a card, and that every address
 * in the data is one the research file quotes a page for.
 */

const research = readFileSync('docs/research/duty-pharmacies.md', 'utf8');
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

describe('the countries where pharmacies take turns', () => {
  it('are the same in the first load and in the data', () => {
    expect([...DUTY_ROTATES].sort()).toEqual(
      DUTY.filter((duty) => duty.kind === 'rotating')
        .map((duty) => duty.code)
        .sort(),
    );
  });

  it('do not include Finland, where the same pharmacies have long hours', () => {
    expect(dutyRotates('FI')).toBe(false);
    expect(dutyRotates(undefined)).toBe(false);
  });

  it('include Germany, with its lookup and its number', () => {
    const germany = dutyFor('DE');
    expect(germany?.kind).toBe('rotating');
    expect(germany?.lookup?.site).toBe('aponet.de');
    expect(germany?.phone?.shown).toBe('0800 00 22 8 33');
  });
});

describe('what the data holds', () => {
  it('has each country once, and only covered ones', () => {
    const codes = DUTY.map((duty) => duty.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) expect(COUNTRY_CODES as readonly string[], code).toContain(code);
  });

  it('gives a way out only where pharmacies take turns', () => {
    for (const duty of DUTY) {
      if (duty.kind !== 'rotating') expect(dutyHasWay(duty) || duty.door === true, duty.code).toBe(false);
    }
  });

  it('has plain https addresses that carry nothing', () => {
    const addresses = DUTY.flatMap((duty) => [duty.source.url, ...(duty.lookup ? Object.values(duty.lookup.url) : [])].map((url) => ({ code: duty.code, url })));
    for (const { code, url } of addresses) {
      const parsed = new URL(url);
      expect(parsed.protocol, `${code} ${url}`).toBe('https:');
      expect(parsed.username + parsed.password, `${code} ${url}`).toBe('');
      // No place and no position can ride in a lookup's address: at most a page's own fixed parameter.
      expect(url, `${code} ${url}`).not.toMatch(/\d{1,3}\.\d{3,}/);
    }
  });

  it('shows a lookup by the address it opens', () => {
    for (const duty of DUTY) {
      if (!duty.lookup) continue;
      for (const url of Object.values(duty.lookup.url)) expect(new URL(url).hostname.replace(/^www\./, ''), duty.code).toContain(duty.lookup.site.split('/')[0]);
    }
  });

  it('has phone numbers that can be dialled as they are printed', () => {
    for (const duty of DUTY) {
      if (!duty.phone) continue;
      expect(duty.phone.tel, duty.code).toMatch(/^\+?\d{3,15}$/);
      expect(duty.phone.shown, duty.code).toMatch(/^[\d +()]+$/);
      // The digits a person reads are the digits that are dialled, but for a country prefix in front.
      const read = duty.phone.shown.replace(/\D/g, '');
      const dialled = duty.phone.tel.replace(/\D/g, '');
      expect(dialled.endsWith(read.replace(/^0/, '')) || dialled === read, duty.code).toBe(true);
    }
  });

  it('names who was read and when', () => {
    for (const duty of DUTY) {
      expect(duty.source.checked, duty.code).toMatch(ISO_DAY);
      if (duty.source.updated) expect(duty.source.updated, duty.code).toMatch(ISO_DAY);
      expect(duty.source.by.fi.length, duty.code).toBeGreaterThan(2);
      expect(duty.source.by.en.length, duty.code).toBeGreaterThan(2);
    }
  });

  it('is all in the research file: every address, with the page’s words next to it', () => {
    for (const duty of DUTY) {
      expect(research, `${duty.code}: a section in docs/research/duty-pharmacies.md`).toContain(`(${duty.code})`);
      expect(research, `${duty.code} ${duty.source.url}`).toContain(duty.source.url);
      for (const url of duty.lookup ? Object.values(duty.lookup.url) : []) expect(research, `${duty.code} ${url}`).toContain(url);
      if (duty.phone) expect(research, `${duty.code} ${duty.phone.shown}`).toContain(duty.phone.shown);
    }
  });
});

describe('the texts', () => {
  const texts = (t: typeof fi) => [t.duty.title, t.duty.noneTitle, t.duty.noneShort, t.duty.found(3), t.duty.why('X'), t.duty.find, t.duty.regions, t.duty.call('1'), t.duty.callSub, t.duty.turns, t.duty.door, t.duty.source];
  const data = DUTY.flatMap((duty) => [duty.source.by.fi, duty.source.by.en, duty.phone?.price?.fi, duty.phone?.price?.en].filter((text): text is string => !!text));

  it('have no exclamation marks and no em dashes', () => {
    for (const text of [...texts(fi), ...texts(en as typeof fi), ...data]) expect(text).not.toMatch(/[!—]/);
  });

  it('never say when or where a pharmacy is open: the lookup does', () => {
    for (const text of [...texts(fi), ...texts(en as typeof fi)]) expect(text).not.toMatch(/\d{1,2}[.:]\d{2}/);
  });
});

describe('where the lookup goes in the card', () => {
  const place = (scene: Scene) => dutyPlace(arrange(scene), scene);

  it('leads when nothing nearby is open, with or without a farther open one', () => {
    expect(place(leipzigNothingOpen)).toBe('lead');
    expect(place(leipzigFarOpen)).toBe('lead');
  });

  it('is one row when the nearer ones are closed and ours is open', () => {
    expect(place(leipzigOneOpen)).toBe('row');
  });

  it('is one row under unknown hours, also when none is known to be open', () => {
    expect(place(malaga)).toBe('row');
    expect(place(malagaLate)).toBe('row');
  });

  it('is nowhere when a closed door or two lie on the way to an open one', () => {
    expect(place(malagaNear)).toBeUndefined();
    // Two closed doors, then an open one: a lunch break is not a night.
    const open: Pharmacy['status'] = { kind: 'open', closes: '19:00' };
    const daytime: Scene = { ...leipzigOneOpen, pharmacies: leipzigOneOpen.pharmacies.map((pharmacy, index) => (index >= 2 ? { ...pharmacy, status: open } : pharmacy)) };
    expect(arrange(daytime).closerClosed).toBe(2);
    expect(place(daytime)).toBeUndefined();
  });
});
