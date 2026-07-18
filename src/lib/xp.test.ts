import { describe, it, expect } from 'vitest';
import { comboMultiplier, baseXp, awardXp } from './xp';
import type { Exercise } from '../types';

const ex = (xp: number, difficulty: number): Exercise => ({
  id: 'x',
  type: 'multiple-choice',
  prompt: '',
  options: ['a', 'b'],
  correctIndex: 0,
  xp,
  difficulty,
});

describe('comboMultiplier', () => {
  it('is 1× below 3 in a row', () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(1)).toBe(1);
    expect(comboMultiplier(2)).toBe(1);
  });
  it('is 1.5× from 3 and 2× from 5', () => {
    expect(comboMultiplier(3)).toBe(1.5);
    expect(comboMultiplier(4)).toBe(1.5);
    expect(comboMultiplier(5)).toBe(2);
    expect(comboMultiplier(9)).toBe(2);
  });
});

describe('baseXp', () => {
  it('returns base at difficulty 1 and scales +50% per level', () => {
    expect(baseXp(ex(10, 1))).toBe(10);
    expect(baseXp(ex(10, 2))).toBe(15);
    expect(baseXp(ex(10, 3))).toBe(20);
  });
});

describe('awardXp', () => {
  it('applies difficulty then combo', () => {
    // difficulty 2 → base 15, combo 5 → 2× → 30
    expect(awardXp(ex(10, 2), 5)).toBe(30);
    // difficulty 1 → base 5, combo 3 → 1.5× → 8 (rounded)
    expect(awardXp(ex(5, 1), 3)).toBe(8);
    // no combo
    expect(awardXp(ex(5, 1), 1)).toBe(5);
  });
});
