/**
 * How the map goes on after a finger lets go of it while moving (PLAN.md section 5, "Touch").
 * Pure, so that the numbers can be tested without a map.
 *
 * As a list does on an iPhone: the map starts at the finger's own speed and loses the same
 * share of it every millisecond (UIScrollView's normal rate, 0.998, which MapLibre Native's
 * maps on iOS use too). So it travels half as many pixels as its speed was in pixels per
 * second, quickly at first and with a long tail: a flick of 1,500 px/s carries it 750 px.
 *
 * MapLibre's own glide on the web is another curve: it starts at about half the finger's
 * speed, which shows as a hitch at the moment of letting go, and stops within half a second.
 */

/** The share of its speed the map keeps over one millisecond. */
export const KEEP_PER_MS = 0.998;
/** The same as a rate per second: speed(t) = speed(0) · e^(−DECAY · t). */
const DECAY = -Math.log(KEEP_PER_MS) * 1000;
/** Slower than this at letting go, the map stays where it was put: a finger that stopped before lifting. */
export const GLIDE_FROM_PX_S = 100;
/** No flick carries the map faster than this: four screens a second. */
export const FASTEST_PX_S = 3200;
/** The glide ends when the map has slowed to this: slower can't be seen. */
export const STOP_AT_PX_S = 12;
/** Over how long a stretch of its last movement the finger's speed is measured, in ms. */
export const MEASURED_OVER_MS = 100;
/** A finger that had not moved the map for this long when it lifted had stopped: no glide. */
export const STOPPED_AFTER_MS = 70;

export interface Sample {
  /** When, in ms: the touch's own time. */
  t: number;
  /** Where the finger was on the screen then, in px. One finger moves the map with it, pixel for pixel. */
  x: number;
  y: number;
}

export interface Glide {
  /** How far the map's content goes on, in px. */
  x: number;
  y: number;
  /** For how long, in ms. */
  duration: number;
}

/**
 * The speed of the finger, and so of the map under it, when it lifted at `now`, in px per
 * second: the speed of its last MEASURED_OVER_MS of movement, as a touch screen itself reckons a flick. The
 * time between the last movement and the lifting is not counted into it: touches arrive a
 * frame or three apart, and that gap would make every flick look slower than it was. A finger
 * that held still for longer than STOPPED_AFTER_MS before lifting has no speed at all.
 */
export function speedAt(samples: readonly Sample[], now: number): { x: number; y: number } | undefined {
  const last = samples[samples.length - 1];
  if (!last || now - last.t > STOPPED_AFTER_MS) return undefined;
  const first = samples.find((sample) => last.t - sample.t <= MEASURED_OVER_MS);
  if (!first || first === last) return undefined;
  // Two touches may bear the same time: a millisecond at least, so that the speed is a number.
  const seconds = Math.max(last.t - first.t, 1) / 1000;
  return { x: (last.x - first.x) / seconds, y: (last.y - first.y) / seconds };
}

/** The glide that follows a speed, or none when the map was let go of too slowly. */
export function glideOf(speed: { x: number; y: number } | undefined): Glide | undefined {
  if (!speed) return undefined;
  const pace = Math.hypot(speed.x, speed.y);
  if (pace < GLIDE_FROM_PX_S) return undefined;
  const capped = Math.min(pace, FASTEST_PX_S);
  const seconds = Math.log(capped / STOP_AT_PX_S) / DECAY;
  // The way travelled while the speed falls from `capped` to STOP_AT_PX_S.
  const distance = (capped - STOP_AT_PX_S) / DECAY;
  return { x: (speed.x / pace) * distance, y: (speed.y / pace) * distance, duration: seconds * 1000 };
}

/**
 * The share of a glide's way that is behind it when the share `t` of its time is: the same
 * decay, so the map leaves at the finger's speed and never speeds up or jerks on the way.
 *
 * `lead` is how long the map has already stood still when the glide begins, in ms: the frame
 * the finger left it on and the frame the glide is first drawn on. The glide begins that far
 * into itself, so the map is where it would have been had it never stopped.
 */
export function easingOf(duration: number, lead = 0): (t: number) => number {
  const whole = 1 - Math.exp((-DECAY * duration) / 1000);
  const ahead = Math.max(lead, 0) / duration;
  return (t) => (1 - Math.exp((-DECAY * duration * Math.min(Math.max(t, 0) + ahead, 1)) / 1000)) / whole;
}

/** The longest standstill a glide makes up for: more than this was a pause, not a missed frame. */
export const LEAD_UP_TO_MS = 50;
