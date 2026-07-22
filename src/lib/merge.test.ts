import { describe, it, expect } from 'vitest';
import { mergeRecords } from './sync';
import '../content'; // registers unit exercise ids so unitProgress recomputes
import type { ProgressRecord } from '../types';

function rec(overrides: Partial<ProgressRecord>): ProgressRecord {
  return {
    id: 'progress',
    xp: 0,
    streak: 0,
    lastActiveDate: null,
    hearts: 5,
    maxHearts: 5,
    heartsDate: null,
    completedExercises: [],
    unitProgress: {},
    badges: [],
    activeDays: [],
    completedCheckpoints: [],
    ...overrides,
  };
}

describe('mergeRecords (§10 strategy)', () => {
  it('takes the max XP', () => {
    const merged = mergeRecords(rec({ xp: 120 }), rec({ xp: 80 }));
    expect(merged.xp).toBe(120);
  });

  it('unions completed exercises and badges', () => {
    const merged = mergeRecords(
      rec({ completedExercises: ['fn-001', 'fn-002'], badges: ['csa-foundations'] }),
      rec({ completedExercises: ['fn-002', 'gr-001'], badges: ['csa-glide-record'] }),
    );
    expect(merged.completedExercises.sort()).toEqual([
      'fn-001',
      'fn-002',
      'gr-001',
    ]);
    expect(merged.badges.sort()).toEqual(['csa-foundations', 'csa-glide-record']);
  });

  it('takes streak/hearts from the more recently active record', () => {
    const local = rec({
      lastActiveDate: '2026-07-18',
      streak: 7,
      hearts: 2,
    });
    const remote = rec({
      lastActiveDate: '2026-07-16',
      streak: 3,
      hearts: 5,
    });
    const merged = mergeRecords(local, remote);
    expect(merged.streak).toBe(7);
    expect(merged.hearts).toBe(2);
    expect(merged.lastActiveDate).toBe('2026-07-18');

    // ...and the other direction when remote is newer.
    const merged2 = mergeRecords(remote, local);
    expect(merged2.streak).toBe(7);
    expect(merged2.hearts).toBe(2);
  });

  it('recomputes unit progress from the merged completed set', () => {
    const merged = mergeRecords(
      rec({ completedExercises: ['fn-001', 'fn-002'] }),
      rec({ completedExercises: ['fn-003'] }),
    );
    expect(merged.unitProgress.foundations.completed).toBe(3);
    expect(merged.unitProgress.foundations.total).toBeGreaterThanOrEqual(3);
  });

  it('on a same-day tie keeps the safe extreme (max streak, min hearts)', () => {
    const merged = mergeRecords(
      rec({ lastActiveDate: '2026-07-18', streak: 4, hearts: 1 }),
      rec({ lastActiveDate: '2026-07-18', streak: 6, hearts: 4 }),
    );
    expect(merged.streak).toBe(6);
    expect(merged.hearts).toBe(1);
  });
});
