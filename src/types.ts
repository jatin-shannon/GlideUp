// Shared domain types for GlideUp content and progress.

export type ExerciseType = 'assembly' | 'fill-blank' | 'multiple-choice';

interface ExerciseBase {
  id: string;
  type: ExerciseType;
  prompt: string;
  xp: number;
  /** 1-based difficulty; scales base XP. */
  difficulty: number;
}

export interface AssemblyExercise extends ExerciseBase {
  type: 'assembly';
  /** Lines of code, presented shuffled to the learner. */
  blocks: string[];
  /** Indices into `blocks` giving the correct top-to-bottom order. */
  correctOrder: number[];
}

export interface FillBlankExercise extends ExerciseBase {
  type: 'fill-blank';
  /** Code snippet containing `___` where the answer goes. */
  codeContext: string;
  /** Expected text (case-insensitive, trimmed). */
  answer: string;
}

export interface MultipleChoiceExercise extends ExerciseBase {
  type: 'multiple-choice';
  options: string[];
  correctIndex: number;
}

export type Exercise =
  | AssemblyExercise
  | FillBlankExercise
  | MultipleChoiceExercise;

export interface Unit {
  unitId: string;
  unitTitle: string;
  /** Cert tier this unit maps to, e.g. "CSA". Drives the badge name. */
  certTier: string;
  /** Short description shown on the unit card. */
  description: string;
  exercises: Exercise[];
}

export interface UnitProgress {
  completed: number;
  total: number;
}

export interface ProgressRecord {
  /** Fixed key — a single progress record per install. */
  id: 'progress';
  xp: number;
  streak: number;
  /** ISO date (YYYY-MM-DD) of the last day an exercise was completed. */
  lastActiveDate: string | null;
  hearts: number;
  maxHearts: number;
  /** ISO date the hearts pool was last reset. */
  heartsDate: string | null;
  completedExercises: string[];
  unitProgress: Record<string, UnitProgress>;
  badges: string[];
  /** ISO dates the learner completed at least one exercise — powers the calendar. */
  activeDays: string[];
}
