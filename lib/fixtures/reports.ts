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

/** Five invented reports over two weeks, for the Helsinki fixture's nearest pharmacy. Nobody answered about the medicine. */
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
  },
};
