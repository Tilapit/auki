import type { I18n } from './i18n';
import type { Pharmacy, Scene } from './types';

export interface Travel {
  /**
   * The large number: walking minutes, or metres when only the straight line is known.
   * - `short` is what stands on screen: "3 min".
   * - `long` is the same inside the name of a control that shows it, a marker or an edge chip:
   *   "3 min kävellen". The unit stays as it is shown, because the name of a control has to
   *   contain the text on it (WCAG 2.5.3, Label in Name): that is what someone who uses the
   *   device by voice says to press it.
   * - `spoken` has the unit in full words, "3 minuuttia kävellen": for text that a screen
   *   reader reads and that is not a control's name (PLAN.md section 9).
   */
  primary: { short: string; long: string; spoken: string };
  /** The small line under it in the card. */
  secondary: { short: string; long: string };
  /** The distance alone, for list rows. Null when the primary already is the distance. */
  distance: { short: string; long: string } | null;
}

/**
 * How far a pharmacy is, in the words each surface needs. With walking data the minutes lead;
 * without it the straight-line distance leads and is labelled as such, and no minutes are guessed.
 */
export function travel({ t, f }: I18n, pharmacy: Pharmacy, kind: Scene['distance']): Travel {
  if (kind === 'walking' && pharmacy.walkMin !== undefined && pharmacy.walkMeters !== undefined) {
    const meters = { short: f.distance(pharmacy.walkMeters), long: f.distance(pharmacy.walkMeters, true) };
    return {
      primary: { short: f.minutes(pharmacy.walkMin), long: t.card.walking(f.minutes(pharmacy.walkMin)), spoken: t.card.walking(f.minutes(pharmacy.walkMin, true)) },
      secondary: { short: t.card.walking(meters.short), long: meters.long },
      distance: meters,
    };
  }
  const meters = { short: f.distance(pharmacy.straightMeters), long: f.distance(pharmacy.straightMeters, true) };
  return {
    primary: { short: meters.short, long: t.card.straight(meters.short), spoken: t.card.straight(meters.long) },
    secondary: { short: t.card.straightLabel, long: '' },
    distance: null,
  };
}

/** Beyond this in a straight line a route is not offered as a walk: the map app picks how to get there. */
const WALK_LIMIT_METERS = 3000;

export const withinWalk = (pharmacy: Pharmacy): boolean => pharmacy.straightMeters <= WALK_LIMIT_METERS;
