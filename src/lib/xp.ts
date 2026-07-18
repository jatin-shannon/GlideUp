import type { Exercise } from '../types';

/**
 * XP + combo calculation. Pure functions, no side effects — unit-testable
 * in isolation.
 */

/** Combo thresholds: N correct in a row → multiplier. Highest match wins. */
const COMBO_TIERS: ReadonlyArray<{ streak: number; multiplier: number }> = [
  { streak: 5, multiplier: 2 },
  { streak: 3, multiplier: 1.5 },
];

/**
 * Combo multiplier for the current in-session correct streak.
 * `comboCount` is the number of consecutive correct answers so far,
 * counting the answer being scored.
 */
export function comboMultiplier(comboCount: number): number {
  for (const tier of COMBO_TIERS) {
    if (comboCount >= tier.streak) return tier.multiplier;
  }
  return 1;
}

/**
 * Base XP for an exercise, scaled by difficulty. Difficulty 1 = base `xp`;
 * each additional level adds 50% of the base.
 */
export function baseXp(exercise: Exercise): number {
  const scale = 1 + (Math.max(1, exercise.difficulty) - 1) * 0.5;
  return Math.round(exercise.xp * scale);
}

/**
 * Total XP awarded for a correct answer, including the active combo
 * multiplier. Rounded to a whole number.
 */
export function awardXp(exercise: Exercise, comboCount: number): number {
  return Math.round(baseXp(exercise) * comboMultiplier(comboCount));
}
