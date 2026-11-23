import { describe, expect, it } from 'vitest';
import { clock, clockShort, date, distance, hourRange, minutes } from '@/lib/format';
import { makeI18n } from '@/lib/i18n';
import { opensWhen, statusText } from '@/lib/status';

const NBSP = ' ';

describe('Finnish copy rules', () => {
  it('writes times with a full stop and "klo" joined by a non-breaking space', () => {
    expect(clock('fi', '20:44')).toBe('20.44');
    expect(clockShort('fi', '20:45')).toBe(`klo${NBSP}20.45`);
  });

  it('drops the minutes on whole hours in status lines, and says midnight as 24', () => {
    expect(clockShort('fi', '21:00')).toBe(`klo${NBSP}21`);
    expect(clockShort('fi', '24:00')).toBe(`klo${NBSP}24`);
    expect(clock('fi', '24:00')).toBe('24.00');
  });

  it('joins a number and its unit with a non-breaking space, with a decimal comma', () => {
    expect(distance('fi', 220)).toBe(`220${NBSP}m`);
    expect(distance('fi', 1120)).toBe(`1,1${NBSP}km`);
    expect(minutes('fi', 3)).toBe(`3${NBSP}min`);
    expect(distance('fi', 220, true)).toBe(`220${NBSP}metriä`);
    expect(minutes('fi', 3, true)).toBe(`3${NBSP}minuuttia`);
  });

  it('rounds metres to tens and switches to kilometres at one kilometre', () => {
    expect(distance('fi', 994)).toBe(`990${NBSP}m`);
    expect(distance('fi', 996)).toBe(`1,0${NBSP}km`);
  });

  it('writes ranges with an en dash and no spaces', () => {
    expect(hourRange('fi', '08:00', '10:00')).toBe('8–10');
    expect(hourRange('fi', '08:30', '10:00')).toBe('8.30–10.00');
  });

  it('writes dates the Finnish way', () => {
    expect(date('fi', '2023-09-13')).toBe('13.9.2023');
  });
});

describe('English copy rules', () => {
  it('uses en-GB 24-hour times and a decimal point', () => {
    expect(clock('en', '20:44')).toBe('20:44');
    expect(clockShort('en', '09:00')).toBe('09:00');
    expect(clockShort('en', '24:00')).toBe('midnight');
    expect(clock('en', '24:00')).toBe('24:00');
    expect(distance('en', 1120)).toBe(`1.1${NBSP}km`);
    expect(minutes('en', 3)).toBe(`3${NBSP}min`);
  });
});

describe('status lines', () => {
  const fi = makeI18n('fi');
  const en = makeI18n('en');

  it('matches the copy table in PLAN.md section 6', () => {
    expect(statusText(fi, { kind: 'open', closes: '21:00' })).toBe(`Auki klo${NBSP}21 asti`);
    expect(statusText(fi, { kind: 'soon', closes: '17:45' })).toBe(`Sulkeutuu pian, klo${NBSP}17.45`);
    expect(statusText(fi, { kind: 'closed', opens: { day: 'tomorrow', time: '09:00' } })).toBe(`Kiinni, avautuu huomenna klo${NBSP}9`);
    expect(statusText(fi, { kind: 'open24' })).toBe('Auki ympäri vuorokauden');
    expect(statusText(fi, { kind: 'missing' })).toBe('Aukioloaikoja ei ole merkitty');
    expect(statusText(fi, { kind: 'unparseable', raw: 'soita ja kysy' })).toBe('Aukioloajat epäselvät: ”soita ja kysy”');
    expect(statusText(en, { kind: 'open', closes: '21:00' })).toBe('Open until 21:00');
    expect(statusText(en, { kind: 'closed', opens: { day: 'tomorrow', time: '09:00' } })).toBe('Closed, opens tomorrow 09:00');
  });

  it('says when a closed pharmacy opens: today, tomorrow or on a weekday', () => {
    expect(opensWhen(fi, { day: 'today', time: '09:00' })).toBe(`klo${NBSP}9`);
    expect(opensWhen(fi, { day: 'tomorrow', time: '08:30' })).toBe(`huomenna klo${NBSP}8.30`);
    expect(opensWhen(fi, { day: 'mo', time: '09:00' })).toBe(`ma klo${NBSP}9`);
    expect(opensWhen(en, { day: 'mo', time: '09:00' })).toBe('Mon 09:00');
    expect(statusText(fi, { kind: 'closed' })).toBe('Kiinni');
  });

  it('says a share with a decimal in a table and without one in a sentence', () => {
    expect(fi.f.percent(0.1815)).toBe(`18,2${NBSP}%`);
    expect(fi.f.percent(0.1815, 0)).toBe(`18${NBSP}%`);
    expect(en.f.percent(0.073, 0)).toBe('7%');
    expect(fi.t.results.hoursListed('Espanja', fi.f.percent(0.1815, 0))).toBe(`Espanja: aukioloajat on merkitty 18${NBSP}%:lle apteekeista.`);
  });

  it('says a day and a time on the device clock, or in a zone when one is given', () => {
    const fetched = Date.parse('2026-11-23T01:17:00Z') / 1000;
    expect(fi.f.dayAndTime(fetched, 'Europe/Helsinki')).toBe(`23.11. klo${NBSP}3.17`);
    expect(en.f.dayAndTime(fetched, 'Europe/Helsinki')).toBe('23 Nov, 03:17');
    // The tests run with TZ=UTC: without a zone the runtime's own is used.
    expect(fi.f.dayAndTime(fetched)).toBe(`23.11. klo${NBSP}1.17`);
  });

  it('counts the pharmacies without known hours in the singular and the plural', () => {
    expect(fi.t.results.unlistedNearby(1)).toBe('Apteekki voi silti olla auki.');
    expect(fi.t.results.unlistedNearby(7)).toBe('Lähistöllä on 7 apteekkia, joiden aukioloaikoja ei tiedetä. Osa niistä voi olla auki.');
    expect(fi.t.results.closerUnknown(1)).toBe('Lähempänä on yksi apteekki, jonka aukioloaikoja ei tiedetä.');
    expect(en.t.results.closerUnknown(2)).toBe('2 closer pharmacies have no known opening hours.');
  });

  it('has no exclamation marks or em dashes in either dictionary', () => {
    const texts: string[] = [];
    const walk = (value: unknown) => {
      if (typeof value === 'string') texts.push(value);
      else if (typeof value === 'function') texts.push(String(value(2, 'x', 'y', 'z')));
      else if (value && typeof value === 'object') Object.values(value).forEach(walk);
    };
    walk(fi.t);
    walk(en.t);
    for (const text of texts) expect(text).not.toMatch(/[!—]/);
  });
});
