import type { CSSProperties } from 'react';
import type { GlyphState } from '@/lib/types';
import { cx } from './cx';
import styles from './CrossGlyph.module.css';

/** The plus with equal arms; rounded terminals come from the round stroke join. */
export const CROSS_PATH =
  'M7.1 1.8L12.9 1.8L12.9 7.1L18.2 7.1L18.2 12.9L12.9 12.9L12.9 18.2L7.1 18.2L7.1 12.9L1.8 12.9L1.8 7.1L7.1 7.1Z';

interface Props {
  /** One shape per state, so colour is never the only signal. "mono" takes the text colour, for use inside markers. */
  state: GlyphState | 'mono';
  size?: number;
  /** Outline weight for the small sizes on the map. */
  stroke?: number;
  className?: string;
}

/** The status glyph. Always decorative: the status text sits next to it. */
export function CrossGlyph({ state, size = 20, stroke, className }: Props) {
  const style = stroke ? ({ '--stroke': stroke } as CSSProperties) : undefined;
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      className={cx(styles.glyph, styles[state], className)}
      style={style}
    >
      <path d={CROSS_PATH} />
    </svg>
  );
}
