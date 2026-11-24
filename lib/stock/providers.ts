/**
 * The countries' own stock searches, one provider each (docs/research/medicine-availability.md
 * has what was checked for each: who runs it, its terms, the address pattern, how fresh it is).
 *
 * Every provider here is a hand-off: an address on the service's own site, the one its own
 * search leads to. Nothing is fetched from any of them, and none has `stock`. A country
 * without an entry has no service we may link to in this way, and the app offers nothing there.
 */

import { medicineText, type StockProvider, type StockQuery } from './provider.ts';

/** A provider whose search page takes the name in one query parameter, written as a browser's own form would write it. */
function searchPage(page: string, parameter: string) {
  return ({ medicine }: StockQuery = {}) => {
    const name = medicineText(medicine);
    return name ? { url: `${page}?${parameter}=${encodeURIComponent(name)}`, withMedicine: true } : { url: page, withMedicine: false };
  };
}

/**
 * Finland: Lääkehaku on apteekki.fi, by the Association of Finnish Pharmacies. Its own
 * header search opens `laakehaku.html?ehto=<name>`, and the page shows the products by
 * that name, then per pharmacy whether each is in stock.
 */
const FI: StockProvider = {
  country: 'FI',
  id: 'apteekkiFi',
  hosts: ['www.apteekki.fi'],
  channel: 'web',
  takesMedicine: true,
  handoff: searchPage('https://www.apteekki.fi/laakehaku.html', 'ehto'),
  checked: '2026-11-25',
};

export const PROVIDERS: StockProvider[] = [FI];

const byCountry = new Map(PROVIDERS.map((provider) => [provider.country, provider]));

/** The stock search of a country, by ISO code. Undefined where there is none to hand over to. */
export function providerFor(country: string | undefined): StockProvider | undefined {
  return country ? byCountry.get(country) : undefined;
}
