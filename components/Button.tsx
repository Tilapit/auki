import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';
import { Icon, type IconName } from './Icon';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'text' | 'dusk' | 'duskText';
type Size = 'md' | 'lg' | 'block';

interface Common {
  variant?: Variant;
  size?: Size;
  /** Only where the icon carries meaning: walking route, call, counter card. */
  icon?: IconName;
  trailing?: IconName;
  children: ReactNode;
  className?: string;
}

type AsButton = Common & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;
type AsLink = Common & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'>;

/** Rounded rectangle, no shadow. Renders a link when it has an href, otherwise a button. */
export function Button(props: AsButton | AsLink) {
  const { variant = 'secondary', size = 'md', icon, trailing, children, className, ...rest } = props;
  const classes = cx(styles.button, styles[variant], styles[size], icon && styles.withIcon, trailing && styles.withTrailing, className);
  const content = (
    <>
      {icon && <Icon name={icon} />}
      <span className={styles.label}>{children}</span>
      {trailing && <Icon name={trailing} size={18} />}
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

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
  icon: IconName;
  /** Icon-only buttons always have a name. */
  label: string;
  variant?: 'outline' | 'quiet' | 'bare' | 'dusk';
  iconSize?: number;
}

export function IconButton({ icon, label, variant = 'outline', iconSize = 20, className, ...rest }: IconButtonProps) {
  return (
    <button type="button" aria-label={label} className={cx(styles.iconButton, styles[`icon-${variant}`], className)} {...rest}>
      <Icon name={icon} size={iconSize} />
    </button>
  );
}
