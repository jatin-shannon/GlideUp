import type { ProgressRecord } from '../types';

/**
 * Hearts state + reset rules. Hearts are a per-day pool: they refill to
 * `maxHearts` on the first interaction of a new calendar day, and decrement
 * by one on each wrong answer. At 0, the session soft-fails.
 */

/**
 * Return the hearts a record should have *right now*, applying a daily reset
 * if the stored `heartsDate` is not today. Does not mutate the input.
 */
export function heartsForToday(
  record: Pick<ProgressRecord, 'hearts' | 'maxHearts' | 'heartsDate'>,
  today: string,
): { hearts: number; heartsDate: string } {
  if (record.heartsDate !== today) {
    return { hearts: record.maxHearts, heartsDate: today };
  }
  return { hearts: record.hearts, heartsDate: today };
}

/** Subtract one heart, clamped at zero. */
export function loseHeart(hearts: number): number {
  return Math.max(0, hearts - 1);
}

export function isOutOfHearts(hearts: number): boolean {
  return hearts <= 0;
}
