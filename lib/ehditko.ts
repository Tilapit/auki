/**
 * Ehditkö. The full rule (timeline, too late, nothing) arrives in M5 with its tests at
 * 59, 60 and 61 minutes. M0 needs only this part of it.
 */

const TIGHT_MINUTES = 5;
const TIGHT_SHARE_OF_WALK = 0.2;

/**
 * Slack is tight when it is under five minutes or under a fifth of the walk, whichever is
 * larger: a walking estimate is off by more on a long walk. Tight slack is shown in the
 * "closes soon" colour instead of green.
 */
export function isTightSlack(slackMin: number, walkMin: number): boolean {
  return slackMin < Math.max(TIGHT_MINUTES, walkMin * TIGHT_SHARE_OF_WALK);
}
