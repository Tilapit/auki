import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';
import { Icon, type IconName } from './Icon';
import styles from './Actions.module.css';

/*
 * How the card and a pharmacy's details offer what can be done (Janne, 27 Nov 2026):
 *
 * - the main actions as one row of equal buttons, the icon over the word: route, call, medicine;
 * - everything else as rows of a list in an inset group, each with an icon in front and a mark
 *   at its end that says what a press does: a chevron for what opens here, the mark of a link
 *   for what leaves the app.
 *
 * Rounded rectangles without shadows, like every button here. A control is a link when it
 * has an href, otherwise a button.
 */

type AsButton = { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;
type AsLink = { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'>;

/** The row of main actions. Its buttons share the width equally, however many there are. */
export function ActionBar({ children, className, fold }: { children: ReactNode; className?: string; /** The phone's sheet may rest with its edge under this row. */ fold?: boolean }) {
  return (
    <div className={cx(styles.bar, className)} data-fold={fold || undefined}>
      {children}
    </div>
  );
}

type ActionProps = {
  icon: IconName;
  /** One or two words. */
  children: ReactNode;
  /** A second, small line: where the button leads, when its word doesn't say (the map app's name). */
  sub?: ReactNode;
  /** For a screen reader only, after the words: that the link opens in a tab of its own. */
  note?: ReactNode;
  primary?: boolean;
  /** The link leaves the app: its corner carries the mark of one. */
  external?: boolean;
} & (AsButton | AsLink);

export function ActionButton({ icon, children, sub, note, primary, external, ...rest }: ActionProps) {
  const classes = cx(styles.action, primary ? styles.primary : styles.secondary);
  const content = (
    <>
      <Icon name={icon} size={22} />
      <span className={styles.actionLabel}>{children}</span>
      {/* The space is for the control's name, which is read from its words: without it two lines run together. */}
      {sub && (
        <>
          {' '}
          <span className={styles.actionSub}>{sub}</span>
        </>
      )}
      {note}
      {external && <Icon name="external" size={14} className={styles.actionMark} />}
    </>
  );
  if (rest.href !== undefined) {
    return (
      <a className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {content}
    </button>
  );
}

/** An inset group: a list of rows on a surface of its own. */
export function RowGroup({ children, className, ...rest }: { children: ReactNode; className?: string; 'aria-label'?: string }) {
  return (
    <ul className={cx(styles.group, className)} {...rest}>
      {children}
    </ul>
  );
}

type RowProps = {
  /** What stands in front: an icon by name, or a glyph of the row's own (a pharmacy's cross). */
  icon: IconName | ReactNode;
  title: ReactNode;
  /** A second, quieter line. */
  sub?: ReactNode;
  /** What a press does: opens something here, or leaves the app. */
  ends?: 'chevron' | 'external';
  /** After the row's own control, in the same row: a second, small control (the report row's "Ohita"). */
  beside?: ReactNode;
  className?: string;
  /** For the row itself, around its control and what stands beside it: a mark a test or a style can find. */
  rowProps?: HTMLAttributes<HTMLLIElement> & Record<`data-${string}`, string | boolean | undefined>;
} & (AsButton | AsLink);

/** One row of a group. The whole row is its one control; `beside` is a sibling of it, not inside it. */
export function Row({ icon, title, sub, ends = 'chevron', beside, className, rowProps, ...rest }: RowProps) {
  const content = (
    <>
      <span className={styles.rowIcon}>{typeof icon === 'string' ? <Icon name={icon as IconName} size={22} /> : icon}</span>
      <span className={styles.rowText}>
        <span className={styles.rowTitle}>{title}</span>
        {sub && (
          <>
            {' '}
            <span className={styles.rowSub}>{sub}</span>
          </>
        )}
      </span>
      <Icon name={ends} size={ends === 'chevron' ? 18 : 16} className={styles.rowEnd} />
    </>
  );
  return (
    <li {...rowProps} className={cx(styles.row, className)}>
      {rest.href !== undefined ? (
        <a className={styles.rowMain} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
          {content}
        </a>
      ) : (
        <button type="button" className={styles.rowMain} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
          {content}
        </button>
      )}
      {beside}
    </li>
  );
}
