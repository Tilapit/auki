/**
 * The first-visit sky follows the sun, not the clock.
 *
 * `computeSky` is deliberately one self-contained function in plain code without imports, destructuring or template strings:
 * the layout serialises it with `toString()` into an inline script, so the look is
 * picked before first paint (components/SkyScript.tsx). It must not reference
 * anything outside its own body.
 *
 * Position comes from the device time zone (a small table of European zones, Helsinki
 * as fallback): no location permission and no network request. Windows follow the
 * local clock. The pharmacy cross is always lit and is not part of this.
 */

export type SkyLook = 'night' | 'twilight' | 'golden' | 'day';

export interface Sky {
  /** Sun altitude in degrees; negative below the horizon. */
  altitude: number;
  /** The nearest of the four looks, for labels and tests. The colours themselves are blended. */
  look: SkyLook;
  /** 1 few windows lit (after midnight), 2 some (morning, daytime, late evening), 3 many (evening). */
  windows: 1 | 2 | 3;
  /** CSS custom properties to set on the scene or on <html>. */
  vars: Record<string, string>;
}

export function computeSky(ms: number, zone: string): Sky {
  // [latitude, longitude] of a representative city per time zone.
  const ZONES: Record<string, number[]> = {
    'Europe/Helsinki': [60.17, 24.94],
    'Europe/Mariehamn': [60.1, 19.94],
    'Europe/Tallinn': [59.44, 24.75],
    'Europe/Riga': [56.95, 24.11],
    'Europe/Vilnius': [54.69, 25.28],
    'Europe/Stockholm': [59.33, 18.07],
    'Europe/Oslo': [59.91, 10.75],
    'Europe/Copenhagen': [55.68, 12.57],
    'Atlantic/Reykjavik': [64.15, -21.94],
    'Europe/Warsaw': [52.23, 21.01],
    'Europe/Prague': [50.08, 14.44],
    'Europe/Bratislava': [48.15, 17.11],
    'Europe/Budapest': [47.5, 19.04],
    'Europe/Vienna': [48.21, 16.37],
    'Europe/Berlin': [52.52, 13.4],
    'Europe/Zurich': [47.37, 8.54],
    'Europe/Amsterdam': [52.37, 4.9],
    'Europe/Brussels': [50.85, 4.35],
    'Europe/Luxembourg': [49.61, 6.13],
    'Europe/Paris': [48.86, 2.35],
    'Europe/London': [51.51, -0.13],
    'Europe/Dublin': [53.35, -6.26],
    'Europe/Madrid': [40.42, -3.7],
    'Europe/Lisbon': [38.72, -9.14],
    'Atlantic/Canary': [28.12, -15.43],
    'Europe/Rome': [41.9, 12.5],
    'Europe/Malta': [35.9, 14.51],
    'Europe/Ljubljana': [46.06, 14.51],
    'Europe/Zagreb': [45.81, 15.98],
    'Europe/Belgrade': [44.79, 20.45],
    'Europe/Athens': [37.98, 23.73],
    'Europe/Sofia': [42.7, 23.32],
    'Europe/Bucharest': [44.43, 26.1],
    'Europe/Kyiv': [50.45, 30.52],
    'Europe/Kiev': [50.45, 30.52],
    'Europe/Istanbul': [41.01, 28.98],
  };

  // The four looks, keyed by the sun altitude where each one is at full strength.
  // sky: six gradient stops, top to horizon. The first three sit behind white text and
  // each keeps at least 4.5:1 against it; blends of two such colours do too.
  const LOOKS = [
    {
      name: 'night',
      at: -12,
      sky: ['#040b1c', '#081530', '#0d2147', '#132d5c', '#1a3a70', '#22477f'],
      far: '#14294f',
      near: '#071223',
      on: '#f6d4bd',
      off: '#0c1a31',
      glow: 1,
    },
    {
      name: 'twilight',
      at: -4,
      sky: ['#0e2652', '#1e417f', '#2f5ca6', '#8bbaec', '#e3eef6', '#f6d4bd'],
      far: '#3e5f96',
      near: '#0b1b31',
      on: '#f6d4bd',
      off: '#12233d',
      glow: 1,
    },
    {
      name: 'golden',
      at: 2,
      sky: ['#17386f', '#2a55a0', '#3f6db5', '#d8c4c8', '#f6d2b4', '#f9b98a'],
      far: '#6e86b4',
      near: '#10223f',
      on: '#f3d9b6',
      off: '#1b2f52',
      glow: 0.75,
    },
    {
      name: 'day',
      at: 12,
      sky: ['#1b4f9e', '#2560b4', '#2f6fc4', '#86b7ea', '#cfe4f7', '#edf5fb'],
      far: '#8fa9d2',
      near: '#1c3357',
      on: '#5c7ba8',
      off: '#2a4470',
      glow: 0.5,
    },
  ];

  const RAD = Math.PI / 180;
  const position = ZONES[zone] || ZONES['Europe/Helsinki'];

  // Low-precision solar position (Astronomical Almanac), good to about 0.1 degrees.
  const days = ms / 86400000 - 10957.5; // days since J2000.0
  const meanLongitude = 280.46 + 0.9856474 * days;
  const meanAnomaly = (357.528 + 0.9856003 * days) * RAD;
  const eclipticLongitude = (meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)) * RAD;
  const obliquity = (23.439 - 0.0000004 * days) * RAD;
  const rightAscension = Math.atan2(Math.cos(obliquity) * Math.sin(eclipticLongitude), Math.cos(eclipticLongitude));
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude));
  const siderealHours = 18.697374558 + 24.06570982441908 * days;
  const hourAngle = (siderealHours * 15 + position[1]) * RAD - rightAscension;
  const latitude = position[0] * RAD;
  const altitude =
    Math.asin(
      Math.sin(latitude) * Math.sin(declination) + Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle),
    ) / RAD;

  // Blend the two looks on either side of the sun's altitude.
  let lower = LOOKS[0];
  let upper = LOOKS[LOOKS.length - 1];
  let mix = 0;
  if (altitude <= LOOKS[0].at) {
    upper = LOOKS[0];
  } else if (altitude >= upper.at) {
    lower = upper;
  } else {
    for (let i = 0; i < LOOKS.length - 1; i++) {
      if (altitude >= LOOKS[i].at && altitude < LOOKS[i + 1].at) {
        lower = LOOKS[i];
        upper = LOOKS[i + 1];
        mix = (altitude - lower.at) / (upper.at - lower.at);
      }
    }
  }

  function channel(hex: string, index: number): number {
    return parseInt(hex.substr(1 + index * 2, 2), 16);
  }
  function blend(a: string, b: string): string {
    let out = '#';
    for (let c = 0; c < 3; c++) {
      const value = Math.round(channel(a, c) + (channel(b, c) - channel(a, c)) * mix).toString(16);
      out += value.length < 2 ? '0' + value : value;
    }
    return out;
  }

  // Windows follow the local clock, whatever the sun is doing.
  let minutes = 12 * 60;
  try {
    const clock = new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(ms));
    minutes = parseInt(clock.substr(0, 2), 10) * 60 + parseInt(clock.substr(3, 2), 10);
  } catch {
    const utc = new Date(ms);
    minutes = (utc.getUTCHours() * 60 + utc.getUTCMinutes() + Math.round(position[1] * 4) + 1440) % 1440;
  }
  let windows: 1 | 2 | 3 = 2;
  if (minutes >= 30 && minutes < 330) windows = 1; // 00.30 to 05.30: few
  if (minutes >= 960 && minutes < 1380) windows = 3; // 16.00 to 23.00: many

  const on = blend(lower.on, upper.on);
  const off = blend(lower.off, upper.off);
  const vars: Record<string, string> = {};
  for (let s = 0; s < 6; s++) vars['--sky-' + (s + 1)] = blend(lower.sky[s], upper.sky[s]);
  vars['--sky-far'] = blend(lower.far, upper.far);
  vars['--sky-near'] = blend(lower.near, upper.near);
  vars['--sky-w1'] = on;
  vars['--sky-w2'] = windows >= 2 ? on : off;
  vars['--sky-w3'] = windows >= 3 ? on : off;
  vars['--sky-off'] = off;
  vars['--sky-glow'] = String(Math.round((lower.glow + (upper.glow - lower.glow) * mix) * 100) / 100);

  return {
    altitude: Math.round(altitude * 100) / 100,
    look: (mix < 0.5 ? lower.name : upper.name) as SkyLook,
    windows: windows,
    vars: vars,
  };
}

