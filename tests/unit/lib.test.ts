import { describe, expect, it } from 'vitest';
import { devRoutesEnabled } from '@/lib/dev/enabled';
import { isTightSlack } from '@/lib/ehditko';
import { helsinki, helsinkiSearched } from '@/lib/fixtures/helsinki';
import { cityName } from '@/lib/exonyms';
import { riga, rigaFarOpen, rigaNothingOpen } from '@/lib/fixtures/riga';
import { stress } from '@/lib/fixtures/stress';
import { pickLocale } from '@/lib/i18n';
import { appleDirectionsUrl, googleDirectionsUrl } from '@/lib/maps';
import { arrange, cityIfElsewhere, placeLabel } from '@/lib/results';
import { withinWalk } from '@/lib/travel';

describe('pickLocale', () => {
  it('picks Finnish only when the browser ranks it above English', () => {
    expect(pickLocale('fi-FI,fi;q=0.9,en;q=0.8')).toBe('fi');
    expect(pickLocale('en-GB,en;q=0.9,fi;q=0.8')).toBe('en');
    expect(pickLocale('sv-SE,sv;q=0.9,fi;q=0.5,en;q=0.4')).toBe('fi');
  });

  it('gives everyone else English', () => {
    expect(pickLocale('de-DE,de;q=0.9')).toBe('en');
    expect(pickLocale(null)).toBe('en');
    expect(pickLocale('fi;q=0')).toBe('en');
  });
});

describe('arrange', () => {
  it('Helsinki: the closing pharmacy is nearest open, the 24.00 one is next, nothing collapses', () => {
    const result = arrange(helsinki);
    expect(result.nearestOpen?.id).toBe('toolon');
    expect(result.nextOpen?.id).toBe('yliopiston');
    expect(result.others).toHaveLength(7);
    expect(result.closedGroup).toHaveLength(0);
  });

  it('Riga: the open one plus the nine nearer closed ones, which collapse under "Kiinni nyt"', () => {
    const result = arrange(riga);
    expect(result.total).toBe(10);
    expect(result.nearestOpen?.id).toBe('marijas');
    expect(result.closerClosed).toBe(9);
    expect(result.closedGroup).toHaveLength(9);
    expect(result.others).toHaveLength(0);
    expect(result.nextOpen?.id).toBe('meness-brivibas');
  });

  it('nothing open nearby, a farther one is: it leads, the first to open sits under it, the other closed ones fold', () => {
    const result = arrange(rigaFarOpen);
    expect(result.far).toBe(true);
    expect(result.nearestOpen?.id).toBe('meness-marupe');
    expect(result.firstToOpen?.id).toBe('benu-grecinieku');
    expect(result.closerClosed).toBe(9);
    expect(result.closedGroup).toHaveLength(8);
    expect(result.closedGroup.some((p) => p.id === 'benu-grecinieku')).toBe(false);
    expect(result.others).toHaveLength(0);
    expect(result.nextOpen).toBeUndefined();
    expect(result.total).toBe(10);
  });

  it('nothing open within 30 km: features the pharmacy that opens first and keeps the rest as a plain list', () => {
    const result = arrange(rigaNothingOpen);
    expect(result.far).toBe(false);
    expect(result.nearestOpen).toBeUndefined();
    expect(result.firstToOpen?.id).toBe('benu-grecinieku');
    expect(result.closedGroup).toHaveLength(0);
    expect(result.others).toHaveLength(8);
    expect(result.total).toBe(9);
  });

  it('an open pharmacy in the list is never called far and needs no first to open', () => {
    for (const scene of [helsinki, riga, stress]) {
      const result = arrange(scene);
      expect(result.far).toBe(false);
      expect(result.firstToOpen).toBeUndefined();
    }
  });

  it('shows the street for names that repeat and for pharmacies without a name', () => {
    const rigaStreets = arrange(riga).needsStreet;
    expect(rigaStreets.has('benu-audeju')).toBe(true);
    expect(rigaStreets.has('euroaptieka')).toBe(false);
    expect(arrange(stress).needsStreet.has('s2')).toBe(true);
  });

  it('keeps every fixture list sorted by walking time and at most ten long', () => {
    for (const scene of [helsinki, riga, stress]) {
      const times = scene.pharmacies.map((p) => p.walkMin ?? 0);
      expect(times).toEqual([...times].sort((a, b) => a - b));
      expect(scene.pharmacies.length).toBeLessThanOrEqual(10);
    }
  });
});

