import { useState } from 'react';
import type { Exercise, ProgressRecord, Unit } from '../types';
import {
  recordCorrectAnswer,
  recordReviewAnswer,
  recordWrongAnswer,
  markCheckpointComplete,
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
  /** True when this is a Checkpoint review (scores XP but not unit completion). */
  isReview?: boolean;
  onFinish: (summary: SessionSummary, updated: ProgressRecord) => void;
  onQuit: () => void;
}

interface Feedback {
  correct: boolean;
  xp: number;
}

/** Per-question state. A lesson finishes only when all are 'correct'. */
type Status = 'unseen' | 'skipped' | 'correct';

/**
 * Lesson runner. Plays a unit's exercises with immediate feedback, a combo
 * multiplier, and a daily hearts pool. Wrong answers offer Retry or Skip;
 * skipped questions must be returned to before the lesson can be completed.
 * Back/forward arrows navigate between questions. Ends early (soft fail) when
 * hearts hit 0.
 */
export default function Lesson({
  unit,
  progress,
  isReview = false,
  onFinish,
  onQuit,
}: LessonProps) {
  const exercises = unit.exercises;
  const [statuses, setStatuses] = useState<Status[]>(() =>
    exercises.map(() => 'unseen'),
  );
  const [pos, setPos] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  // Bumped on Retry to remount the exercise with a fresh input.
  const [attempt, setAttempt] = useState(0);

  // Live session state.
  const [hearts, setHearts] = useState(progress.hearts);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [streak, setStreak] = useState(progress.streak);
  const [streakAdvanced, setStreakAdvanced] = useState(false);
  const [newBadge, setNewBadge] = useState<string | null>(null);
  const [latest, setLatest] = useState<ProgressRecord>(progress);

  const exercise = exercises[pos];
  const status = statuses[pos];
  const correctCount = statuses.filter((s) => s === 'correct').length;
  const allCorrect = correctCount === exercises.length;
  const outOfHearts = hearts <= 0;
  const remaining = exercises.length - correctCount;
  const progressPct = Math.round((correctCount / exercises.length) * 100);
  const canNavigate = !feedback; // must resolve feedback before moving

  function setStatusAt(i: number, s: Status) {
    setStatuses((prev) => {
      const next = [...prev];
      next[i] = s;
      return next;
    });
  }

  /** First non-correct question after `from` (wrapping); `from` if none. */
  function nextUnresolved(from: number): number {
    const n = exercises.length;
    for (let step = 1; step <= n; step++) {
      const i = (from + step) % n;
      if (statuses[i] !== 'correct') return i;
    }
    return from;
  }

  function goTo(next: number) {
    setPos(next);
    setSubmitted(false);
    setFeedback(null);
  }

  async function handleCheck(isCorrect: boolean) {
    if (submitted) return;
    setSubmitted(true);

    if (isCorrect) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setBestCombo((b) => Math.max(b, nextCombo));

      // Reviews score XP + streak but never touch unit completion.
      const result = isReview
        ? await recordReviewAnswer(exercise, nextCombo)
        : await recordCorrectAnswer(
            exercise,
            unit.unitId,
            exercises.length,
            nextCombo,
          );
      setXpEarned((x) => x + result.xpGained);
      setStreak(result.progress.streak);
      if (result.streakAdvanced) setStreakAdvanced(true);
      setLatest(result.progress);
      setStatusAt(pos, 'correct');
      setFeedback({ correct: true, xp: result.xpGained });

      if (!isReview) {
        const badge = await maybeAwardUnitBadge(unit);
        if (badge) setNewBadge(badge);
      }
    } else {
      setCombo(0);
      const updated = await recordWrongAnswer();
      setHearts(updated.hearts);
      setLatest(updated);
      setFeedback({ correct: false, xp: 0 });
    }
  }

  function continueCorrect() {
    if (allCorrect) {
      setFeedback(null);
      setSubmitted(false);
      return; // finish button now shows
    }
    goTo(nextUnresolved(pos));
  }

  function retry() {
    setFeedback(null);
    setSubmitted(false);
    setAttempt((a) => a + 1);
  }

  function skip() {
    setStatusAt(pos, 'skipped');
    goTo(nextUnresolved(pos));
  }

  async function finish() {
    // Passing a Checkpoint (all correct) marks it complete.
    let finalProgress = latest;
    if (isReview && allCorrect) {
      finalProgress = await markCheckpointComplete(unit.unitId);
    }
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
      finalProgress,
    );
  }

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col px-4 py-4">
      {/* Header: quit · back · progress · forward · hearts */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={onQuit}
          aria-label="Quit lesson"
          className="text-2xl leading-none text-slate-500 hover:text-slate-300"
        >
          ✕
        </button>
        <NavArrow
          dir="back"
          disabled={pos === 0 || !canNavigate}
          onClick={() => goTo(pos - 1)}
        />
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
        <NavArrow
          dir="forward"
          disabled={pos === exercises.length - 1 || !canNavigate}
          onClick={() => goTo(pos + 1)}
        />
        <HeartsBar hearts={hearts} maxHearts={progress.maxHearts} />
      </div>

      <div className="mb-3 flex min-h-[2rem] items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-slate-500">
          {unit.unitTitle} · {pos + 1}/{exercises.length}
          {remaining > 0 && (
            <span className="text-slate-600"> · {remaining} to answer</span>
          )}
        </span>
        <ComboMeter combo={combo} />
      </div>

      {/* Prompt + interaction */}
      <div className="flex-1">
        <h2 className="mb-4 flex items-start gap-2 text-lg font-semibold text-slate-100">
          {status === 'skipped' && (
            <span
              title="Skipped — answer it to finish"
              className="mt-0.5 rounded bg-amber-400/15 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-300"
            >
              Skipped
            </span>
          )}
          <span>{exercise.prompt}</span>
        </h2>

        {status === 'correct' ? (
          <div className="animate-pop-in rounded-2xl bg-emerald-500/10 p-5 text-center ring-1 ring-emerald-500/30">
            <p className="text-2xl">✅</p>
            <p className="mt-1 font-semibold text-emerald-200">
              Answered correctly
            </p>
          </div>
        ) : (
          <ExerciseBody
            key={`${exercise.id}-${pos}-${attempt}`}
            exercise={exercise}
            submitted={submitted}
            onCheck={handleCheck}
          />
        )}
      </div>

      {/* Finish button — only when every question is correct, or out of hearts */}
      {!feedback && (allCorrect || outOfHearts) && (
        <button
          onClick={finish}
          className="mt-4 w-full rounded-xl bg-glide-500 py-3 font-bold text-slate-950 transition hover:bg-glide-400"
        >
          See results
        </button>
      )}

      {/* Feedback footer */}
      {feedback && (
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

          {feedback.correct ? (
            <button
              onClick={continueCorrect}
              className="mt-3 w-full rounded-xl bg-slate-100 py-3 font-bold text-slate-900 transition hover:bg-white"
            >
              {allCorrect ? 'See results' : 'Continue'}
            </button>
          ) : outOfHearts ? (
            <button
              onClick={finish}
              className="mt-3 w-full rounded-xl bg-slate-100 py-3 font-bold text-slate-900 transition hover:bg-white"
            >
              See results
            </button>
          ) : (
            <div className="mt-3 flex gap-2">
              <button
                onClick={retry}
                className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-900 transition hover:bg-white"
              >
                Retry
              </button>
              <button
                onClick={skip}
                className="flex-1 rounded-xl bg-slate-800 py-3 font-bold text-slate-200 ring-1 ring-slate-600 transition hover:bg-slate-700"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NavArrow({
  dir,
  disabled,
  onClick,
}: {
  dir: 'back' | 'forward';
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'back' ? 'Previous question' : 'Next question'}
      className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-slate-800 text-slate-300 transition enabled:hover:bg-slate-700 disabled:opacity-30"
    >
      {dir === 'back' ? '‹' : '›'}
    </button>
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
