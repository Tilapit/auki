/**
 * The codes of the countries a prescription can be from, and the home country a browser
 * suggests: all that the first load needs to tell whether a pharmacy is in the prescription's
 * country (lib/home.ts). The names, the groups and everything else about these countries are in
 * homes.ts, which travels with the guidance, when it is needed (lib/guidance.ts). A unit test
 * keeps the two lists the same.
 */

/** A home country the list does not have: outside the EU, the EEA, Switzerland and the United Kingdom. */
export const OTHER = 'XX';

/** In the order of homes.ts. */
export const HOME_CODES: readonly string[] = 'NL BE BG ES IE IS GB IT AT GR HR CY LV LI LT LU MT NO PT PL FR RO SE DE SK SI FI CH DK CZ HU EE'.split(' ');

const KNOWN = new Set(HOME_CODES);

export const isHomeCode = (code: string | null | undefined): code is string => !!code && KNOWN.has(code);

/**
 * The home country a browser suggests, from its languages and their regions (`navigator.languages`),
 * most preferred first. No question is asked for it, and it is a guess the banner shows and lets
 * the user change.
 *
 * - A language with a region the list knows gives that country: "de-AT" is Austria.
 * - A language without a region gives the country it is most used in: "fi" is Finland, "sv" Sweden.
 * - English is passed over while another language is there: many who are not British read their
 *   phone in "en-GB". English alone gives its region: the United Kingdom, Ireland, Malta.
 * - Nothing the list knows: undefined. The banner then asks.
 */
export function homeFromLanguages(languages: readonly string[]): string | undefined {
  const regions = languages.flatMap((tag) => {
    try {
      const locale = new Intl.Locale(tag);
      const region = locale.region ?? locale.maximize().region;
      return region && KNOWN.has(region) ? [{ english: locale.language === 'en', region }] : [];
    } catch {
      return [];
    }
  });
  return (regions.find((entry) => !entry.english) ?? regions[0])?.region;
}
