import type { ProgressRecord } from '../types';
import { UNITS } from '../content';
import { displayStreak } from '../lib/streak';
import { todayISO } from '../lib/dates';
import StreakBadge from '../components/StreakBadge';
import HeartsBar from '../components/HeartsBar';

interface HomeProps {
  progress: ProgressRecord;
  onStartUnit: (unitId: string) => void;
  onOpenProfile: () => void;
}

/** Circular progress ring showing completed/total for a unit. */
function ProgressRing({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : completed / total;
  const size = 56;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-slate-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        strokeLinecap="round"
        className="text-glide-400 transition-all duration-500"
      />
    </svg>
  );
}

export default function Home({
  progress,
  onStartUnit,
  onOpenProfile,
}: HomeProps) {
  const today = todayISO();
  const streak = displayStreak(progress.streak, progress.lastActiveDate, today);

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      {/* Top bar */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-50">
            Glide<span className="text-glide-400">Up</span>
          </h1>
          <p className="text-sm text-slate-400">
            {progress.xp} XP earned
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StreakBadge streak={streak} />
          <HeartsBar hearts={progress.hearts} maxHearts={progress.maxHearts} />
          <button
            onClick={onOpenProfile}
            aria-label="Open profile"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-lg hover:bg-slate-700"
          >
            👤
          </button>
        </div>
      </header>

      {/* Unit map */}
      <div className="space-y-4">
        {UNITS.map((unit, i) => {
          const up = progress.unitProgress[unit.unitId] ?? {
            completed: 0,
            total: unit.exercises.length,
          };
          const prevUnit = UNITS[i - 1];
          const prevDone = prevUnit
            ? (progress.unitProgress[prevUnit.unitId]?.completed ?? 0) >=
              prevUnit.exercises.length
            : true;
          const locked = i > 0 && !prevDone;
          const done = up.completed >= unit.exercises.length;

          return (
            <div key={unit.unitId}>
              {i > 0 && (
                <div className="mx-auto my-1 h-4 w-0.5 bg-slate-700" />
              )}
              <button
                onClick={() => !locked && onStartUnit(unit.unitId)}
                disabled={locked}
                className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                  locked
                    ? 'cursor-not-allowed border-slate-800 bg-slate-900/40 opacity-60'
                    : 'border-slate-700 bg-slate-800/60 hover:border-glide-500 hover:bg-slate-800'
                }`}
              >
                <ProgressRing completed={up.completed} total={up.total} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-100">
                      {unit.unitTitle}
                    </h2>
                    {done && <span title="Unit complete">✅</span>}
                    {locked && <span title="Locked">🔒</span>}
                  </div>
                  <p className="text-sm text-slate-400">{unit.description}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {up.completed}/{up.total} exercises · {unit.certTier} tier
                  </p>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
