'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Answers, Reports, SendResult, Summaries, Summary } from '@/lib/reports';
import type { Pharmacy } from '@/lib/types';

export interface ReportState {
  /** The report service answered for this pharmacy's country: there is something to say, if only that there are no reports yet. */
  known: boolean;
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
    known: !!known,
    summary: known && id ? known.summaries?.[id] : undefined,
    offered: !!known && !known.done,
    note: known?.done && id ? notes[id] : undefined,
    skip,
    send,
  };
}

/** What the list can be narrowed by: two of the things visitors tell. */
export const FILTER_TOPICS = ['english', 'stepFree'] as const;
export type FilterTopic = (typeof FILTER_TOPICS)[number];

export interface ReportFilter {
  on: Record<FilterTopic, boolean>;
  toggle: (topic: FilterTopic) => void;
  /** Both off: the list as it is. */
  clear: () => void;
  /** idle: nothing is on. loading: the reports are on their way, and the list is still whole. failed: they did not come. */
  state: 'idle' | 'loading' | 'ready' | 'failed';
  /** Whether a pharmacy stays in the list. Always true until the reports are there. */
  passes: (pharmacy: Pharmacy) => boolean;
}

/**
 * The list's two filters (Janne, 27 Nov 2026): only pharmacies of which visitors said that
 * English was spoken, or that the way in was step-free. Both are off until the user turns one
 * on, and nothing is asked of the report service before that. A pharmacy passes when it has a
 * summary, which takes three reports, and more of them said yes than no. The order of the list
 * is never touched: this takes rows away and puts them back, nothing else.
 */
export function useReportFilter(reports: Reports | undefined, pharmacies: Pharmacy[], initial: FilterTopic[] = []): ReportFilter {
  const [on, setOn] = useState<Record<FilterTopic, boolean>>({ english: initial.includes('english'), stepFree: initial.includes('stepFree') });
  const active = on.english || on.stepFree;
  // The countries of the pharmacies shown, as one word: the reports are asked for by country.
  const key = useMemo(() => [...new Set(pharmacies.map((pharmacy) => pharmacy.country).filter((country): country is string => !!country))].sort().join(' '), [pharmacies]);
  const [found, setFound] = useState<{ key: string; reports: Reports; byCountry: Record<string, Summaries> | undefined }>();

  useEffect(() => {
    if (!reports || !active) return;
    let live = true;
    const countries = key ? key.split(' ') : [];
    void Promise.all(countries.map((country) => reports.summariesFor(country))).then((all) => {
      if (!live) return;
      const complete = all.every((summaries) => summaries !== undefined);
      setFound({ key, reports, byCountry: complete ? Object.fromEntries(countries.map((country, index) => [country, all[index] as Summaries])) : undefined });
    });
    return () => {
      live = false;
    };
  }, [reports, active, key]);

  const known = found && found.key === key && found.reports === reports ? found : undefined;
  const state: ReportFilter['state'] = !active ? 'idle' : !known ? 'loading' : known.byCountry ? 'ready' : 'failed';
  const byCountry = known?.byCountry;
  const passes = useCallback(
    (pharmacy: Pharmacy) => {
      if (!active || !byCountry) return true;
      const answers = byCountry[pharmacy.country ?? '']?.[pharmacy.id]?.answers;
      return FILTER_TOPICS.every((topic) => {
        if (!on[topic]) return true;
        const pair = answers?.[topic];
        return !!pair && pair.yes > pair.no;
      });
    },
    [active, byCountry, on],
  );
  const toggle = useCallback((topic: FilterTopic) => setOn((before) => ({ ...before, [topic]: !before[topic] })), []);
  const clear = useCallback(() => setOn({ english: false, stepFree: false }), []);
  return { on, toggle, clear, state, passes };
}
