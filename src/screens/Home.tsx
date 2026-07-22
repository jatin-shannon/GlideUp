import { useEffect, useRef, useState } from 'react';
import type { ProgressRecord } from '../types';
import { getUnit } from '../content';
import {
  ROADMAP,
  TIER_COLOR,
  isNodeLive,
  type RoadmapNode,
} from '../content/roadmap';
import { displayStreak } from '../lib/streak';
import { todayISO } from '../lib/dates';
import StreakBadge from '../components/StreakBadge';
import HeartsBar from '../components/HeartsBar';

interface HomeProps {
  progress: ProgressRecord;
  onStartUnit: (unitId: string) => void;
  onOpenProfile: () => void;
  onOpenRoadmap: () => void;
}

interface ResolvedNode {
  node: RoadmapNode;
  live: boolean;
  unlocked: boolean;
  done: boolean;
  completed: number;
  total: number;
}

/** Resolve unlock/progress state for every roadmap node, in forward order. */
function resolve(progress: ProgressRecord): ResolvedNode[] {
  let prevDone = true; // the first unit is always unlocked
  return ROADMAP.map((node) => {
    const live = isNodeLive(node);
    const unit = live ? getUnit(node.id) : undefined;
    const total = unit ? unit.exercises.length : 0;
    const completed = unit
      ? Math.min(progress.unitProgress[node.id]?.completed ?? 0, total)
      : 0;
    const done = total > 0 && completed >= total;
    const unlocked = live && prevDone;
    if (node.kind === 'unit') prevDone = live ? done : false;
    return { node, live, unlocked, done, completed, total };
  });
}

/** The node the learner should tackle next (first unlocked, incomplete unit). */
function currentId(resolved: ResolvedNode[]): string | null {
  const next = resolved.find((r) => r.unlocked && !r.done);
  if (next) return next.node.id;
  const lastUnlocked = [...resolved].reverse().find((r) => r.unlocked);
  return lastUnlocked?.node.id ?? null;
}

/** Serpentine horizontal offset so the path sways instead of running straight. */
function swayOffset(order: number): number {
  return Math.round(Math.sin(order * 0.9) * 62);
}

