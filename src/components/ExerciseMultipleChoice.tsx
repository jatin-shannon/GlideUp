import { useState } from 'react';
import type { MultipleChoiceExercise } from '../types';

interface Props {
  exercise: MultipleChoiceExercise;
  submitted: boolean;
  onCheck: (correct: boolean) => void;
}

/** Multiple choice: pick one option, then Check. */
export default function ExerciseMultipleChoice({
  exercise,
  submitted,
  onCheck,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  function optionClass(i: number): string {
    if (submitted) {
      if (i === exercise.correctIndex) {
        return 'border-emerald-500 bg-emerald-500/10 text-emerald-100';
      }
      if (i === selected) {
        return 'border-rose-500 bg-rose-500/10 text-rose-100';
      }
      return 'border-slate-700 text-slate-400';
    }
    return i === selected
      ? 'border-glide-500 bg-glide-500/10 text-slate-50'
      : 'border-slate-700 text-slate-200 hover:border-slate-500';
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {exercise.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => !submitted && setSelected(i)}
            disabled={submitted}
            className={`block w-full rounded-xl border-2 px-4 py-3 text-left font-mono text-sm transition ${optionClass(
              i,
            )}`}
          >
            {opt}
          </button>
        ))}
      </div>

      {!submitted && (
        <button
          onClick={() => onCheck(selected === exercise.correctIndex)}
          disabled={selected === null}
          className="w-full rounded-xl bg-glide-500 py-3 font-bold text-slate-950 transition enabled:hover:bg-glide-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Check
        </button>
      )}
    </div>
  );
}
