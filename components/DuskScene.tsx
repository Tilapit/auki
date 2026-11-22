'use client';

import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { computeSky, skyAt, type SkyAt } from '@/lib/sky';
import { cx } from './cx';
import { LanguageSwitch } from './LanguageSwitch';
import { SiteFooter } from './SiteFooter';
import { Skyline } from './Skyline';
import styles from './DuskScene.module.css';

interface Props {
  /** Top left: the wordmark, or a back link. */
  left: ReactNode;
  skyline?: 'tall' | 'low';
  /** Phone: in the dark band that continues the street. Desktop: inline under the content. */
  actions?: ReactNode;
  /** A fixed moment for /dev/states and tests. Left out, the sky follows the device clock. */
  sky?: SkyAt;
  children: ReactNode;
}

/**
 * The sky scene shared by the first visit and the place search: a sky that follows the sun
 * (lib/sky.ts), the skyline with its one lit cross, and the footer on the street.
 * The only place a gradient appears.
 */
export function DuskScene({ left, skyline = 'tall', actions, sky, children }: Props) {
  // First paint is handled by the inline script in the layout. This keeps the sky current
  // when the scene is reached later without a page load. Nothing animates.
  useEffect(() => {
    if (sky) return;
    const now = computeSky(Date.now(), Intl.DateTimeFormat().resolvedOptions().timeZone);
    for (const [name, value] of Object.entries(now.vars)) document.documentElement.style.setProperty(name, value);
  }, [sky]);

  return (
    <div className={styles.scene} data-skyline={skyline} style={sky ? (skyAt(sky).vars as CSSProperties) : undefined}>
      <header className={styles.top}>
        {left}
        <LanguageSwitch variant="dusk" />
      </header>
      <main className={cx(styles.main, actions ? styles.withBand : undefined)}>
        <div className={styles.hero}>
          <div className={styles.content}>{children}</div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
        <Skyline className={styles.skyline} />
      </main>
      <SiteFooter variant="dusk" credit />
    </div>
  );
}
