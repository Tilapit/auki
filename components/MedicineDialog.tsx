'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { rich } from '@/lib/i18n/rich';
import { MEDICINE_MAX_LENGTH, type StockProvider } from '@/lib/stock/provider';
import { Button, IconButton } from './Button';
import { cx } from './cx';
import { Icon } from './Icon';
import { NEW_TAB, NewTabNote } from './NewTab';
import styles from './MedicineDialog.module.css';

/**
 * The entry: a row of its own, in the card and in a pharmacy's details (Janne, 26 Nov 2026;
 * until then a link at the end of the "Ei varastossa?" line). It is named as the dialog it
 * opens is, and says under the name where the check is made: the country's own service.
 * It asks nothing until it is pressed (PLAN.md section 3, principle 8).
 */
export function MedicineRow({ onOpen, site, className }: { onOpen: () => void; site: string; className?: string }) {
  const { t } = useI18n();
  return (
    <button type="button" className={cx(styles.row, className)} aria-haspopup="dialog" onClick={onOpen}>
      <Icon name="search" size={20} />
      <span className={styles.rowText}>
        <span className={styles.rowTitle}>{t.medicine.title}</span>
        <span className={styles.rowSite}>{site}</span>
      </span>
    </button>
  );
}

interface Props {
  /** The country's own stock search. Without one the dialog has nothing to say and stays shut. */
  provider: StockProvider | undefined;
  open: boolean;
  onClose: () => void;
  /** /dev/states only: the field as it looks with a name in it. */
  initialValue?: string;
  /** /dev/states only: what stands under the link. The live app passes nothing here. */
  children?: ReactNode;
}

/**
 * Where to check whether a medicine is in stock: the country's own service, opened with
 * the name the user typed where its address takes one (PLAN.md 7.9). The app itself knows
 * nothing about stock and says so.
 *
 * A medicine's name is health information, so the field is built to keep it on the device
 * until the user opens the link (PLAN.md 7.6):
 * - no form and no `name`: nothing can submit it to our own address, with or without JavaScript;
 * - it lives in this component's memory, and is gone when the dialog closes;
 * - `autocomplete="off"`: the browser neither saves it nor offers it again;
 * - `spellcheck={false}`: a browser's cloud spelling service would otherwise be sent the text;
 * - the link has no referrer and opens the service the button names, in a tab of its own.
 */
export function MedicineDialog({ provider, open, onClose, initialValue = '', children }: Props) {
  const { t, f } = useI18n();
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState(initialValue);
  const shown = open && !!provider;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (shown && !dialog.open) {
      dialog.showModal();
      // Start reading from the title, not from the close button.
      dialog.querySelector<HTMLElement>('[data-dialog-focus]')?.focus();
    }
    if (!shown && dialog.open) dialog.close();
  }, [shown]);

  if (!provider) return null;

  const copy = t.medicine.services[provider.id as keyof typeof t.medicine.services];
  const handoff = provider.handoff({ medicine: value });
  const close = () => {
    // The name does not outlive the dialog.
    setValue(initialValue);
    onClose();
  };
  const onKey = (event: KeyboardEvent<HTMLInputElement>) => {
    // The keyboard's "go" follows the link, as a press on it would.
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      ref.current?.querySelector<HTMLAnchorElement>('[data-handoff]')?.click();
    }
  };

  return (
    <dialog ref={ref} className={styles.dialog} aria-labelledby={`${id}-h`} onClose={close}>
      <div className={styles.bar}>
        <h2 id={`${id}-h`} tabIndex={-1} data-dialog-focus className={styles.title}>
          {t.medicine.title}
        </h2>
        <IconButton icon="close" label={t.app.close} variant="quiet" onClick={close} />
      </div>

      <div className={styles.body}>
        <div className={styles.about}>
          <p className={styles.intro}>{copy.intro}</p>
          {/* What the user should know of the service before leaving: who is missing from it, and what may stand in the way. */}
          {(provider.coverage || 'note' in copy) && (
            <p className={styles.limits}>
              {provider.coverage && t.medicine.coverage[provider.coverage]}
              {'note' in copy && <> {rich(copy.note, { date: <time dateTime={provider.checked}>{f.date(provider.checked)}</time> })}</>}
            </p>
          )}
        </div>

        {provider.takesMedicine && (
          <div className={styles.field}>
            <label htmlFor={`${id}-name`} className={styles.label}>
              {t.medicine.label}
            </label>
            <input
              id={`${id}-name`}
              type="text"
              className={styles.input}
              value={value}
              maxLength={MEDICINE_MAX_LENGTH}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="go"
              aria-describedby={`${id}-sent`}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={onKey}
            />
            {'hint' in copy && <p className={styles.hint}>{copy.hint}</p>}
          </div>
        )}

        <Button variant="primary" size="block" trailing="external" href={handoff.url} {...NEW_TAB} data-handoff={handoff.withMedicine ? 'medicine' : 'plain'}>
          {copy.open}
          <NewTabNote />
        </Button>

        <div className={styles.notes}>
          <p id={`${id}-sent`}>{provider.takesMedicine ? rich(t.medicine.sent, { site: <span className={styles.site}>{copy.site}</span> }) : t.medicine.nothingSent}</p>
          <p>{t.medicine.confirm}</p>
        </div>

        {children}
      </div>
    </dialog>
  );
}
