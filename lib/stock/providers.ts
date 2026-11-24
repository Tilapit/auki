/**
 * The countries' own stock searches, one provider each (docs/research/medicine-availability.md
 * has what was checked for each: who runs it, its terms, the address pattern, how fresh it is).
 *
 * Every provider here is a hand-off: an address on the service's own site, the one its own
 * search leads to or the one it publishes. Nothing is fetched from any of them, and none has
 * `stock`. A country without an entry has no service the app may hand over to in this way,
 * and the app offers nothing there. Denmark is such a country: its stock lookup is in an app,
 * behind the Danish e-ID, and only for the user's own prescriptions.
 */

import { medicineText, type StockProvider, type StockQuery } from './provider.ts';

/**
 * A service whose search page takes the name in one query parameter, written as a browser
 * would write it. Without a name the link opens `plain`, the service's own way in.
 */
function searchPage(search: string, parameter: string, plain = search) {
  return ({ medicine }: StockQuery = {}) => {
    const name = medicineText(medicine);
    return name ? { url: `${search}?${parameter}=${encodeURIComponent(name)}`, withMedicine: true } : { url: plain, withMedicine: false };
  };
}

/**
 * Finland: Lääkehaku on apteekki.fi, by the Association of Finnish Pharmacies. Its own
 * header search opens `laakehaku.html?ehto=<name>`: the products by that name, then, for a
 * place the user types there, pharmacy by pharmacy whether the product is in stock. It
 * covers the pharmacies that belong to the service: most, and not Yliopiston Apteekki.
 */
const FI: StockProvider = {
  country: 'FI',
  id: 'apteekkiFi',
  hosts: ['www.apteekki.fi'],
  channel: 'web',
  coverage: 'most',
  takesMedicine: true,
  handoff: searchPage('https://www.apteekki.fi/laakehaku.html', 'ehto'),
  checked: '2026-11-25',
};

/**
 * Germany has no stock search that covers every pharmacy. IhreApotheken.de is a pre-order
 * platform of somewhat under half of them: the user picks a pharmacy there and reserves.
 * The address is the one the site publishes for its search (schema.org SearchAction on its
 * front page). Its robots.txt keeps crawlers and AI agents off the result pages, so the
 * result page itself was not loaded for this check: a person's click is not a crawl.
 */
const DE: StockProvider = {
  country: 'DE',
  id: 'ihreApotheken',
  hosts: ['ihreapotheken.de'],
  channel: 'web',
  coverage: 'some',
  takesMedicine: true,
  handoff: searchPage('https://ihreapotheken.de/suche', 'search', 'https://ihreapotheken.de/'),
  checked: '2026-11-25',
};

/**
 * Austria: the stock lookup lives in the ApoApp of the Österreichische Apothekerkammer and
 * nowhere on the web. The link leads to the Chamber's page about the app, which has the
 * store links. No address can carry a medicine's name, so none is asked for.
 */
const AT: StockProvider = {
  country: 'AT',
  id: 'apoApp',
  hosts: ['www.apothekerkammer.at'],
  channel: 'app',
  coverage: 'most',
  takesMedicine: false,
  handoff: () => ({ url: 'https://www.apothekerkammer.at/apoapp', withMedicine: false }),
  checked: '2026-11-25',
};

/**
 * Norway has no stock search across the chains. The pharmacy association's page says so and
 * explains how to look on each chain's own site (together over nine pharmacies in ten); the
 * medicines agency and Helsenorge send people to the same page. This is its short address,
 * the one the agency links to. It takes no name.
 */
const NO: StockProvider = {
  country: 'NO',
  id: 'apotekNo',
  hosts: ['www.apotek.no'],
  channel: 'web',
  coverage: 'most',
  takesMedicine: false,
  handoff: () => ({ url: 'https://www.apotek.no/kampanje/lagerstatus-i-apotek', withMedicine: false }),
  checked: '2026-11-25',
};

/**
 * Sweden: Lagerstatus on Fass, by Lif with Sveriges Apoteksförening. Built and checked, and
 * not offered: Fass's terms of use (4.5, read 25 Nov 2026) ask for a separate, free agreement
 * with Lif before another digital service links to Fass systematically. It moves to
 * PROVIDERS when Janne has that agreement.
 */
const SE: StockProvider = {
  country: 'SE',
  id: 'fass',
  hosts: ['fass.se'],
  channel: 'web',
  coverage: 'most',
  takesMedicine: true,
  handoff: searchPage('https://fass.se/search', 'query', 'https://fass.se/pharmacy-stock-status'),
  checked: '2026-11-25',
};

/** What the live app offers. */
export const PROVIDERS: StockProvider[] = [FI, DE, AT, NO];

/** Ready, and waiting for the operator's agreement. /dev/states shows them; the live app does not. */
export const AWAITING_AGREEMENT: StockProvider[] = [SE];

const byCountry = new Map(PROVIDERS.map((provider) => [provider.country, provider]));
const awaiting = new Map(AWAITING_AGREEMENT.map((provider) => [provider.country, provider]));

/** The stock search of a country, by ISO code. Undefined where there is none to hand over to. */
export function providerFor(country: string | undefined): StockProvider | undefined {
  return country ? byCountry.get(country) : undefined;
}

/** For /dev/states: also the providers that wait for an agreement. */
export function providerForReview(country: string | undefined): StockProvider | undefined {
  return providerFor(country) ?? (country ? awaiting.get(country) : undefined);
}
