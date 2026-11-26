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
 *
 * On a phone the scene is the whole screen, the strips behind the status bar and the
 * browser's own bar included. Those are not the page's to draw: Safari colours each from
 * what lies fixed at that edge of the page, and without that from the body's background
 * (iOS 27; before iOS 26, the upper one from theme-color). So the scene pins its own two
 * end colours to the edges, 8 px each and the colour of what is already there, sets the
 * body behind it to the street's colour (DuskScene.module.css), and keeps theme-color at
 * the sky's upper colour while it is on screen.
 */
export function DuskScene({ left, skyline = 'tall', actions, sky, children }: Props) {
  // First paint is handled by the inline script in the layout. This keeps the sky current
  // when the scene is reached later without a page load. Nothing animates.
  useEffect(() => {
    const now = sky ? skyAt(sky) : computeSky(Date.now(), Intl.DateTimeFormat().resolvedOptions().timeZone);
    if (!sky) for (const [name, value] of Object.entries(now.vars)) document.documentElement.style.setProperty(name, value);
    // The browser's own colour is the sky's upper one while the scene shows, and what it was after.
    const metas = [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')];
    const before = metas.map((meta) => meta.content);
    for (const meta of metas) meta.content = now.vars['--sky-1'];
    return () => metas.forEach((meta, index) => (meta.content = before[index]));
  }, [sky]);

  return (
    <div className={styles.scene} data-scene="dusk" data-skyline={skyline} style={sky ? (skyAt(sky).vars as CSSProperties) : undefined}>
      <span aria-hidden="true" className={styles.edgeTop} />
      <span aria-hidden="true" className={styles.edgeBottom} />
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
