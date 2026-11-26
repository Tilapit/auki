/**
 * The countries a prescription can be from: the "home" side of every pair (PLAN.md section 8).
 * The 27 EU member states, the three other countries of the European Economic Area, Switzerland
 * and the United Kingdom, each with the group that decides which rule applies to its paper
 * prescriptions (data/countries/paper.ts). Any other country is `OTHER`.
 *
 * Names are written out here and not taken from the browser: the same text on the server, in
 * the tests and on every phone. `inFi` is the Finnish inessive ("Saksassa"), which the app's
 * sentences need; `inEn` is "in Germany".
 */

import type { Locale } from '../../lib/i18n';

/** eu: a member state. eea: Iceland, Liechtenstein, Norway. ch: Switzerland. none: outside all of them. */
export type Union = 'eu' | 'eea' | 'ch' | 'none';

export interface Home {
  code: string;
  union: Union;
  name: Record<Locale, string>;
  /** "Saksassa" / "in Germany" */
  inCountry: Record<Locale, string>;
}

// The codes alone, and the country a browser suggests, are in codes.ts: the first load needs
// them, and not this file.
export { OTHER, homeFromLanguages } from './codes.ts';

const home = (code: string, union: Union, fi: string, inFi: string, en: string, inEn = `in ${en}`): Home => ({ code, union, name: { fi, en }, inCountry: { fi: inFi, en: inEn } });

/** In Finnish alphabetical order of the Finnish names: the order of the list a Finnish reader picks from. */
export const HOMES: Home[] = [
  home('NL', 'eu', 'Alankomaat', 'Alankomaissa', 'Netherlands', 'in the Netherlands'),
  home('BE', 'eu', 'Belgia', 'Belgiassa', 'Belgium'),
  home('BG', 'eu', 'Bulgaria', 'Bulgariassa', 'Bulgaria'),
  home('ES', 'eu', 'Espanja', 'Espanjassa', 'Spain'),
  home('IE', 'eu', 'Irlanti', 'Irlannissa', 'Ireland'),
  home('IS', 'eea', 'Islanti', 'Islannissa', 'Iceland'),
  home('GB', 'none', 'Iso-Britannia', 'Isossa-Britanniassa', 'United Kingdom', 'in the United Kingdom'),
  home('IT', 'eu', 'Italia', 'Italiassa', 'Italy'),
  home('AT', 'eu', 'Itävalta', 'Itävallassa', 'Austria'),
  home('GR', 'eu', 'Kreikka', 'Kreikassa', 'Greece'),
  home('HR', 'eu', 'Kroatia', 'Kroatiassa', 'Croatia'),
  home('CY', 'eu', 'Kypros', 'Kyproksella', 'Cyprus'),
  home('LV', 'eu', 'Latvia', 'Latviassa', 'Latvia'),
  home('LI', 'eea', 'Liechtenstein', 'Liechtensteinissa', 'Liechtenstein'),
  home('LT', 'eu', 'Liettua', 'Liettuassa', 'Lithuania'),
  home('LU', 'eu', 'Luxemburg', 'Luxemburgissa', 'Luxembourg'),
  home('MT', 'eu', 'Malta', 'Maltalla', 'Malta'),
  home('NO', 'eea', 'Norja', 'Norjassa', 'Norway'),
  home('PT', 'eu', 'Portugali', 'Portugalissa', 'Portugal'),
  home('PL', 'eu', 'Puola', 'Puolassa', 'Poland'),
  home('FR', 'eu', 'Ranska', 'Ranskassa', 'France'),
  home('RO', 'eu', 'Romania', 'Romaniassa', 'Romania'),
  home('SE', 'eu', 'Ruotsi', 'Ruotsissa', 'Sweden'),
  home('DE', 'eu', 'Saksa', 'Saksassa', 'Germany'),
  home('SK', 'eu', 'Slovakia', 'Slovakiassa', 'Slovakia'),
  home('SI', 'eu', 'Slovenia', 'Sloveniassa', 'Slovenia'),
  home('FI', 'eu', 'Suomi', 'Suomessa', 'Finland'),
  home('CH', 'ch', 'Sveitsi', 'Sveitsissä', 'Switzerland'),
  home('DK', 'eu', 'Tanska', 'Tanskassa', 'Denmark'),
  home('CZ', 'eu', 'Tšekki', 'Tšekissä', 'Czechia'),
  home('HU', 'eu', 'Unkari', 'Unkarissa', 'Hungary'),
  home('EE', 'eu', 'Viro', 'Virossa', 'Estonia'),
];

const BY_CODE = new Map(HOMES.map((entry) => [entry.code, entry]));

export const homeOf = (code: string | undefined): Home | undefined => (code ? BY_CODE.get(code) : undefined);

/** The group of a country, known or not: anything the list does not have is outside all of them. */
export const unionOf = (code: string | undefined): Union => homeOf(code)?.union ?? 'none';

/** EU and EEA together: the countries the EU's rule on prescriptions from another member state covers. */
export const inEea = (code: string | undefined): boolean => ['eu', 'eea'].includes(unionOf(code));

/** The list as a reader of `locale` picks from it: by name, in that language's own order. */
export function homesFor(locale: Locale): Home[] {
  return [...HOMES].sort((a, b) => a.name[locale].localeCompare(b.name[locale], locale));
}
