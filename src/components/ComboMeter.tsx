import { comboMultiplier } from '../lib/xp';

interface ComboMeterProps {
  /** Current consecutive-correct count in this session. */
  combo: number;
}

/** Shows the active combo multiplier once the learner is on a streak. */
export default function ComboMeter({ combo }: ComboMeterProps) {
  const mult = comboMultiplier(combo);
  if (mult <= 1) return null;

  return (
    <div className="animate-pop-in flex items-center gap-1 rounded-full bg-glide-500/20 px-3 py-1 text-sm font-bold text-glide-300">
      <span aria-hidden="true">⚡</span>
      <span>
        {combo} combo · {mult}× XP
      </span>
    </div>
  );
}
