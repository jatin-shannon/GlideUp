interface StreakBadgeProps {
  streak: number;
}

/** Compact flame + day count. Dimmed at 0. */
export default function StreakBadge({ streak }: StreakBadgeProps) {
  return (
    <div
      className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${
        streak > 0
          ? 'bg-orange-500/15 text-orange-300'
          : 'bg-slate-800 text-slate-400'
      }`}
      aria-label={`${streak} day streak`}
    >
      <span aria-hidden="true">🔥</span>
      <span>{streak}</span>
    </div>
  );
}
