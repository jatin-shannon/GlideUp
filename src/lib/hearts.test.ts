import { describe, it, expect } from 'vitest';
import { heartsForToday, loseHeart, isOutOfHearts } from './hearts';

describe('heartsForToday', () => {
  it('refills to max on a new day', () => {
    expect(
      heartsForToday(
        { hearts: 1, maxHearts: 5, heartsDate: '2026-07-17' },
        '2026-07-18',
      ),
    ).toEqual({ hearts: 5, heartsDate: '2026-07-18' });
  });
  it('preserves hearts within the same day', () => {
    expect(
      heartsForToday(
        { hearts: 2, maxHearts: 5, heartsDate: '2026-07-18' },
        '2026-07-18',
      ),
    ).toEqual({ hearts: 2, heartsDate: '2026-07-18' });
  });
  it('refills when no day recorded yet', () => {
    expect(
      heartsForToday(
        { hearts: 0, maxHearts: 5, heartsDate: null },
        '2026-07-18',
      ),
    ).toEqual({ hearts: 5, heartsDate: '2026-07-18' });
  });
});

describe('loseHeart', () => {
  it('decrements and clamps at 0', () => {
    expect(loseHeart(3)).toBe(2);
    expect(loseHeart(0)).toBe(0);
  });
});

describe('isOutOfHearts', () => {
  it('is true only at 0', () => {
    expect(isOutOfHearts(1)).toBe(false);
    expect(isOutOfHearts(0)).toBe(true);
  });
});
