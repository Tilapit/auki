import type { ReactNode } from 'react';

/**
 * The few icons that carry meaning, drawn in the same rounded stroke as the cross outline.
 * No icon library (PLAN.md section 6).
 */
const paths = {
  walk: (
    <>
      <circle cx="13.5" cy="4.6" r="1.9" />
      <path d="M10.4 21l2.3-6.3-2.6-2.4.9-4.1 3.4 2.7 2.8.9" />
      <path d="M12.9 14.9l2.5 2.4.6 3.7" />
      <path d="M10.9 8.4L8 10.3l-.9 3" />
    </>
  ),
  directions: (
    <>
      <path d="M12 3.2l8.8 8.8-8.8 8.8L3.2 12z" />
      <path d="M9.3 14.6v-2.4a1.2 1.2 0 0 1 1.2-1.2h4.2" />
      <path d="M12.9 8.9l2.1 2.1-2.1 2.1" />
    </>
  ),
  phone: (
    <path d="M6.6 3.5h2.6l1.5 4.2-1.9 1.3a10.8 10.8 0 0 0 6.2 6.2l1.3-1.9 4.2 1.5v2.6a2 2 0 0 1-2.2 2A16.6 16.6 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z" />
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="M15.4 15.4l4.9 4.9" />
    </>
  ),
  refresh: (
    <>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.5 4.5v4h-4" />
    </>
  ),
  locate: (
    <>
      <circle cx="12" cy="12" r="6.5" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
    </>
  ),
  chevron: <path d="M9.5 6l6 6-6 6" />,
  chevronDown: <path d="M6 9.5l6 6 6-6" />,
  back: <path d="M14.5 6l-6 6 6 6" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  card: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="M7 10h10M7 14h6" />
    </>
  ),
  document: (
    <>
      <path d="M7 3.5h7l4 4v13H7z" />
      <path d="M14 3.5v4h4M9.5 12.5h6M9.5 16h4" />
    </>
  ),
  arrowUp: <path d="M12 19V5.5M6.5 11L12 5.5l5.5 5.5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.2V12l3.2 2" />
    </>
  ),
  /* A speech bubble: telling how a visit went. */
  speech: <path d="M5.5 4.5h13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7.3l-4.7 3.6v-3.6h-1a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" />,
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  minus: <path d="M5.5 12h13" />,
  external: (
    <>
      <path d="M14 4.5h5.5V10" />
      <path d="M19.5 4.5l-8.5 8.5" />
      <path d="M18.5 14v4.5a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1H10" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof paths;

const HEAVY: IconName[] = ['back', 'close', 'arrowUp'];

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={HEAVY.includes(name) ? 2 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flex: 'none' }}
    >
      {paths[name]}
    </svg>
  );
}
