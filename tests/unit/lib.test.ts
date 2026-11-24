import { describe, expect, it } from 'vitest';
import { devRoutesEnabled } from '@/lib/dev/enabled';
import { isTightSlack } from '@/lib/ehditko';
import { helsinki, helsinkiSearched } from '@/lib/fixtures/helsinki';
import { cityName } from '@/lib/exonyms';
import { riga, rigaFarOpen, rigaNothingOpen } from '@/lib/fixtures/riga';
import { stress } from '@/lib/fixtures/stress';
import { pickLocale } from '@/lib/i18n';
import { appleDirectionsUrl, emailAddress, googleDirectionsUrl, osmNoteUrl, websiteHost } from '@/lib/maps';
import { malaga, malagaLate, malagaNear, malagaNoPhone } from '@/lib/fixtures/malaga';
import { DETOUR_METERS, arrange, cityIfElsewhere, hoursUnknown, placeLabel } from '@/lib/results';
import type { OpenStatus, Pharmacy } from '@/lib/types';
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

describe('arrange, where hours are missing (hours coverage, provisional)', () => {
  const missing: OpenStatus = { kind: 'missing' };
  const open: OpenStatus = { kind: 'open', closes: '22:00' };
  const closed: OpenStatus = { kind: 'closed', opens: { day: 'tomorrow', time: '09:00' } };
  const at = (meters: number, status: OpenStatus): Pharmacy => ({ id: `p${meters}`, name: `Farmacia ${meters}`, lat: 0, lon: 0, status, straightMeters: meters });
  const ids = (pharmacies: Pharmacy[]) => pharmacies.map((p) => p.id);

  it('five without hours before an open one 3 km away: the nearest of them leads, and the open one is kept', () => {
    const pharmacies = [at(120, missing), at(200, missing), at(350, missing), at(500, missing), at(800, missing), at(3000, open), at(3400, missing)];
    const result = arrange({ pharmacies });
    // The count is of all the pharmacies shown, so that it agrees with the list under the card.
    expect(result.unlisted).toEqual({ lead: pharmacies[0], count: 6 });
    expect(result.closerUnknown).toBe(5);
    expect(result.nearestOpen?.id).toBe('p3000');
    // Neither of the two in the card is repeated in the list.
    expect(ids(result.others)).toEqual(['p200', 'p350', 'p500', 'p800', 'p3400']);
    expect(result.closedGroup).toEqual([]);
    expect(result.firstToOpen).toBeUndefined();
  });

  it('one without hours at 200 m and an open one at 300 m: the open one leads, and the card can say what lies nearer', () => {
    const result = arrange({ pharmacies: [at(200, missing), at(300, open), at(900, missing)] });
    expect(result.unlisted).toBeUndefined();
    expect(result.nearestOpen?.id).toBe('p300');
    expect(result.closerUnknown).toBe(1);
  });

  it('the detour is measured from the nearest one without hours: 500 m more is the same errand, a metre more is not', () => {
    expect(DETOUR_METERS).toBe(500);
    expect(arrange({ pharmacies: [at(200, missing), at(400, missing), at(700, open)] }).unlisted).toBeUndefined();
    expect(arrange({ pharmacies: [at(200, missing), at(400, missing), at(701, open)] }).unlisted?.lead.id).toBe('p200');
  });

  it('takes most of the nearer ones: half is not most, and a closed pharmacy with known hours is not in doubt', () => {
    expect(arrange({ pharmacies: [at(100, closed), at(200, missing), at(3000, open)] }).unlisted).toBeUndefined();
    expect(arrange({ pharmacies: [at(100, closed), at(200, missing), at(300, missing), at(3000, open)] }).unlisted).toEqual({ lead: expect.objectContaining({ id: 'p200' }), count: 2 });
    const mostlyClosed = arrange({ pharmacies: [at(100, missing), at(200, closed), at(300, closed), at(400, closed), at(3000, open)] });
    expect(mostlyClosed.unlisted).toBeUndefined();
    expect(mostlyClosed.closerUnknown).toBe(1);
  });

  it('counts hours that are listed but can not be read or trusted', () => {
    expect([missing, { kind: 'unparseable', raw: 'mañanas' }, { kind: 'uncertain', raw: 'sunrise-sunset' }].map((status) => hoursUnknown(status as OpenStatus))).toEqual([true, true, true]);
    expect([open, closed, { kind: 'soon', closes: '21:00' }, { kind: 'open24' }, { kind: 'stale' }].map((status) => hoursUnknown(status as OpenStatus))).toEqual([false, false, false, false, false]);
  });

  it('treats the farther open one from the wider search like any other', () => {
    const farOpen = at(14_000, open);
    const unknownNearby = arrange({ pharmacies: [at(100, missing), at(200, missing), at(300, closed)], farOpen });
    expect(unknownNearby.unlisted?.count).toBe(2);
    expect(unknownNearby.nearestOpen).toBe(farOpen);
    expect(unknownNearby.far).toBe(true);
    expect(unknownNearby.total).toBe(4);
    const closedNearby = arrange({ pharmacies: [at(100, closed), at(200, closed), at(300, missing)], farOpen });
    expect(closedNearby.unlisted).toBeUndefined();
    expect(closedNearby.firstToOpen?.id).toBe('p100');
  });

  it('with no pharmacy known to be open and most hours unknown: no first to open, since nothing says the others are closed', () => {
    const result = arrange({ pharmacies: [at(100, missing), at(200, missing), at(300, closed)] });
    expect(result.unlisted?.lead.id).toBe('p100');
    expect(result.nearestOpen).toBeUndefined();
    expect(result.firstToOpen).toBeUndefined();
    expect(ids(result.others)).toEqual(['p200', 'p300']);
  });

  it('with no pharmacy known to be open but most of them closed: the first to open leads as before', () => {
    const result = arrange({ pharmacies: [at(100, closed), at(200, closed), at(300, missing)] });
    expect(result.unlisted).toBeUndefined();
    expect(result.firstToOpen?.id).toBe('p100');
  });

  it('can be switched off, for the comparison in /dev/states', () => {
    const pharmacies = [at(120, missing), at(200, missing), at(3000, open)];
    const before = arrange({ pharmacies }, { coverage: false });
    expect(before.unlisted).toBeUndefined();
    expect(before.closerUnknown).toBe(0);
    expect(ids(before.others)).toEqual(['p120', 'p200']);
  });

  it('Málaga, from tile data: seven of the eight nearer ones are unknown, so the nearest leads; later nothing is known open', () => {
    const evening = arrange(malaga);
    expect(evening.closerUnknown).toBe(7);
    expect(evening.unlisted).toEqual({ lead: expect.objectContaining({ id: 'n301' }), count: 8 });
    expect(evening.nearestOpen?.id).toBe('n309');
    expect(evening.others).toHaveLength(8);
    expect(malaga.hoursListed).toEqual({ country: 'ES', share: 0.1815 });
    const late = arrange(malagaLate);
    expect(late.unlisted?.count).toBe(8);
    expect(late.nearestOpen).toBeUndefined();
    expect(arrange(malagaNoPhone).unlisted?.lead.phone).toBeUndefined();
    const near = arrange(malagaNear);
    expect(near.unlisted).toBeUndefined();
    expect(near.nearestOpen?.id).toBe('n303');
    expect(near.closerUnknown).toBe(2);
  });

  it('leaves the fixtures of the canvas as they were', () => {
    for (const scene of [helsinki, riga, rigaFarOpen, rigaNothingOpen, stress]) {
      const result = arrange(scene);
      expect(result.unlisted).toBeUndefined();
      expect(result.closerUnknown).toBe(0);
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

describe('the links of the pharmacy sheet', () => {
  it('the note link opens OpenStreetMap\'s form with its marker on the pharmacy', () => {
    expect(osmNoteUrl(60.1706, 24.93653)).toBe('https://www.openstreetmap.org/note/new?lat=60.1706&lon=24.93653#map=19/60.1706/24.93653');
  });

  it('a website is named by its host, without www', () => {
    expect(websiteHost('https://www.yliopistonapteekki.fi/apteekit/keskusta?utm=1')).toBe('yliopistonapteekki.fi');
    expect(websiteHost('http://apteekki.example')).toBe('apteekki.example');
  });

  it('what is not a web address is not shown as one', () => {
    for (const value of ['', 'apteekki.example', 'javascript:alert(1)', 'mailto:a@b.example', 'ftp://apteekki.example/', 'https://localhost/', 'not a url']) {
      expect(websiteHost(value), value).toBeUndefined();
    }
  });

  it('an email link carries one address and nothing more', () => {
    expect(emailAddress('info@apteekki.example')).toBe('info@apteekki.example');
    // OpenStreetMap's value is free text: several addresses, or a stray space.
    expect(emailAddress('info@apteekki.example; toinen@apteekki.example')).toBe('info@apteekki.example');
    expect(emailAddress(' info@apteekki.example ')).toBe('info@apteekki.example');
    for (const value of ['', 'info', 'info@apteekki', 'info@apteekki.example?subject=x', 'info@apteekki.example&cc=y@z.example', 'a b@c.example', '<info@apteekki.example>', 'info@apteekki.example.']) {
      expect(emailAddress(value), value).toBeUndefined();
    }
  });
});
