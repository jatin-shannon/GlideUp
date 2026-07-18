import { useState } from 'react';
import type { FillBlankExercise } from '../types';

interface Props {
  exercise: FillBlankExercise;
  submitted: boolean;
  onCheck: (correct: boolean) => void;
}

const BLANK = '___';

/**
 * Fill-in-the-blank: the code context is split at `___` and an inline text
 * input takes its place. Matched case-insensitively against `answer`.
 */
export default function ExerciseFillBlank({
  exercise,
  submitted,
  onCheck,
}: Props) {
  const [value, setValue] = useState('');
  const [before, after] = exercise.codeContext.split(BLANK);

  const isCorrect =
    value.trim().toLowerCase() === exercise.answer.trim().toLowerCase();

  function submit() {
    if (!value.trim()) return;
    onCheck(isCorrect);
  }

  return (
    <div className="space-y-4">
      <pre className="overflow-x-auto rounded-lg bg-slate-950/70 p-4 font-mono text-sm text-slate-100 ring-1 ring-slate-800">
        <code>
          {before}
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !submitted) submit();
            }}
            disabled={submitted}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Your answer"
            className={`mx-1 inline-block w-28 rounded border-b-2 bg-slate-800 px-2 py-0.5 text-center font-mono text-glide-200 outline-none ${
              submitted
                ? isCorrect
                  ? 'border-emerald-500'
                  : 'border-rose-500'
                : 'border-glide-500 focus:border-glide-300'
            }`}
          />
          {after}
        </code>
      </pre>

      {submitted && !isCorrect && (
        <p className="text-sm text-slate-300">
          Answer:{' '}
          <span className="font-mono text-emerald-300">{exercise.answer}</span>
        </p>
      )}

      {!submitted && (
        <button
          onClick={submit}
          disabled={!value.trim()}
          className="w-full rounded-xl bg-glide-500 py-3 font-bold text-slate-950 transition enabled:hover:bg-glide-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Check
        </button>
      )}
    </div>
  );
}
