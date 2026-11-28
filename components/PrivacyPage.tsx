'use client';

import type { ReactNode } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { privacyTexts } from '@/lib/i18n/privacy';
import { rich } from '@/lib/i18n/rich';
import { KEPT } from '@/lib/kept';
import { OPENED_BY_USER, REQUESTS, addressOf, connectSources, methodOf } from '@/lib/requests';
import { TextPage } from './TextPage';
import styles from './PrivacyPage.module.css';
import text from './TextPage.module.css';

interface Entry {
  name: string;
  when: string;
  carries: string;
  receiver: string;
}

/**
 * "What the app sends" (PLAN.md 7.6). The rows are the entries of lib/requests.ts, in its
 * order, each with its texts from lib/i18n/privacy.ts: a request that joins the list is on the page,
 * and one that is not on the list can't be. What the device keeps comes from lib/kept.ts, and
 * the policy's line from the same function that writes the header.
 *
 * It reads no clock and calls no service: it is also a view of /dev/states as it is.
 */
export function PrivacyPage() {
  const { locale } = useI18n();
  const p = privacyTexts[locale];
  return (
    <TextPage title={p.title}>
      {p.intro.map((line) => (
        <p key={line} className={text.intro}>
          {line}
        </p>
      ))}

      <h2 className={styles.heading}>{p.requestsTitle}</h2>
      <p className={text.text}>{p.requestsIntro}</p>
      <ul className={styles.list} data-requests>
        {REQUESTS.map((request) => (
          <Row
            key={request.id}
            entry={p.requests[request.id]}
            code={`${methodOf(request)} ${addressOf(request)}`}
            host={addressOf(request)}
            lead={request.carries === 'the exact position' ? p.onlyPosition : undefined}
          />
        ))}
      </ul>

      <h2 className={styles.heading}>{p.linksTitle}</h2>
      <p className={text.text}>{p.linksIntro}</p>
      <ul className={styles.list} data-opened>
        {OPENED_BY_USER.map((link) => (
          <Row key={link.id} entry={p.opened[link.id]} />
        ))}
      </ul>

      <h2 className={styles.heading}>{p.keptTitle}</h2>
      <p className={text.text}>{p.keptIntro}</p>
      <ul className={styles.list} data-kept>
        {KEPT.map((kept) => (
          <li key={kept.id} className={styles.item}>
            <h3 className={styles.name}>{p.kept[kept.id].name}</h3>
            <code className={styles.code}>{kept.key}</code>
            <p className={styles.fact}>{p.kept[kept.id].text}</p>
            <p className={styles.where}>{p.stores[kept.store]}</p>
          </li>
        ))}
      </ul>
      <p className={text.text}>{p.keptNote}</p>

      <h2 className={styles.heading}>{p.checkTitle}</h2>
      <p className={text.text}>{p.checkPolicy}</p>
      <p className={styles.policy}>
        <code data-policy>{connectSources()}</code>
      </p>
      <p className={text.text}>{p.checkTest}</p>
      <p className={text.text}>{p.checkList}</p>
    </TextPage>
  );
}

/** One request, or one kind of link: its name, its address where it has one, and the three answers. */
function Row({ entry, code, host, lead }: { entry: Entry; code?: string; host?: string; lead?: string }) {
  const { locale } = useI18n();
  const { labels } = privacyTexts[locale];
  const fact = (label: string, value: ReactNode) => (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
  return (
    <li className={styles.item}>
      <h3 className={styles.name}>{entry.name}</h3>
      {code && <code className={styles.code}>{code}</code>}
      <dl className={styles.facts}>
        {fact(labels.when, entry.when)}
        {fact(
          labels.carries,
          <>
            {lead && <strong className={styles.lead}>{lead} </strong>}
            {entry.carries}
          </>,
        )}
        {fact(labels.receiver, rich(entry.receiver, { host: <span className={styles.host}>{host}</span> }))}
      </dl>
    </li>
  );
}
