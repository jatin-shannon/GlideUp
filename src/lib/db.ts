import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Exercise, ProgressRecord, Unit, UnitProgress } from '../types';
import { todayISO } from './dates';
import { advanceStreak } from './streak';
import { heartsForToday, loseHeart } from './hearts';
import { awardXp } from './xp';

/**
 * IndexedDB wrapper — the single source of truth for on-device progress.
 * There is exactly one progress record, keyed 'progress'.
 */

const DB_NAME = 'glideup';
const DB_VERSION = 1;
const STORE = 'progress';
const PROGRESS_KEY = 'progress' as const;

interface GlideUpDB extends DBSchema {
  progress: {
    key: string;
    value: ProgressRecord;
  };
}

let dbPromise: Promise<IDBPDatabase<GlideUpDB>> | null = null;

function getDB(): Promise<IDBPDatabase<GlideUpDB>> {
  if (!dbPromise) {
    dbPromise = openDB<GlideUpDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export function defaultProgress(): ProgressRecord {
  return {
    id: PROGRESS_KEY,
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
  };
}

/**
 * Load the progress record, creating a default one on first run. Applies the
 * daily hearts reset lazily so callers always see today's hearts pool.
 */
export async function loadProgress(): Promise<ProgressRecord> {
  const db = await getDB();
  const existing = await db.get(STORE, PROGRESS_KEY);
  const record = existing ?? defaultProgress();

  const today = todayISO();
  const { hearts, heartsDate } = heartsForToday(record, today);
  if (hearts !== record.hearts || heartsDate !== record.heartsDate) {
    const refreshed = { ...record, hearts, heartsDate };
    await db.put(STORE, refreshed);
    return refreshed;
  }

  if (!existing) {
    await db.put(STORE, record);
  }
  return record;
}

export async function saveProgress(
  record: ProgressRecord,
): Promise<ProgressRecord> {
  const db = await getDB();
  await db.put(STORE, record);
  return record;
}

/**
 * Register a wrong answer: decrement the daily hearts pool. Combo is handled
 * in-session and does not touch persisted state.
 */
export async function recordWrongAnswer(): Promise<ProgressRecord> {
  const record = await loadProgress();
  const updated: ProgressRecord = {
    ...record,
    hearts: loseHeart(record.hearts),
  };
  return saveProgress(updated);
}

export interface CorrectAnswerResult {
  progress: ProgressRecord;
  /** XP granted for this answer (already combo-scaled). */
  xpGained: number;
  /** True if this completion advanced the daily streak. */
  streakAdvanced: boolean;
}

/**
 * Register a correct answer against persisted progress: award XP (combo
 * applied by the caller via `comboCount`), advance the daily streak, mark the
 * exercise complete, and bump unit progress. Idempotent per exercise — a
 * re-answered exercise still awards XP but is only counted once toward unit
 * completion and the completed-set.
 */
export async function recordCorrectAnswer(
  exercise: Exercise,
  unitId: string,
  unitTotal: number,
  comboCount: number,
): Promise<CorrectAnswerResult> {
  const record = await loadProgress();
  const today = todayISO();

  const xpGained = awardXp(exercise, comboCount);
  const { streak, advanced } = advanceStreak(
    record.streak,
    record.lastActiveDate,
    today,
  );

  const alreadyDone = record.completedExercises.includes(exercise.id);
  const completedExercises = alreadyDone
    ? record.completedExercises
    : [...record.completedExercises, exercise.id];

  const priorUnit = record.unitProgress[unitId] ?? {
    completed: 0,
    total: unitTotal,
  };
  const completedInUnit = countCompletedInUnit(completedExercises, unitId);
  const unitProgress = {
    ...record.unitProgress,
    [unitId]: {
      completed: Math.min(completedInUnit, unitTotal),
      total: unitTotal,
    },
  };
  void priorUnit;

  const activeDays = record.activeDays.includes(today)
    ? record.activeDays
    : [...record.activeDays, today];

  const updated: ProgressRecord = {
    ...record,
    xp: record.xp + xpGained,
    streak,
    lastActiveDate: today,
    completedExercises,
    unitProgress,
    activeDays,
  };

  await saveProgress(updated);
  return { progress: updated, xpGained, streakAdvanced: advanced };
}

/**
 * How many completed exercise ids belong to a given unit. Exercise ids are
 * namespaced by unit (e.g. `fn-001`, `gr-002`), so we match on the completed
 * set against a passed-in id list rather than string prefixes for safety.
 */
let unitExerciseIndex: Record<string, Set<string>> = {};

/** Register a unit's exercise ids so unit progress can be counted accurately. */
export function indexUnit(unit: Unit): void {
  unitExerciseIndex[unit.unitId] = new Set(unit.exercises.map((e) => e.id));
}

function countCompletedInUnit(
  completedExercises: string[],
  unitId: string,
): number {
  const ids = unitExerciseIndex[unitId];
  if (!ids) return completedExercises.length;
  return completedExercises.filter((id) => ids.has(id)).length;
}

/**
 * Recompute per-unit progress from a completed-exercise list against every
 * registered unit. Used after a sync merge, where the completed set changes
 * wholesale.
 */
export function unitProgressFor(
  completedExercises: string[],
): Record<string, UnitProgress> {
  const out: Record<string, UnitProgress> = {};
  for (const [unitId, ids] of Object.entries(unitExerciseIndex)) {
    out[unitId] = {
      completed: completedExercises.filter((id) => ids.has(id)).length,
      total: ids.size,
    };
  }
  return out;
}

/**
 * Award a unit-completion badge if the unit is fully done and not already
 * badged. Returns the badge id if newly awarded, else null.
 */
export async function maybeAwardUnitBadge(
  unit: Unit,
): Promise<string | null> {
  const record = await loadProgress();
  const completedInUnit = countCompletedInUnit(
    record.completedExercises,
    unit.unitId,
  );
  if (completedInUnit < unit.exercises.length) return null;

  const badgeId = `${unit.certTier.toLowerCase()}-${unit.unitId}`;
  if (record.badges.includes(badgeId)) return null;

  await saveProgress({ ...record, badges: [...record.badges, badgeId] });
  return badgeId;
}

/** Test/debug helper: wipe all progress. */
export async function resetAllProgress(): Promise<void> {
  const db = await getDB();
  await db.put(STORE, defaultProgress());
}
