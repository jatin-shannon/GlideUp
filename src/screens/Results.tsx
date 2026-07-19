import type { SessionSummary } from './Lesson';
import { badgeLabel } from '../content';

interface ResultsProps {
  summary: SessionSummary;
  onContinue: () => void;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-800/60 p-4 text-center ring-1 ring-slate-700">
      <p className="text-2xl font-black text-glide-300">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
        {label}
      </p>
    </div>
  );
}

/** End-of-session summary. */
export default function Results({ summary, onContinue }: ResultsProps) {
  const accuracy =
    summary.total === 0
      ? 0
      : Math.round((summary.correct / summary.total) * 100);

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col items-center px-4 py-10">
      <div className="animate-pop-in mb-2 text-6xl">
        {summary.outOfHearts ? '💔' : '🎉'}
      </div>
      <h1 className="mb-1 text-2xl font-black text-slate-50">
        {summary.outOfHearts ? 'Out of hearts' : 'Lesson complete!'}
      </h1>
      <p className="mb-8 text-slate-400">
        {summary.outOfHearts
          ? 'Your progress is saved. Come back tomorrow for a fresh set of hearts.'
          : `Nice work on ${summary.unitTitle}.`}
      </p>

      <div className="grid w-full grid-cols-3 gap-3">
        <Stat label="XP earned" value={`+${summary.xpEarned}`} />
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Best combo" value={`${summary.bestCombo}×`} />
      </div>

      {summary.streakAdvanced && (
        <div className="animate-pop-in mt-6 flex items-center gap-2 rounded-full bg-orange-500/15 px-4 py-2 font-bold text-orange-300">
          🔥 {summary.streak}-day streak!
        </div>
      )}

      {summary.newBadge && (
        <div className="animate-pop-in mt-4 flex items-center gap-2 rounded-2xl bg-yellow-400/15 px-5 py-3 font-bold text-yellow-200">
          🏅 Badge unlocked — {badgeLabel(summary.newBadge)}
        </div>
      )}

      <button
        onClick={onContinue}
        className="mt-10 w-full max-w-xs rounded-xl bg-glide-500 py-3 font-bold text-slate-950 transition hover:bg-glide-400"
      >
        Continue
      </button>
    </div>
  );
}
