import type { ProgressRecord } from '../types';
import { UNITS, badgeLabel } from '../content';
import { displayStreak } from '../lib/streak';
import { todayISO } from '../lib/dates';
import AccountSync from '../components/AccountSync';

interface ProfileProps {
  progress: ProgressRecord;
  onBack: () => void;
  onSynced: (p: ProgressRecord) => void;
}

const WEEKS = 13; // ~3 months of history

/** GitHub-contribution-style calendar of active days. */
function StreakCalendar({ activeDays }: { activeDays: string[] }) {
  const active = new Set(activeDays);
  const today = new Date();
  // Start on the Sunday WEEKS-1 weeks before this week.
  const start = new Date(today);
  start.setDate(start.getDate() - today.getDay() - (WEEKS - 1) * 7);

  const columns: { iso: string; isActive: boolean; isFuture: boolean }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const col: { iso: string; isActive: boolean; isFuture: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const cell = new Date(start);
      cell.setDate(start.getDate() + w * 7 + d);
      const y = cell.getFullYear();
      const m = String(cell.getMonth() + 1).padStart(2, '0');
      const dd = String(cell.getDate()).padStart(2, '0');
      const iso = `${y}-${m}-${dd}`;
      col.push({
        iso,
        isActive: active.has(iso),
        isFuture: cell > today,
      });
    }
    columns.push(col);
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {columns.map((col, i) => (
          <div key={i} className="flex flex-col gap-1">
            {col.map((cell) => (
              <div
                key={cell.iso}
                title={cell.iso}
                className={`h-3 w-3 rounded-sm ${
                  cell.isFuture
                    ? 'bg-transparent'
                    : cell.isActive
                      ? 'bg-glide-400'
                      : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Profile({ progress, onBack, onSynced }: ProfileProps) {
  const today = todayISO();
  const streak = displayStreak(progress.streak, progress.lastActiveDate, today);

  // Every possible unit badge, shown earned or locked.
  const allBadges = UNITS.map((u) => ({
    id: `${u.certTier.toLowerCase()}-${u.unitId}`,
    label: `${u.certTier}: ${u.unitTitle}`,
  }));

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <header className="mb-6 flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="Back to home"
          className="text-2xl leading-none text-slate-400 hover:text-slate-200"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-slate-100">Profile</h1>
      </header>

      {/* Headline stats */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-slate-800/60 p-4 text-center ring-1 ring-slate-700">
          <p className="text-2xl font-black text-glide-300">{progress.xp}</p>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Total XP
          </p>
        </div>
        <div className="rounded-2xl bg-slate-800/60 p-4 text-center ring-1 ring-slate-700">
          <p className="text-2xl font-black text-orange-300">🔥 {streak}</p>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Day streak
          </p>
        </div>
        <div className="rounded-2xl bg-slate-800/60 p-4 text-center ring-1 ring-slate-700">
          <p className="text-2xl font-black text-yellow-300">
            {progress.badges.length}
          </p>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Badges
          </p>
        </div>
      </div>

      {/* Cloud sync (renders only when configured) */}
      <AccountSync onSynced={onSynced} />

      {/* Calendar */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Activity
        </h2>
        <div className="rounded-2xl bg-slate-900/50 p-4 ring-1 ring-slate-800">
          <StreakCalendar activeDays={progress.activeDays} />
          <p className="mt-3 text-xs text-slate-500">
            {progress.activeDays.length} active{' '}
            {progress.activeDays.length === 1 ? 'day' : 'days'} in the last{' '}
            {WEEKS} weeks
          </p>
        </div>
      </section>

      {/* Badges */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Badges
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {allBadges.map((b) => {
            const earned = progress.badges.includes(b.id);
            return (
              <div
                key={b.id}
                className={`flex items-center gap-3 rounded-2xl p-4 ring-1 ${
                  earned
                    ? 'bg-yellow-400/10 ring-yellow-400/40'
                    : 'bg-slate-900/40 ring-slate-800'
                }`}
              >
                <span className={`text-3xl ${earned ? '' : 'grayscale opacity-40'}`}>
                  🏅
                </span>
                <span
                  className={`text-sm font-semibold ${
                    earned ? 'text-yellow-100' : 'text-slate-500'
                  }`}
                >
                  {earned ? badgeLabel(b.id) : b.label}
                  {!earned && (
                    <span className="block text-xs font-normal text-slate-600">
                      Locked
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
