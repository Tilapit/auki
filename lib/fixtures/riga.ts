import type { CardPhrases, CountryInfo, Pharmacy, Scene } from '../types';

/**
 * Riga, Friday 20 Nov 2026 at 23:40, from the canvas boards.
 * Names and positions are examples only. Times are fixed, never the clock.
 */
const closed = (
  id: string,
  name: string,
  street: string,
  lat: number,
  lon: number,
  walkMin: number,
  walkMeters: number,
  opens: string,
): Pharmacy => ({
  id,
  name,
  street,
  city: 'Rīga',
  lat,
  lon,
  status: { kind: 'closed', opens: { day: 'tomorrow', time: opens } },
  walkMin,
  walkMeters,
  straightMeters: Math.round(walkMeters * 0.85),
});

const pharmacies: Pharmacy[] = [
  closed('apotheka-valnu', 'Apotheka', 'Vaļņu iela 11', 56.94928, 24.11137, 4, 300, '09:00'),
  closed('benu-grecinieku', 'Benu', 'Grēcinieku iela 34', 56.94561, 24.10675, 4, 320, '08:00'),
  closed('benu-audeju', 'Benu', 'Audēju iela 16', 56.94749, 24.11303, 5, 380, '09:00'),
  closed('meness-valnu', 'Mēness aptieka', 'Vaļņu iela 28', 56.94704, 24.11442, 6, 480, '08:00'),
  closed('meness-janvara', 'Mēness aptieka', '13. janvāra iela 8', 56.94537, 24.1178, 10, 780, '08:00'),
  closed('euroaptieka', 'Euroaptieka', 'Krišjāņa Barona iela 8', 56.94941, 24.12007, 11, 880, '09:00'),
  closed('meness-stacijas-2', 'Mēness aptieka', 'Stacijas laukums 2', 56.94619, 24.12052, 12, 920, '08:00'),
  closed('meness-stacijas-4', 'Mēness aptieka', 'Stacijas laukums 4', 56.94647, 24.12233, 13, 1000, '10:00'),
  closed('benu-brivibas', 'Benu', 'Brīvības iela 40', 56.95386, 24.11931, 13, 1040, '09:00'),
  {
    id: 'marijas',
    name: null,
    street: 'Marijas iela 3',
    city: 'Rīga',
    lat: 56.94785,
    lon: 24.12133,
    status: { kind: 'open24' },
    walkMin: 14,
    walkMeters: 1120,
    straightMeters: 815,
    wheelchair: 'yes',
  },
];

const farOpen: Pharmacy = {
  id: 'meness-brivibas',
  name: 'Mēness aptieka',
  street: 'Brīvības iela 74',
  lat: 56.95747,
  lon: 24.12018,
  status: { kind: 'open24' },
  walkMin: 20,
  walkMeters: 1600,
  straightMeters: 1300,
};

/** Banner content for Latvia. Public rule (Kanta) plus one general tip. The field result joins the banner in M6. */
export const latvia: CountryInfo = {
  code: 'LV',
  inCountry: { fi: 'Latviassa', en: 'in Latvia' },
  inLanguage: { fi: 'latviaksi', en: 'in Latvian' },
  status: {
    fi: 'Suomalainen e-resepti toimii Latviassa passilla.',
    en: 'A Finnish e-prescription works in Latvia with your passport.',
  },
  tip: {
    fi: 'Jos kysytään ”insurance numberia”, se on henkilötunnuksesi passin tietosivulla.',
    en: 'If you are asked for an “insurance number”, it is your personal identity code on the passport’s data page.',
  },
  source: {
    label: 'Kanta',
    url: 'https://www.kanta.fi/en/buying-prescription-medicines-abroad',
    checked: '2026-11-19',
  },
};

/**
 * Counter card in Latvian. The e-prescription lines come from the canvas; the paper
 * lines are a first draft. Nothing here has had a native check, so reviewed stays false.
 */
export const latvianCard: CardPhrases = {
  lang: 'lv',
  reviewed: false,
  variants: {
    ePrescription: {
      local: [
        'Labdien! Man ir Somijas e-recepte.',
        'Lūdzu, atrodiet to pārrobežu e-receptes sistēmā. Valsts: Somija.',
        'Ja sistēma prasa apdrošināšanas numuru, tas ir mans Somijas personas kods. Tas ir pases datu lapā.',
      ],
      english:
        'Hello. I have a Finnish e-prescription. Please look it up in the cross-border e-prescription system. Country: Finland. If the system asks for an insurance number, it is my Finnish personal identity code, on my passport’s data page.',
    },
    paper: {
      local: [
        'Labdien! Šī ir oriģināla recepte, ko izrakstījis ārsts Somijā, Eiropas Savienībā.',
        'Vai varat izsniegt zāles pēc šīs receptes?',
      ],
      english: 'Hello. This is an original prescription from a doctor in Finland, in the EU. Can you dispense it?',
    },
  },
  pharmacist: {
    local: 'Vai farmaceits varētu man palīdzēt?',
    english: 'Could a pharmacist help me with this?',
  },
};

export const riga: Scene = {
  id: 'riga',
  updated: '23:40',
  user: { lat: 56.9479, lon: 24.1079 },
  distance: 'walking',
  pharmacies,
  farOpen,
  ehditko: { kind: 'none' },
  closedOpens: { from: '08:00', to: '10:00' },
  country: latvia,
  card: latvianCard,
  views: {
    desktop: { center: [56.94936, 24.11462], zoom: 16.2 },
    phone: { center: [56.94924, 24.11485], zoom: 14.99 },
  },
};

const closedOnly = pharmacies.filter((p) => p.status.kind === 'closed');

/** An example 24-hour pharmacy in the next town, 6.3 km away in a straight line. Too far to be given a walking time. */
const farAway: Pharmacy = {
  id: 'meness-marupe',
  name: 'Mēness aptieka',
  street: 'Daugavas iela 29',
  city: 'Mārupe',
  lat: 56.904,
  lon: 24.042,
  status: { kind: 'open24' },
  straightMeters: 6310,
  phone: '+371 6000 0001',
};

/** The same night when nothing nearby is open, but the 24-hour search within 30 km finds one farther away. */
export const rigaFarOpen: Scene = {
  ...riga,
  id: 'riga-far-open',
  pharmacies: closedOnly,
  farOpen: farAway,
};

/** The same night when the 24-hour search finds nothing either: nothing is open, the first one opens at 8. */
export const rigaNothingOpen: Scene = {
  ...riga,
  id: 'riga-nothing-open',
  pharmacies: closedOnly,
  farOpen: undefined,
  closedOpens: undefined,
};
