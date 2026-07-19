import { useMemo, useState } from 'react';
import type { Exercise, ProgressRecord, Unit } from '../types';
import {
  recordCorrectAnswer,
  recordWrongAnswer,
  maybeAwardUnitBadge,
} from '../lib/db';
import { badgeLabel } from '../content';
import HeartsBar from '../components/HeartsBar';
import ComboMeter from '../components/ComboMeter';
import ExerciseAssembly from '../components/ExerciseAssembly';
import ExerciseFillBlank from '../components/ExerciseFillBlank';
import ExerciseMultipleChoice from '../components/ExerciseMultipleChoice';

export interface SessionSummary {
  unitId: string;
  unitTitle: string;
  xpEarned: number;
  correct: number;
  total: number;
  bestCombo: number;
  streak: number;
  streakAdvanced: boolean;
  newBadge: string | null;
  outOfHearts: boolean;
}

interface LessonProps {
  unit: Unit;
  progress: ProgressRecord;
  onFinish: (summary: SessionSummary, updated: ProgressRecord) => void;
  onQuit: () => void;
}

interface Feedback {
  correct: boolean;
  xp: number;
}

/**
 * Lesson runner: plays the unit's exercises one at a time with immediate
 * feedback. Tracks in-session combo and hearts; ends early (soft fail) when
 * hearts hit 0. Persists XP/streak/hearts/unit-progress as it goes.
 */
export default function Lesson({
  unit,
  progress,
  onFinish,
  onQuit,
}: LessonProps) {
  const exercises = unit.exercises;
  const [index, setIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // Live session state.
  const [hearts, setHearts] = useState(progress.hearts);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(progress.streak);
  const [streakAdvanced, setStreakAdvanced] = useState(false);
  const [newBadge, setNewBadge] = useState<string | null>(null);
  const [latest, setLatest] = useState<ProgressRecord>(progress);

  const exercise = exercises[index];
  const progressPct = useMemo(
    () => Math.round((index / exercises.length) * 100),
    [index, exercises.length],
  );

  async function handleCheck(isCorrect: boolean) {
    if (submitted) return;
    setSubmitted(true);

    if (isCorrect) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setBestCombo((b) => Math.max(b, nextCombo));

      const result = await recordCorrectAnswer(
        exercise,
        unit.unitId,
        exercises.length,
        nextCombo,
      );
      setXpEarned((x) => x + result.xpGained);
      setCorrectCount((c) => c + 1);
      setStreak(result.progress.streak);
      if (result.streakAdvanced) setStreakAdvanced(true);
      setLatest(result.progress);
      setFeedback({ correct: true, xp: result.xpGained });

      const badge = await maybeAwardUnitBadge(unit);
      if (badge) setNewBadge(badge);
    } else {
      setCombo(0);
      const updated = await recordWrongAnswer();
      setHearts(updated.hearts);
      setLatest(updated);
      setFeedback({ correct: false, xp: 0 });
    }
  }

  function advance() {
    const outOfHearts = hearts <= 0;
    const isLast = index >= exercises.length - 1;

    if (outOfHearts || isLast) {
      onFinish(
        {
          unitId: unit.unitId,
          unitTitle: unit.unitTitle,
          xpEarned,
          correct: correctCount,
          total: exercises.length,
          bestCombo,
          streak,
          streakAdvanced,
          newBadge,
          outOfHearts,
        },
        latest,
      );
      return;
    }

    setIndex((i) => i + 1);
    setSubmitted(false);
    setFeedback(null);
  }

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col px-4 py-4">
      {/* Header: quit, progress bar, hearts */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={onQuit}
          aria-label="Quit lesson"
          className="text-2xl leading-none text-slate-500 hover:text-slate-300"
        >
          ✕
        </button>
        <div
          className="h-3 flex-1 overflow-hidden rounded-full bg-slate-800"
          role="progressbar"
          aria-valuenow={progressPct}
        >
          <div
            className="h-full rounded-full bg-glide-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <HeartsBar hearts={hearts} maxHearts={progress.maxHearts} />
      </div>

      <div className="mb-3 flex min-h-[2rem] items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-slate-500">
          {unit.unitTitle} · {index + 1}/{exercises.length}
        </span>
        <ComboMeter combo={combo} />
      </div>

      {/* Prompt + interaction */}
      <div className="flex-1">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">
          {exercise.prompt}
        </h2>
        <ExerciseBody
          exercise={exercise}
          submitted={submitted}
          onCheck={handleCheck}
        />
      </div>

      {/* Feedback footer */}
      {submitted && feedback && (
        <div
          className={`animate-pop-in mt-4 rounded-2xl p-4 ${
            feedback.correct
              ? 'bg-emerald-500/15 text-emerald-100'
              : 'bg-rose-500/15 text-rose-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">
                {feedback.correct ? 'Correct!' : 'Not quite.'}
              </p>
              {feedback.correct && feedback.xp > 0 && (
                <p className="text-sm opacity-90">+{feedback.xp} XP</p>
              )}
              {!feedback.correct && (
                <p className="text-sm opacity-90">
                  {hearts > 0
                    ? `${hearts} ${hearts === 1 ? 'heart' : 'hearts'} left`
                    : 'Out of hearts — session will pause.'}
                </p>
              )}
            </div>
            {newBadge && feedback.correct && (
              <span className="rounded-full bg-yellow-400/20 px-3 py-1 text-xs font-bold text-yellow-200">
                🏅 {badgeLabel(newBadge)}
              </span>
            )}
          </div>
          <button
            onClick={advance}
            className="mt-3 w-full rounded-xl bg-slate-100 py-3 font-bold text-slate-900 transition hover:bg-white"
          >
            {hearts <= 0 || index >= exercises.length - 1
              ? 'See results'
              : 'Continue'}
          </button>
        </div>
      )}
    </div>
  );
}

/** Dispatch to the right exercise component for this exercise's type. */
function ExerciseBody({
  exercise,
  submitted,
  onCheck,
}: {
  exercise: Exercise;
  submitted: boolean;
  onCheck: (correct: boolean) => void;
}) {
  switch (exercise.type) {
    case 'assembly':
      return (
        <ExerciseAssembly
          exercise={exercise}
          submitted={submitted}
          onCheck={onCheck}
        />
      );
    case 'fill-blank':
      return (
        <ExerciseFillBlank
          exercise={exercise}
          submitted={submitted}
          onCheck={onCheck}
        />
      );
    case 'multiple-choice':
      return (
        <ExerciseMultipleChoice
          exercise={exercise}
          submitted={submitted}
          onCheck={onCheck}
        />
      );
  }
}
