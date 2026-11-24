import type { GlyphState } from '@/lib/types';
import { CROSS_PATH } from './CrossGlyph';

/**
 * The small signs of the pharmacies beyond the list (lib/map/area.ts), drawn once per theme
 * as pictures the map can stamp a thousand times. They are the list's four glyphs on a disc:
 * a lit disc for open and closing soon, an unlit one with the outlined cross for closed, and
 * the dashed cross where the hours aren't known. Smaller than the markers of the listed
 * pharmacies, and without a distance or a glow: those belong to the nearest ten.
 */

export interface SignColours {
  open: string;
  openInk: string;
  soon: string;
  soonInk: string;
  /** The unlit disc, its ring, and the cross on it. */
  disc: string;
  discRing: string;
  unlit: string;
  /** The ring every marker stands on, so that streets don't run into it. */
  ground: string;
}

/** The custom properties of app/globals.css each colour comes from. */
export const SIGN_TOKENS: Record<keyof SignColours, string> = {
  open: '--marker-open',
  openInk: '--marker-open-ink',
  soon: '--soon-fill',
  soonInk: '--soon-ink',
  disc: '--disc',
  discRing: '--disc-ring',
  unlit: '--closed-glyph',
  ground: '--marker-ring',
};

export const SIGNS: GlyphState[] = ['open', 'soon', 'closed', 'unknown'];

/** The picture's side in CSS pixels: a disc of 20 (lit) or 18 (unlit) and the 2 px ground ring. */
const BOX = 24;

export function drawSign(glyph: GlyphState, colours: SignColours, ratio: number): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = Math.round(BOX * ratio);
  const context = canvas.getContext('2d')!;
  context.scale(ratio, ratio);
  const lit = glyph === 'open' || glyph === 'soon';
  const middle = BOX / 2;
  const radius = lit ? 10 : 9;
  const circle = (r: number) => {
    context.beginPath();
    context.arc(middle, middle, r, 0, Math.PI * 2);
  };

  circle(radius + 2);
  context.fillStyle = colours.ground;
  context.fill();
  circle(radius);
  context.fillStyle = glyph === 'open' ? colours.open : glyph === 'soon' ? colours.soon : colours.disc;
  context.fill();
  if (!lit) {
    circle(radius - 0.75);
    context.lineWidth = 1.5;
    context.strokeStyle = colours.discRing;
    context.stroke();
  }

  // The cross of CrossGlyph, from its 20 by 20 box.
  const size = lit ? 11 : 10;
  context.translate(middle - size / 2, middle - size / 2);
  context.scale(size / 20, size / 20);
  context.lineJoin = 'round';
  const cross = new Path2D(CROSS_PATH);
  if (lit) {
    context.fillStyle = context.strokeStyle = glyph === 'open' ? colours.openInk : colours.soonInk;
    context.lineWidth = 1;
    context.fill(cross);
    context.stroke(cross);
  } else {
    context.strokeStyle = colours.unlit;
    context.lineWidth = 2.6;
    if (glyph === 'unknown') context.setLineDash([2.5, 2.05]);
    context.stroke(cross);
  }
  return context.getImageData(0, 0, canvas.width, canvas.height);
}