describe('cityName', () => {
  it('gives the larger cities their name in the UI language', () => {
    expect(cityName('Rīga', 'fi')).toBe('Riika');
    expect(cityName('Rīga', 'en')).toBe('Riga');
    expect(cityName('Stockholm', 'fi')).toBe('Tukholma');
    expect(cityName('Tallinn', 'fi')).toBe('Tallinna');
    expect(cityName('Vilnius', 'fi')).toBe('Vilna');
    expect(cityName('Warszawa', 'fi')).toBe('Varsova');
    expect(cityName('Warszawa', 'en')).toBe('Warsaw');
    expect(cityName('Berlin', 'fi')).toBe('Berliini');
    expect(cityName('Lisboa', 'fi')).toBe('Lissabon');
    expect(cityName('Lisboa', 'en')).toBe('Lisbon');
    expect(cityName('Praha', 'en')).toBe('Prague');
  });

  it('keeps the OpenStreetMap spelling where the language uses the local name, and for everything else', () => {
    expect(cityName('Stockholm', 'en')).toBe('Stockholm');
    expect(cityName('Praha', 'fi')).toBe('Praha');
    expect(cityName('München', 'fi')).toBe('München');
    expect(cityName('Helsinki', 'en')).toBe('Helsinki');
    expect(cityName('Mārupe', 'fi')).toBe('Mārupe');
    expect(cityName('Jelgava', 'en')).toBe('Jelgava');
  });

  it('reads through case, missing marks and Danish postal districts', () => {
    expect(cityName('Riga', 'fi')).toBe('Riika');
    expect(cityName('RĪGA', 'en')).toBe('Riga');
    expect(cityName('København K', 'fi')).toBe('Kööpenhamina');
    expect(cityName('København SV', 'en')).toBe('Copenhagen');
    expect(cityName('Aarhus C', 'fi')).toBe('Aarhus C');
  });
});

describe('placeLabel', () => {
  it('uses the city the nearest pharmacies agree on, in the UI language', () => {
    expect(placeLabel(helsinki, 'fi')).toBe('Helsinki');
    expect(placeLabel(helsinki, 'en')).toBe('Helsinki');
    expect(placeLabel(riga, 'fi')).toBe('Riika');
    expect(placeLabel(riga, 'en')).toBe('Riga');
  });

  it('counts two spellings of one city as agreeing', () => {
    const districts = ['København K', 'København V', 'København K'].map((city, i) => ({ ...helsinki.pharmacies[i], city }));
    expect(placeLabel({ pharmacies: districts }, 'fi')).toBe('Kööpenhamina');
  });

  it('is undefined when the city is missing or the pharmacies disagree, so the UI says "Lähelläsi"', () => {
    expect(placeLabel(stress, 'fi')).toBeUndefined();
    expect(placeLabel({ pharmacies: helsinki.pharmacies.map((p) => ({ ...p, city: undefined })) }, 'fi')).toBeUndefined();
    expect(placeLabel({ pharmacies: [] }, 'fi')).toBeUndefined();
  });

  it('keeps the name from the search for a searched place', () => {
    expect(placeLabel(helsinkiSearched, 'en')).toBe('Kampin keskus, Urho Kekkosen katu 1, Helsinki');
  });
});

describe('a farther pharmacy', () => {
  const farAway = rigaFarOpen.farOpen!;

  it('shows its city when that is not the place named above the results', () => {
    expect(cityIfElsewhere(farAway, 'Riika', 'fi')).toBe('Mārupe');
    expect(cityIfElsewhere(riga.pharmacies[0], 'Riika', 'fi')).toBeUndefined();
    expect(cityIfElsewhere(riga.pharmacies[0], undefined, 'en')).toBe('Riga');
    expect(cityIfElsewhere({ ...farAway, city: undefined }, 'Riika', 'fi')).toBeUndefined();
  });

  it('is not offered as a walk beyond 3 km, and the hand-off then names no way of travel', () => {
    expect(withinWalk(farAway)).toBe(false);
    expect(withinWalk(riga.farOpen!)).toBe(true);
    expect(googleDirectionsUrl(1.5, 2.5)).toContain('travelmode=walking');
    expect(googleDirectionsUrl(1.5, 2.5, false)).toBe('https://www.google.com/maps/dir/?api=1&destination=1.5,2.5');
    expect(appleDirectionsUrl(1.5, 2.5)).toContain('dirflg=w');
    expect(appleDirectionsUrl(1.5, 2.5, false)).toBe('https://maps.apple.com/?daddr=1.5,2.5');
  });
});

describe('isTightSlack', () => {
  it('is tight under five minutes on a short walk', () => {
    expect(isTightSlack(4, 3)).toBe(true);
    expect(isTightSlack(5, 3)).toBe(false);
    expect(isTightSlack(16, 3)).toBe(false);
  });

  it('is tight under a fifth of the walk when that is more than five minutes', () => {
    expect(isTightSlack(5, 30)).toBe(true);
    expect(isTightSlack(6, 30)).toBe(false);
    expect(isTightSlack(7, 40)).toBe(true);
    expect(isTightSlack(5, 25)).toBe(false);
  });
});

describe('devRoutesEnabled', () => {
  it('keeps the /dev pages out of a production build unless the build asks for them', () => {
    expect(devRoutesEnabled({ NODE_ENV: 'development' })).toBe(true);
    expect(devRoutesEnabled({ NODE_ENV: 'test' })).toBe(true);
    expect(devRoutesEnabled({ NODE_ENV: 'production' })).toBe(false);
    expect(devRoutesEnabled({ NODE_ENV: 'production', DEV_ROUTES: '0' })).toBe(false);
    expect(devRoutesEnabled({ NODE_ENV: 'production', DEV_ROUTES: '1' })).toBe(true);
  });
});
