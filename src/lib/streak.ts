import { daysBetween } from './dates';

/**
 * Daily streak logic. Pure functions over (currentStreak, lastActiveDate,
 * today). Streak increments once per calendar day on the first completed
 * exercise, and resets if a full day was missed.
 */

export interface StreakResult {
  streak: number;
  /** True when today is a newly-counted active day (streak just advanced). */
  advanced: boolean;
}

/**
 * Compute the streak after completing an exercise `today`.
 *
 * - Same day as last activity → unchanged (already counted today).
 * - Exactly the next day → +1.
 * - First ever activity → 1.
 * - A gap of 2+ days → reset to 1 (today restarts the streak).
 */
export function advanceStreak(
  currentStreak: number,
  lastActiveDate: string | null,
  today: string,
): StreakResult {
  if (!lastActiveDate) {
    return { streak: 1, advanced: true };
  }

  const gap = daysBetween(lastActiveDate, today);

  if (gap <= 0) {
    // Already active today (or clock skew) — no change.
    return { streak: Math.max(currentStreak, 1), advanced: false };
  }
  if (gap === 1) {
    return { streak: currentStreak + 1, advanced: true };
  }
  // Missed one or more full days.
  return { streak: 1, advanced: true };
}

/**
 * The streak as it should *display* right now, without recording activity.
 * If more than a day has passed since last activity, the streak is stale
 * and shows as 0.
 */
export function displayStreak(
  currentStreak: number,
  lastActiveDate: string | null,
  today: string,
): number {
  if (!lastActiveDate) return 0;
  const gap = daysBetween(lastActiveDate, today);
  if (gap <= 1) return currentStreak;
  return 0;
}
