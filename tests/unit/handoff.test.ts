import { describe, expect, it } from 'vitest';
import { NO_HANDOFF, handoffFragment, placeFor, readHandoff } from '@/lib/handoff';

/** The hand-off link (PLAN.md 7.8): what a fragment says, and what it never can. */
describe('readHandoff', () => {
  it('reads the country and the format, with the # or without', () => {
    expect(readHandoff('#country=LV&rx=e')).toEqual({ country: 'LV', rx: 'e' });
    expect(readHandoff('country=LV&rx=p')).toEqual({ country: 'LV', rx: 'p' });
    expect(readHandoff('#rx=p')).toEqual({ rx: 'p' });
    expect(readHandoff('#country=de')).toEqual({ country: 'DE' });
    expect(readHandoff('#RX=p&rx=E')).toEqual({ rx: 'e' });
  });

  it('passes over names and values it does not know', () => {
    expect(readHandoff('#country=Latvia&rx=x')).toBe(NO_HANDOFF);
    expect(readHandoff('#country=L1&rx=ep')).toBe(NO_HANDOFF);
    expect(readHandoff('#rx=e&medicine=anything&home=FI&name=someone')).toEqual({ rx: 'e' });
    expect(readHandoff('#country=LV&Country=EE&COUNTRY=SE')).toEqual({ country: 'LV' });
  });

  it('has no parameter for a position, a person, a prescription or a medicine', () => {
    const handoff = readHandoff('#country=LV&rx=e&lat=56.9496&lon=24.1052&position=56.9496,24.1052&id=123&medicine=x&q=Riga');
    expect(Object.keys(handoff).sort()).toEqual(['country', 'rx']);
  });

  it('says nothing for a fragment that is none, or an anchor of a page', () => {
    for (const fragment of ['', '#', '#sources', '#%', '#%E0%A4%A', '#=&=&', '#country', '#rx']) expect(readHandoff(fragment)).toBe(NO_HANDOFF);
  });

  it('of a name given twice takes the first', () => {
    expect(readHandoff('#rx=p&rx=e&country=LV&country=EE')).toEqual({ country: 'LV', rx: 'p' });
    // A first value that is not understood is no value: the second is not looked at.
    expect(readHandoff('#rx=x&rx=e')).toBe(NO_HANDOFF);
  });
});

describe('handoffFragment', () => {
  it('carries on what was understood, and nothing else', () => {
    expect(handoffFragment(readHandoff('#rx=P&medicine=x&country=lv'))).toBe('#country=LV&rx=p');
    expect(handoffFragment(readHandoff('#country=LV'))).toBe('#country=LV');
    expect(handoffFragment(readHandoff('#rx=e'))).toBe('#rx=e');
    expect(handoffFragment(NO_HANDOFF)).toBe('');
    expect(handoffFragment(readHandoff('#sources'))).toBe('');
  });

  it('reads back as itself', () => {
    for (const fragment of ['#country=LV&rx=e', '#country=AT&rx=p', '#rx=p', '#country=FI']) expect(handoffFragment(readHandoff(fragment))).toBe(fragment);
  });
});

describe('placeFor', () => {
  const places = [
    { label: 'Kirchplatz, Wien', country: 'AT' },
    { label: 'Kirchplatz, München', country: 'DE' },
    { label: 'Kirchplatz, Basel', country: 'CH' },
    { label: 'Kirchplatz, Graz', country: 'AT' },
  ];

  it('takes the first answer without a link, as the search always did', () => {
    expect(placeFor(places, undefined)).toBe(places[0]);
    expect(placeFor([], undefined)).toBeUndefined();
  });

  it("takes the first answer in the link's country", () => {
    expect(placeFor(places, 'DE')).toBe(places[1]);
    expect(placeFor(places, 'CH')).toBe(places[2]);
    expect(placeFor(places, 'AT')).toBe(places[0]);
  });

  it('takes the first answer when none is in that country: the sender may be wrong, the user typed the name', () => {
    expect(placeFor(places, 'LV')).toBe(places[0]);
    // An answer Nominatim gave no country for is in none.
    const unnamed: { label: string; country?: string }[] = [{ label: 'Somewhere' }];
    expect(placeFor(unnamed, 'LV')).toBe(unnamed[0]);
    expect(placeFor([], 'LV')).toBeUndefined();
  });
});
