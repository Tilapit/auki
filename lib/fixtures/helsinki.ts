import type { Pharmacy, Scene } from '../types';

/**
 * Helsinki, Thursday 19 Nov 2026 at 20:41, from the canvas boards.
 * Names, numbers and positions are examples only. Times are fixed, never the clock.
 */
const pharmacies: Pharmacy[] = [
  {
    id: 'toolon',
    name: 'Töölön apteekki',
    street: 'Kampinkuja 2',
    city: 'Helsinki',
    lat: 60.1677,
    lon: 24.9293,
    status: { kind: 'soon', closes: '21:00' },
    hours: [
      { days: 'mo-fr', from: '08:00', to: '21:00' },
      { days: 'sa-su', from: '10:00', to: '18:00' },
    ],
    walkMin: 3,
    walkMeters: 220,
    straightMeters: 190,
    phone: '+358 9 000 0001',
    wheelchair: 'yes',
  },
  {
    id: 'kampin',
    name: 'Kampin apteekki',
    lat: 60.16745,
    lon: 24.92615,
    status: { kind: 'closed', opens: { day: 'tomorrow', time: '08:00' } },
    walkMin: 5,
    walkMeters: 400,
    straightMeters: 360,
  },
  {
    id: 'yliopiston',
    name: 'Yliopiston apteekki',
    street: 'Mannerheimintie 5',
    city: 'Helsinki',
    lat: 60.16899,
    lon: 24.93854,
    status: { kind: 'open', closes: '24:00' },
    hours: [{ days: 'daily', from: '08:00', to: '24:00' }],
    walkMin: 5,
    walkMeters: 400,
    straightMeters: 355,
    phone: '+358 300 20200',
    wheelchair: 'limited',
    wheelchairNote: 'Kysy tarvittaessa siirrettävää ramppia.',
    checkDate: '2023-09-13',
  },
  {
    id: 'citycenter',
    name: 'Apteekki CityCenter',
    city: 'Helsinki',
    lat: 60.16944,
    lon: 24.94074,
    status: { kind: 'closed', opens: { day: 'tomorrow', time: '09:00' } },
    walkMin: 7,
    walkMeters: 580,
    straightMeters: 480,
  },
  {
    id: 'steissin',
    name: 'Steissin Apteekki',
    lat: 60.17128,
    lon: 24.93977,
    status: { kind: 'closed', opens: { day: 'tomorrow', time: '07:00' } },
    walkMin: 8,
    walkMeters: 620,
    straightMeters: 510,
  },
  {
    id: 'erottajan',
    name: 'Erottajan Apteekki',
    lat: 60.16737,
    lon: 24.94149,
    status: { kind: 'closed', opens: { day: 'tomorrow', time: '08:30' } },
    walkMin: 8,
    walkMeters: 650,
    straightMeters: 540,
  },
  {
    id: 'kluuvin',
    name: 'Kluuvin apteekki',
    lat: 60.16909,
    lon: 24.94267,
    status: { kind: 'closed', opens: { day: 'tomorrow', time: '09:00' } },
    walkMin: 9,
    walkMeters: 700,
    straightMeters: 585,
  },
  {
    id: 'kaartin',
    name: 'Kaartin Apteekki',
    lat: 60.16495,
    lon: 24.94838,
    status: { kind: 'missing' },
    walkMin: 14,
    walkMeters: 1180,
    straightMeters: 990,
  },
];

export const helsinki: Scene = {
  id: 'helsinki',
  updated: '20:41',
  user: { lat: 60.1687, lon: 24.93215 },
  distance: 'walking',
  pharmacies,
  ehditko: { kind: 'timeline', arrive: '20:44', closes: '21:00', slackMin: 16 },
  views: {
    desktop: { center: [60.16972, 24.9361], zoom: 16 },
    phone: { center: [60.16973, 24.93409], zoom: 15.34 },
  },
};

/** The same pharmacies found by searching a place: the bar shows the name from the search, however long. */
export const helsinkiSearched: Scene = {
  ...helsinki,
  id: 'helsinki-searched',
  searched: 'Kampin keskus, Urho Kekkosen katu 1, Helsinki',
};

/** The same search when walking times didn't arrive in time: straight lines, labelled as such. */
export const helsinkiStraight: Scene = {
  ...helsinki,
  id: 'helsinki-straight',
  distance: 'straight',
  pharmacies: pharmacies.map((pharmacy) => ({ ...pharmacy, walkMin: undefined, walkMeters: undefined })),
  ehditko: { kind: 'none' },
};
