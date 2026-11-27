'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Answers, Reports, SendResult, Summaries, Summary } from '@/lib/reports';
import type { Pharmacy } from '@/lib/types';

export interface ReportState {
  /** What others told of this pharmacy, once it has three reports. */
  summary?: Summary;
  /** The row is shown: the service answered, and this visit has not been answered or passed over. */
  offered: boolean;
  /** What stands in the row's place after it was used. Nothing after "Ohita". */
  note?: 'thanks' | 'limit';
  skip: () => void;
  send: (answers: Answers) => Promise<SendResult>;
}

/**
 * The reports of the pharmacy whose details are open (PLAN.md 7.10). Nothing is asked for
 * until a pharmacy's details are opened, and then one request names its country. Without
 * `reports` nothing is asked at all: /dev/states calls no service.
 *
 * The row is offered only when that request was answered, so that it is never there on a
 * server that could not take the report. A visit is this pharmacy today: answered or passed
 * over, it is not offered again, on this device, until another day.
 */
export function useReport(reports: Reports | undefined, pharmacy: Pharmacy | undefined): ReportState {
  const id = pharmacy?.id;
  const country = pharmacy?.country;
  const [found, setFound] = useState<{ id: string; reports: Reports; summaries: Summaries | undefined; done: boolean }>();
  // What a report sent from this view ended in, by pharmacy: shown in the row's place while that visit is the done one.
  const [notes, setNotes] = useState<Record<string, 'thanks' | 'limit'>>({});
  const nowDone = useCallback((pharmacy: string) => setFound((before) => (before && before.id === pharmacy ? { ...before, done: true } : before)), []);

  useEffect(() => {
    if (!reports || !id || !country) return;
    let live = true;
    void reports.summariesFor(country).then((summaries) => {
      if (live) setFound({ id, reports, summaries, done: reports.isDone(id) });
    });
    return () => {
      live = false;
    };
  }, [reports, id, country]);

  const skip = useCallback(() => {
    if (!reports || !id) return;
    reports.markDone(id);
    nowDone(id);
  }, [reports, id, nowDone]);

  const send = useCallback(
    async (answers: Answers): Promise<SendResult> => {
      if (!reports || !id || !country) return 'failed';
      const result = await reports.send({ pharmacy: id, country, answers });
      if (result !== 'failed') {
        reports.markDone(id);
        nowDone(id);
        setNotes((before) => ({ ...before, [id]: result === 'sent' ? 'thanks' : 'limit' }));
      }
      return result;
    },
    [reports, id, country, nowDone],
  );

  const known = found && found.id === id && found.reports === reports && found.summaries ? found : undefined;
  // Whether the visit is done is asked of `reports` each time a pharmacy's details are opened: it
  // knows the day, so the same pharmacy can be offered again on another one, in the same tab too.
  return {
    summary: known && id ? known.summaries?.[id] : undefined,
    offered: !!known && !known.done,
    note: known?.done && id ? notes[id] : undefined,
    skip,
    send,
  };
}