export default function Home({
  progress,
  onStartUnit,
  onOpenProfile,
  onOpenRoadmap,
}: HomeProps) {
  const today = todayISO();
  const streak = displayStreak(progress.streak, progress.lastActiveDate, today);

  const resolved = resolve(progress);
  const current = currentId(resolved);
  const [sheet, setSheet] = useState<ResolvedNode | null>(null);

  // Bottom-up: order 1 sits at the bottom, later units climb upward.
  const displayed = [...resolved].reverse();

  const currentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center' });
  }, []);

  function select(rn: ResolvedNode) {
    if (rn.live && rn.unlocked) onStartUnit(rn.node.id);
    else setSheet(rn);
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-slate-800 bg-slate-950/85 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-black tracking-tight text-slate-50">
            Glide<span className="text-glide-400">Up</span>
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <StreakBadge streak={streak} />
          <HeartsBar hearts={progress.hearts} maxHearts={progress.maxHearts} />
          <button
            onClick={onOpenRoadmap}
            aria-label="Open roadmap"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-base hover:bg-slate-700"
          >
            🗺️
          </button>
          <button
            onClick={onOpenProfile}
            aria-label="Open profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-base hover:bg-slate-700"
          >
            👤
          </button>
        </div>
      </header>

      {/* Winding path */}
      <div className="flex flex-1 flex-col items-center gap-7 px-4 pb-16 pt-10">
        <p className="mb-2 text-xs uppercase tracking-widest text-slate-500">
          Keep climbing ↑
        </p>
        {displayed.map((rn) => {
          const isCurrent = rn.node.id === current;
          return (
            <div
              key={rn.node.id}
              ref={isCurrent ? currentRef : undefined}
              className="flex flex-col items-center gap-2"
              style={{ transform: `translateX(${swayOffset(rn.node.order)}px)` }}
            >
              {isCurrent && <StartPill />}
              <PathNode rn={rn} isCurrent={isCurrent} onSelect={select} />
              <span
                className={`max-w-[8rem] text-center text-xs font-semibold ${
                  rn.unlocked ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {rn.node.title}
              </span>
            </div>
          );
        })}
        <p className="mt-2 text-xs uppercase tracking-widest text-slate-600">
          Start here ↓
        </p>
      </div>

      {sheet && <InfoSheet rn={sheet} onClose={() => setSheet(null)} />}
    </div>
  );
}

function StartPill() {
  return (
    <div className="animate-pop-in relative -mb-0.5 rounded-lg bg-glide-500 px-3 py-1 text-xs font-black tracking-wide text-slate-950 shadow-lg">
      START
      <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-glide-500" />
    </div>
  );
}

function nodeGlyph(rn: ResolvedNode): string {
  if (rn.node.kind === 'checkpoint') return '🏆';
  if (!rn.live || !rn.unlocked) return '🔒';
  if (rn.done) return '⭐';
  return String(rn.node.order);
}

function PathNode({
  rn,
  isCurrent,
  onSelect,
}: {
  rn: ResolvedNode;
  isCurrent: boolean;
  onSelect: (rn: ResolvedNode) => void;
}) {
  const color = TIER_COLOR[rn.node.tier];
  const active = rn.live && rn.unlocked;
  const checkpoint = rn.node.kind === 'checkpoint';

  // Progress ring geometry.
  const size = 84;
  const r = 38;
  const c = 2 * Math.PI * r;
  const pct = rn.total > 0 ? rn.completed / rn.total : 0;

  const face = active
    ? { background: color, color: '#0b1220', boxShadow: `0 6px 0 ${shade(color)}` }
    : checkpoint
      ? { background: '#1e2637', color: '#fbbf24', border: '2px solid rgba(251,191,36,0.5)' }
      : { background: '#1e293b', color: '#64748b', boxShadow: '0 5px 0 #0f172a' };

  return (
    <button
      onClick={() => onSelect(rn)}
      aria-label={`${rn.node.title}${active ? '' : ' (locked)'}`}
      className={`relative transition ${isCurrent ? 'animate-pop-in' : ''} hover:-translate-y-0.5`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth="6" />
        {active && rn.total > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
          />
        )}
      </svg>
      <span
        className={`absolute inset-[9px] flex items-center justify-center text-xl font-black ${
          checkpoint ? 'rounded-2xl' : 'rounded-full'
        }`}
        style={face}
      >
        {nodeGlyph(rn)}
      </span>
    </button>
  );
}

/** Slightly darker shade of a hex color, for the Duolingo-style bottom edge. */
function shade(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 255) - 60);
  const g = Math.max(0, ((n >> 8) & 255) - 60);
  const b = Math.max(0, (n & 255) - 60);
  return `rgb(${r},${g},${b})`;
}

/** Bottom sheet shown when tapping a locked or upcoming node. */
function InfoSheet({
  rn,
  onClose,
}: {
  rn: ResolvedNode;
  onClose: () => void;
}) {
  const color = TIER_COLOR[rn.node.tier];
  const reason =
    rn.node.kind === 'checkpoint'
      ? 'A cumulative review — unlocks once you reach it on the path.'
      : !rn.live
        ? 'Coming soon — this unit is on the roadmap.'
        : 'Finish the unit before this one to unlock it.';

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-pop-in w-full max-w-md rounded-t-3xl border-t border-slate-700 bg-slate-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-2">
          <span
            className="rounded-md px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-wide"
            style={{
              color,
              background: `color-mix(in srgb, ${color} 16%, transparent)`,
            }}
          >
            {rn.node.tier}
          </span>
          <span className="text-xs text-slate-500">Unit {rn.node.order} of {ROADMAP.length}</span>
        </div>
        <h2 className="mb-1 text-xl font-bold text-slate-50">{rn.node.title}</h2>
        <p className="mb-3 text-sm text-slate-400">{rn.node.focus}</p>
        {rn.node.apis.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {rn.node.apis.map((a) => (
              <span
                key={a}
                className="rounded-md bg-slate-950 px-2 py-0.5 font-mono text-xs text-slate-400 ring-1 ring-slate-800"
              >
                {a}
              </span>
            ))}
          </div>
        )}
        <p className="mb-5 flex items-center gap-2 text-sm text-slate-500">
          <span>🔒</span> {reason}
        </p>
        <button
          onClick={onClose}
          className="w-full rounded-xl bg-slate-800 py-3 font-bold text-slate-200 transition hover:bg-slate-700"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
