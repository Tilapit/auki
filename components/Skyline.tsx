'use client';

import { useId } from 'react';
import { cx } from './cx';
import styles from './Skyline.module.css';

/*
 * The first-visit illustration from design/skyline.svg as an inline SVG, so its colours can
 * follow the sky (lib/sky.ts) through CSS variables. Geometry is unchanged from the design file.
 */

const FAR: string[] = [
  'M-30 520 L-30 317 L17 317 L17 247 L26 215 L35 247 L35 317 L82 317 L82 520Z',
  'M83 520 L83 357 L130 323 L176 357 L176 520Z',
  'M170 520 L170 273 L206 273 L206 203 L216 171 L224 203 L224 273 L261 273 L261 520Z',
  'M256 520 L256 269 L363 269 L363 520Z',
  'M367 520 L367 303 L409 269 L451 303 L451 520Z',
  'M453 520 L453 246 L514 246 L514 520Z',
  'M513 520 L513 328 L570 328 L570 520Z',
  'M570 520 L570 303 L616 303 L616 233 L624 201 L634 233 L634 303 L679 303 L679 520Z',
  'M673 520 L673 288 L723 288 L723 520Z',
  'M721 520 L721 301 L761 267 L801 301 L801 520Z',
  'M795 520 L795 310 L846 310 L846 520Z',
  'M843 520 L843 281 L892 281 L892 520Z',
  'M892 520 L892 364 L954 364 L954 520Z',
  'M957 520 L957 305 L1031 305 L1031 520Z',
  'M1032 520 L1032 272 L1070 272 L1070 202 L1080 170 L1088 202 L1088 272 L1127 272 L1127 520Z',
  'M1130 520 L1130 273 L1183 273 L1183 520Z',
  'M1180 520 L1180 251 L1276 251 L1276 520Z',
  'M1280 520 L1280 307 L1333 307 L1333 520Z',
  'M1331 520 L1331 355 L1408 355 L1408 520Z',
  'M1409 520 L1409 332 L1480 332 L1480 520Z',
  'M1476 520 L1476 342 L1506 308 L1535 342 L1535 520Z',
  'M1537 520 L1537 308 L1589 274 L1641 308 L1641 520Z',
];

const FAR_WINDOWS: number[][] = [
  [-7, 429], [-14, 374], [135, 403], [100, 381], [229, 291], [331, 380], [282, 354], [419, 343], [426, 331], [472, 281], [481, 301], [540, 364], [532, 362], [522, 358], [660, 402], [744, 322], [932, 445], [937, 435], [914, 412], [1074, 325], [1107, 394], [1081, 383], [1341, 408], [1377, 390], [1382, 439], [1620, 343], [1591, 405],
];

const NEAR: string[] = [
  'M-20 520 L-20 382 L123 382 L123 520Z',
  'M128 520 L128 426 L161 426 L161 396 L221 396 L221 520Z',
  'M223 520 L223 317 L340 317 L340 520Z',
  'M340 520 L340 312 L434 312 L434 520Z',
  'M437 520 L437 367 L508 319 L579 367 L579 520Z',
  'M581 520 L581 401 L693 401 L693 520Z',
  'M698 520 L698 401 L861 401 L861 520Z',
  'M867 520 L867 392 L884 392 L884 520Z',
  'M884 520 L884 284 L1058 284 L1058 520Z',
  'M1058 520 L1058 344 L1136 296 L1215 344 L1215 520Z',
  'M1215 520 L1215 372 L1382 372 L1382 520Z',
  'M1384 520 L1384 429 L1440 429 L1440 399 L1544 399 L1544 520Z',
  'M1549 520 L1549 362 L1594 314 L1638 362 L1638 520Z',
];

const LEDGES: number[][] = [
  [-23, 376, 149], [220, 311, 123], [337, 306, 100], [578, 395, 118], [695, 395, 169], [864, 386, 23], [881, 278, 180], [1212, 366, 173],
];

const NEAR_WINDOWS: number[][] = [
  [10, 412, 0.92], [182, 426, 0.92], [300, 347, 0.78], [300, 377, 0.6], [252, 437, 0.6], [276, 437, 0.92], [467, 371, 0.6], [822, 431, 0.92], [954, 314, 0.6], [978, 314, 0.6], [1002, 314, 0.6], [906, 404, 0.92], [1002, 404, 0.92], [978, 434, 0.6], [1002, 434, 0.78], [1108, 348, 0.92], [1180, 348, 0.6], [1132, 438, 0.6], [1246, 402, 0.92], [1270, 402, 0.92], [1318, 402, 0.92], [1342, 432, 0.6], [1576, 396, 0.92], [1576, 426, 0.92],
];

