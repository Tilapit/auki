/**
 * Ehditkö: will you make it before the pharmacy closes (PLAN.md section 5 and 7.1, step 10).
 * Pure, and all of it in instants: the pharmacy's closing time comes from its intervals as
 * an instant, the arrival is now plus the walk, and the slack is what lies between. No
 * wall-clock arithmetic, so a change of the clocks on the way costs or gives nothing.
 * tests/vectors/ehditko.json holds cases with their answers for the iOS app.
 *
 * Instants are epoch seconds.
 */

import type { HoursStatus } from './hoursStatus.ts';

/** The timeline is shown from this long before closing, and at exactly this long too. */
export const TIMELINE_WITHIN_SECONDS = 60 * 60;

const TIGHT_MINUTES = 5;
const TIGHT_SHARE_OF_WALK = 0.2;

export type EhditkoAnswer =
  /** Closing is within the hour and the walk ends before it. slackMin: whole minutes between arriving and closing. */
  | { kind: 'timeline'; arrives: number; closes: number; slackMin: number }
  /** The walk would end at closing time or after it. */
  | { kind: 'tooLate'; arrives: number; closes: number }
  /** Nothing worth saying: it closes later than that, never closes, or isn't open. */
  | { kind: 'none' };

/**
 * When a walk that starts now ends. The clock in the user's hand shows minutes, so the walk
 * is counted from the start of the current one: "20.41" plus 3 min is "20.44", and the
 * times on screen always add up.
 */
export function arrival(now: number, walkMin: number): number {
  return Math.floor(now / 60) * 60 + walkMin * 60;
}

export function ehditko(status: HoursStatus, walkMin: number, now: number): EhditkoAnswer {
  if (status.kind !== 'open' && status.kind !== 'soon') return { kind: 'none' };
  const arrives = arrival(now, walkMin);
  const { closes } = status;
  // Arriving exactly at closing time is too late: the door is being locked.
  if (arrives >= closes) return { kind: 'tooLate', arrives, closes };
  if (closes - Math.floor(now / 60) * 60 > TIMELINE_WITHIN_SECONDS) return { kind: 'none' };
  return { kind: 'timeline', arrives, closes, slackMin: Math.floor((closes - arrives) / 60) };
}

/** True for an open pharmacy that is still open when the walk there ends. Around the clock: always. */
export function arrivesInTime(status: HoursStatus, walkMin: number, now: number): boolean {
  if (status.kind === 'open24') return true;
  if (status.kind !== 'open' && status.kind !== 'soon') return false;
  return arrival(now, walkMin) < status.closes;
}

/**
 * Slack is tight when it is under five minutes or under a fifth of the walk, whichever is
 * larger: a walking estimate is off by more on a long walk. Tight slack is shown in the
 * "closes soon" colour instead of green.
 */
export function isTightSlack(slackMin: number, walkMin: number): boolean {
  return slackMin < Math.max(TIGHT_MINUTES, walkMin * TIGHT_SHARE_OF_WALK);
}
