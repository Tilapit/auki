import { CROSS_PATH } from './CrossGlyph';
import styles from './AppMark.module.css';

/** The app mark: one lit cross on a dark tile, the same in both themes. */
export function AppMark({ size = 30 }: { size?: number }) {
  const cross = Math.round(size * 0.6);
  return (
    <span aria-hidden="true" className={styles.mark} style={{ width: size, height: size }}>
      <svg width={cross} height={cross} viewBox="0 0 20 20">
        <path d={CROSS_PATH} />
      </svg>
    </span>
  );
}