const SHOPFRONTS: number[][] = [[714, 480], [1231, 480]];

/** Which group a window belongs to: 1 is lit all night, 2 from morning to late evening, 3 in the evening, 4 never. */
const GROUPS = [3, 1, 3, 2, 4, 3, 2, 3, 1, 3, 4, 2, 3, 3, 2, 4, 3, 1, 2, 3];
const group = (index: number) => styles[`g${GROUPS[index % GROUPS.length]}`];

const CROSS =
  'M1091.2 360.0 L1104.8 360.0 L1104.8 373.2 L1118.0 373.2 L1118.0 386.8 L1104.8 386.8 L1104.8 400.0 L1091.2 400.0 L1091.2 386.8 L1078.0 386.8 L1078.0 373.2 L1091.2 373.2Z';

/** A city with one lit pharmacy cross. Decorative: hidden from assistive technology. */
export function Skyline({ className }: { className?: string }) {
  const id = useId();
  return (
    <div className={cx(styles.frame, className)} aria-hidden="true">
      <svg viewBox="0 0 1600 560" className={styles.svg} focusable="false">
        <defs>
          <radialGradient id={`${id}-glow`}>
            <stop offset="0" stopColor="#3DDBA0" stopOpacity="0.62" />
            <stop offset="0.35" stopColor="#3DDBA0" stopOpacity="0.2" />
            <stop offset="1" stopColor="#3DDBA0" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-spill`}>
            <stop offset="0" stopColor="#7CEBC3" stopOpacity="0.45" />
            <stop offset="1" stopColor="#7CEBC3" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-shop`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#EFFFF8" />
            <stop offset="1" stopColor="#9FE9CC" />
          </linearGradient>
          <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        {FAR.map((d) => (
          <path key={d} d={d} className={styles.far} />
        ))}
        {FAR_WINDOWS.map(([x, y], index) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="6" height="8" fillOpacity="0.55" className={group(index)} />
        ))}

        {NEAR.map((d) => (
          <path key={d} d={d} className={styles.near} />
        ))}
        {LEDGES.map(([x, y, width]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={width} height="7" className={styles.near} />
        ))}
        {NEAR_WINDOWS.map(([x, y, opacity], index) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="10" height="14" rx="1" fillOpacity={opacity} className={group(index + 7)} />
        ))}
        {SHOPFRONTS.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="70" height="32" rx="1" fillOpacity="0.5" className={styles.g2} />
        ))}

        {/* The pharmacy: always open, always lit. */}
        <g className={styles.glow}>
          <ellipse cx="991" cy="526" rx="210" ry="26" fill={`url(#${id}-spill)`} />
        </g>
        <rect x="898" y="470" width="146" height="44" rx="2" fill={`url(#${id}-shop)`} fillOpacity="0.92" />
        <rect x="950" y="470" width="2" height="44" fill="#0B1B31" fillOpacity="0.5" />
        <rect x="994" y="470" width="2" height="44" fill="#0B1B31" fillOpacity="0.5" />
        <g className={styles.glow}>
          <circle cx="1098" cy="380" r="230" fill={`url(#${id}-glow)`} />
        </g>
        <rect x="1056" y="375" width="14" height="6" fill="#0B1B31" />
        <rect x="1068" y="350" width="60" height="60" rx="11" fill="#0B1B31" stroke="#3DDBA0" strokeOpacity="0.5" strokeWidth="1.6" />
        <path d={CROSS} fill="#3DDBA0" stroke="#3DDBA0" strokeWidth="2" strokeLinejoin="round" filter={`url(#${id}-blur)`} />
        <path d={CROSS} fill="#7FF5C9" stroke="#3DDBA0" strokeWidth="1.6" strokeLinejoin="round" />

        <rect x="0" y="519" width="1600" height="41" className={styles.street} />
        <g className={styles.glow}>
          <ellipse cx="991" cy="528" rx="190" ry="16" fill={`url(#${id}-spill)`} />
        </g>
        <rect x="0" y="521" width="1600" height="1" fill="#22385F" />
      </svg>
    </div>
  );
}