/** A fixed moment for /dev/states and tests, so they never read the clock. */
export interface SkyAt {
  /** ISO instant, e.g. "2026-11-19T18:41:00Z". */
  at: string;
  zone: string;
}

export function skyAt({ at, zone }: SkyAt): Sky {
  return computeSky(Date.parse(at), zone);
}

export interface SunPosition {
  /** Degrees above the horizon; negative below it. */
  altitude: number;
  /** Degrees clockwise from north: 90 east, 180 south, 270 west. */
  azimuth: number;
}

/**
 * Where the sun stands at a place and an instant. The same low-precision almanac formulas
 * as in computeSky (which has to keep its own copy, because it is serialised alone into the
 * inline script), good to about 0.1 degrees. The map uses the azimuth to light its buildings
 * from the side the sun is really on.
 */
export function sunPosition(ms: number, lat: number, lon: number): SunPosition {
  const RAD = Math.PI / 180;
  const days = ms / 86400000 - 10957.5; // days since J2000.0
  const meanLongitude = 280.46 + 0.9856474 * days;
  const meanAnomaly = (357.528 + 0.9856003 * days) * RAD;
  const eclipticLongitude = (meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)) * RAD;
  const obliquity = (23.439 - 0.0000004 * days) * RAD;
  const rightAscension = Math.atan2(Math.cos(obliquity) * Math.sin(eclipticLongitude), Math.cos(eclipticLongitude));
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude));
  const siderealHours = 18.697374558 + 24.06570982441908 * days;
  const hourAngle = (siderealHours * 15 + lon) * RAD - rightAscension;
  const latitude = lat * RAD;

  const altitude = Math.asin(Math.sin(latitude) * Math.sin(declination) + Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle));
  // Measured from south towards west by the textbook formula; turned to "clockwise from north".
  const fromSouth = Math.atan2(Math.sin(hourAngle), Math.cos(hourAngle) * Math.sin(latitude) - Math.tan(declination) * Math.cos(latitude));
  const azimuth = (((fromSouth / RAD + 180) % 360) + 360) % 360;

  return { altitude: Math.round((altitude / RAD) * 100) / 100, azimuth: Math.round(azimuth * 100) / 100 };
}
