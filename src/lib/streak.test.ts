import { describe, it, expect } from 'vitest';
import { advanceStreak, displayStreak } from './streak';

describe('advanceStreak', () => {
  it('starts at 1 on first ever activity', () => {
    expect(advanceStreak(0, null, '2026-07-18')).toEqual({
      streak: 1,
      advanced: true,
    });
  });
  it('does not double-count the same day', () => {
    expect(advanceStreak(3, '2026-07-18', '2026-07-18')).toEqual({
      streak: 3,
      advanced: false,
    });
  });
  it('increments on the next day', () => {
    expect(advanceStreak(3, '2026-07-17', '2026-07-18')).toEqual({
      streak: 4,
      advanced: true,
    });
  });
  it('resets to 1 after a missed day', () => {
    expect(advanceStreak(9, '2026-07-15', '2026-07-18')).toEqual({
      streak: 1,
      advanced: true,
    });
  });
});

describe('displayStreak', () => {
  it('shows 0 when never active', () => {
    expect(displayStreak(0, null, '2026-07-18')).toBe(0);
  });
  it('keeps the streak through today and yesterday', () => {
    expect(displayStreak(5, '2026-07-18', '2026-07-18')).toBe(5);
    expect(displayStreak(5, '2026-07-17', '2026-07-18')).toBe(5);
  });
  it('goes stale (0) once more than a day has passed', () => {
    expect(displayStreak(5, '2026-07-16', '2026-07-18')).toBe(0);
  });
});
