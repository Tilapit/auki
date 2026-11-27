import type { Reports, Summaries } from '../reports';

/**
 * Visitors' reports for /dev/states and the tests: no service, no clock and no storage.
 * The summaries are given, a sending succeeds at once, and what is "done" is kept in memory.
 */
export function fixedReports(summaries: Summaries = {}, done: string[] = []): Reports {
  const marked = new Set(done);
  return {
    summariesFor: () => Promise.resolve(summaries),
    send: () => Promise.resolve('sent'),
    isDone: (pharmacy) => marked.has(pharmacy),
    markDone: (pharmacy) => void marked.add(pharmacy),
  };
}

/**
 * Five invented reports over two weeks, for one pharmacy of the Helsinki fixture. Nobody
 * answered about the medicine, and three of the four who told of a prescription said it was
 * from another country. Example data: wherever it is shown, it is labelled as invented.
 */
export const FIVE_REPORTS: Summaries = {
  yliopiston: {
    count: 5,
    from: '2026-11-12',
    to: '2026-11-26',
    answers: {
      prescription: { yes: 3, no: 1 },
      english: { yes: 4, no: 0 },
      shortWait: { yes: 2, no: 2 },
      stepFree: { yes: 1, no: 0 },
    },
    foreign: { yes: 2, no: 1 },
  },
};

/** The same, and two more pharmacies of the fixture with invented reports, for the list's filters: one where English was not spoken. */
export const NEARBY_REPORTS: Summaries = {
  ...FIVE_REPORTS,
  kampin: { count: 4, from: '2026-11-15', to: '2026-11-25', answers: { english: { yes: 3, no: 1 }, stepFree: { yes: 3, no: 0 } } },
  kaartin: { count: 3, from: '2026-11-20', to: '2026-11-26', answers: { english: { yes: 0, no: 3 }, stepFree: { yes: 0, no: 2 } } },
};
