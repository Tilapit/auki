'use client';

import { Fragment, useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { TOPICS, type Answers, type SendResult, type Summary, type Topic } from '@/lib/reports';
import { Row } from './Actions';
import { Button, IconButton } from './Button';
import { cx } from './cx';
import styles from './ReportDialog.module.css';

/**
 * The offer: the last row of the list in a pharmacy's details (PLAN.md 7.10). A question and
 * what pressing it does, and beside them "Ohita", always in view: the row is offered, never
 * asked, and passing it over takes one press. It is a row like the others since 27 Nov 2026,
 * with the icon and the chevron they have.
 */
export function ReportRow({ name, onOpen, onSkip, className }: { name: string; onOpen: () => void; onSkip: () => void; className?: string }) {
  const { t } = useI18n();
  return (
    <Row
      className={className}
      rowProps={{ 'data-report-row': '' }}
      icon="speech"
      title={t.report.rowTitle}
      sub={t.report.rowAction}
      aria-haspopup="dialog"
      onClick={onOpen}
      beside={
        <Button variant="text" className={styles.skip} aria-label={t.report.skipLabel(name)} onClick={onSkip}>
          {t.report.skip}
        </Button>
      }
    />
  );
}

/** What stands where the row was, once it has been used: thanks, or that the pharmacy's day is full. */
export function ReportNote({ kind, className }: { kind: 'thanks' | 'limit'; className?: string }) {
  const { t } = useI18n();
  return (
    <p className={cx(styles.note, className)} role="status" data-report-note={kind}>
      {t.report[kind]}
    </p>
  );
}

/**
 * What others told of this pharmacy: shown from three reports on, as counts, with how many
 * reports there are and the days they came. Labelled as what it is: anonymous and not checked
 * by anyone. The research trip's own findings are elsewhere and stay as they are.
 */
export function ReportSummary({ summary, className }: { summary: Summary; className?: string }) {
  const { t, f } = useI18n();
  const id = useId();
  const topics = TOPICS.filter((topic) => summary.answers[topic]);
  return (
    <section className={cx(styles.summary, className)} aria-labelledby={`${id}-h`} data-report-summary>
      <h3 id={`${id}-h`} className={styles.summaryTitle}>
        {t.report.summaryTitle}
      </h3>
      {topics.length > 0 && (
        <dl className={styles.counts}>
          {topics.map((topic) => {
            const { yes, no } = summary.answers[topic]!;
            return (
              <Fragment key={topic}>
                <dt>{t.report.topics[topic].label}</dt>
                <dd>{t.report.topics[topic].counted(f.count(yes), f.count(no))}</dd>
              </Fragment>
            );
          })}
        </dl>
      )}
      <p className={styles.summaryMeta}>{t.report.summaryMeta(f.count(summary.count), f.dateRange(summary.from, summary.to))}</p>
    </section>
  );
}

interface Props {
  /** The pharmacy the report is about, as the sheet names it. */
  name: string;
  open: boolean;
  onClose: () => void;
  /** Sends what was chosen. The dialog stays open only when that failed and can be tried again. */
  onSend: (answers: Answers) => Promise<SendResult>;
  onSkip: () => void;
  /** /dev/states only: chips pressed from the start, and the line a failed sending leaves. */
  initialAnswers?: Answers;
  initialFailed?: boolean;
}

/**
 * One screen of chips, no text field (PLAN.md 7.10): five things a visit can be told by, each
 * with two chips of which at most one is pressed, and none has to be. "Ohita" is beside
 * "Lähetä" all the time. What is sent is the pharmacy and the chips pressed, and the dialog
 * says so above the buttons' result: there is nowhere to type a name, a medicine or anything else.
 */
export function ReportDialog({ name, open, onClose, onSend, onSkip, initialAnswers, initialFailed = false }: Props) {
  const { t } = useI18n();
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const [answers, setAnswers] = useState<Answers>(initialAnswers ?? {});
  const [state, setState] = useState<'idle' | 'empty' | 'sending' | 'failed'>(initialFailed ? 'failed' : 'idle');

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Start reading from the title, not from the close button.
      dialog.querySelector<HTMLElement>('[data-dialog-focus]')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => {
    // Nothing chosen outlives the dialog.
    setAnswers(initialAnswers ?? {});
    setState('idle');
    onClose();
  };
  const press = (topic: Topic, value: boolean) => {
    setAnswers((before) => {
      const { [topic]: pressed, ...others } = before;
      return pressed === value ? others : { ...others, [topic]: value };
    });
    setState((before) => (before === 'sending' ? before : 'idle'));
  };
  const send = async () => {
    if (state === 'sending') return;
    if (Object.keys(answers).length === 0) return setState('empty');
    setState('sending');
    const result = await onSend(answers);
    // Sent, or refused for the day: the sheet says which, and this closes. Only a failure can be tried again.
    setState(result === 'failed' ? 'failed' : 'idle');
    if (result !== 'failed') setAnswers(initialAnswers ?? {});
  };

  return (
    <dialog ref={ref} className={styles.dialog} aria-labelledby={`${id}-h`} data-report-dialog onClose={close}>
      <div className={styles.bar}>
        <div className={styles.heading}>
          <h2 id={`${id}-h`} tabIndex={-1} data-dialog-focus className={styles.title}>
            {t.report.title}
          </h2>
          <p className={styles.name}>{name}</p>
        </div>
        <IconButton icon="close" label={t.app.close} variant="quiet" onClick={close} />
      </div>

      <div className={styles.body}>
        <p className={styles.intro}>{t.report.intro}</p>

        <div className={styles.topics}>
          {TOPICS.map((topic) => (
            <div key={topic} role="group" aria-label={t.report.topics[topic].label} className={styles.topic}>
              {([true, false] as const).map((value) => (
                <button key={String(value)} type="button" className={styles.chip} aria-pressed={answers[topic] === value} onClick={() => press(topic, value)}>
                  {t.report.topics[topic][value ? 'yes' : 'no']}
                </button>
              ))}
            </div>
          ))}
        </div>

        <p className={styles.status} role="status">
          {state === 'empty' && t.report.chooseOne}
          {state === 'failed' && t.report.failed}
        </p>

        <div className={styles.buttons}>
          <Button variant="primary" size="block" aria-busy={state === 'sending'} onClick={() => void send()}>
            {state === 'sending' ? t.report.sending : t.report.send}
          </Button>
          <Button
            size="block"
            onClick={() => {
              onSkip();
              close();
            }}
          >
            {t.report.skip}
          </Button>
        </div>

        <p className={styles.privacy}>{t.report.privacy}</p>
      </div>
    </dialog>
  );
}
