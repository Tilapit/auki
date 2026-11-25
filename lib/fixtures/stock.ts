import { providerFor } from '../stock/providers.ts';
import type { StockAnswer, StockProvider } from '../stock/provider.ts';

/**
 * Example data for the seam of PLAN.md 7.9: what a provider with live stock would answer.
 * Invented, like every name and number in these fixtures: the product does not exist, and
 * no pharmacy's stock is known to this app. Shown in /dev/states only, labelled as example
 * data. Nothing in the live app imports this file (a unit test holds that).
 */
export const EXAMPLE_MEDICINE = 'Esimerkkivalmiste';

/** Thursday 19 Nov 2026 at 20.30 in Helsinki: eleven minutes before the Helsinki fixture's own moment. */
export const EXAMPLE_ANSWER: StockAnswer = {
  product: 'Esimerkkivalmiste 400 mg, 30 tablettia',
  asOf: Date.parse('2026-11-19T18:30:00Z') / 1000,
  lines: [
    { pharmacyId: 'toolon', level: 'inStock' },
    { pharmacyId: 'yliopiston', level: 'low' },
    { pharmacyId: 'kampin', level: 'out' },
    { pharmacyId: 'citycenter', level: 'unknown' },
  ],
};

const finland = providerFor('FI') as StockProvider;

/**
 * Finland's provider as it would be with an agreed API: the same hand-off, and `stock`
 * answering from the device. Here it answers with the example, at once.
 */
export const exampleProvider: StockProvider = {
  ...finland,
  stock: async (query) => ({ ...EXAMPLE_ANSWER, lines: EXAMPLE_ANSWER.lines.filter((line) => query.pharmacies.some((pharmacy) => pharmacy.id === line.pharmacyId)) }),
};
