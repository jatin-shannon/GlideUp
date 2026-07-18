import { useMemo, useState } from 'react';
import type { AssemblyExercise } from '../types';

interface Props {
  exercise: AssemblyExercise;
  submitted: boolean;
  onCheck: (correct: boolean) => void;
}

/** Deterministic-ish shuffle that guarantees a different order from source. */
function shuffleIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Avoid the (rare) already-sorted shuffle so there's always something to do.
  if (arr.every((v, i) => v === i) && n > 1) {
    [arr[0], arr[1]] = [arr[1], arr[0]];
  }
  return arr;
}

/**
 * Code assembly: tap lines from the shuffled bank to build the sequence,
 * tap a placed line to send it back. Correct when the built order matches
 * `correctOrder`.
 */
export default function ExerciseAssembly({
  exercise,
  submitted,
  onCheck,
}: Props) {
  const bankOrder = useMemo(
    () => shuffleIndices(exercise.blocks.length),
    [exercise.blocks.length],
  );
  // The sequence the learner has built, as indices into `blocks`.
  const [built, setBuilt] = useState<number[]>([]);

  const remaining = bankOrder.filter((i) => !built.includes(i));
  const isCorrect =
    built.length === exercise.correctOrder.length &&
    built.every((v, i) => v === exercise.correctOrder[i]);

  function place(idx: number) {
    if (submitted) return;
    setBuilt((b) => [...b, idx]);
  }
  function remove(idx: number) {
    if (submitted) return;
    setBuilt((b) => b.filter((v) => v !== idx));
  }

  return (
    <div className="space-y-4">
      {/* Built sequence */}
      <div
        className={`min-h-[3rem] space-y-2 rounded-lg border-2 border-dashed p-3 ${
          submitted
            ? isCorrect
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-rose-500/50 bg-rose-500/5'
            : 'border-slate-700 bg-slate-900/40'
        }`}
      >
        {built.length === 0 && (
          <p className="py-2 text-center text-sm text-slate-500">
            Tap the lines below in order…
          </p>
        )}
        {built.map((idx, pos) => (
          <button
            key={`${idx}-${pos}`}
            data-testid="built-block"
            onClick={() => remove(idx)}
            disabled={submitted}
            className="block w-full rounded-md bg-slate-800 px-3 py-2 text-left font-mono text-sm text-slate-100 ring-1 ring-slate-700 transition enabled:hover:ring-glide-500"
          >
            {exercise.blocks[idx]}
          </button>
        ))}
      </div>

      {/* Bank */}
      <div className="space-y-2">
        {remaining.map((idx) => (
          <button
            key={idx}
            data-testid="bank-block"
            onClick={() => place(idx)}
            disabled={submitted}
            className="block w-full rounded-md bg-slate-800/60 px-3 py-2 text-left font-mono text-sm text-slate-200 ring-1 ring-slate-700 transition enabled:hover:bg-slate-700 enabled:hover:ring-glide-500"
          >
            {exercise.blocks[idx]}
          </button>
        ))}
      </div>

      {!submitted && (
        <button
          onClick={() => onCheck(isCorrect)}
          disabled={built.length !== exercise.blocks.length}
          className="w-full rounded-xl bg-glide-500 py-3 font-bold text-slate-950 transition enabled:hover:bg-glide-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Check
        </button>
      )}
    </div>
  );
}
