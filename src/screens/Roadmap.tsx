import type { ProgressRecord } from '../types';
import { getUnit } from '../content';
import {
  ROADMAP,
  TIER_COLOR,
  TIER_LABEL,
  isNodeLive,
  type RoadmapNode,
} from '../content/roadmap';

interface RoadmapProps {
  progress: ProgressRecord;
  onBack: () => void;
}

function statusOf(
  node: RoadmapNode,
  progress: ProgressRecord,
): { label: string; done: boolean; live: boolean } {
  if (node.kind === 'checkpoint') return { label: 'Checkpoint', done: false, live: false };
  if (!isNodeLive(node)) return { label: 'Planned', done: false, live: false };
  const unit = getUnit(node.id)!;
  const total = unit.exercises.length;
  const completed = Math.min(progress.unitProgress[node.id]?.completed ?? 0, total);
  if (completed >= total) return { label: 'Complete', done: true, live: true };
  return { label: `${completed}/${total} done`, done: false, live: true };
}

export default function Roadmap({ progress, onBack }: RoadmapProps) {
  const liveCount = ROADMAP.filter(isNodeLive).length;

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <header className="mb-5 flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="Back to home"
          className="text-2xl leading-none text-slate-400 hover:text-slate-200"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-slate-100">Roadmap</h1>
      </header>

      <p className="mb-6 text-sm text-slate-400">
        The path from ServiceNow fundamentals to certified-developer depth.
        <span className="text-slate-300"> {liveCount} of {ROADMAP.length}</span>{' '}
        units are live; every fifth stop is a cumulative review.
      </p>

      <ol className="space-y-3">
        {ROADMAP.map((node) => {
          const color = TIER_COLOR[node.tier];
          const st = statusOf(node, progress);
          const checkpoint = node.kind === 'checkpoint';

          return (
            <li
              key={node.id}
              className="flex gap-3 rounded-2xl border p-4"
              style={{
                borderColor: st.live
                  ? `color-mix(in srgb, ${color} 40%, transparent)`
                  : 'rgba(148,163,184,0.14)',
                background: checkpoint
                  ? 'rgba(251,191,36,0.06)'
                  : 'rgba(15,23,42,0.5)',
              }}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center text-lg font-black ${
                  checkpoint ? 'rounded-xl' : 'rounded-full'
                }`}
                style={{
                  color: st.live ? '#0b1220' : color,
                  background: st.live
                    ? color
                    : `color-mix(in srgb, ${color} 14%, transparent)`,
                }}
              >
                {checkpoint ? '🏆' : node.order}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-slate-100">{node.title}</h2>
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-[0.62rem] font-bold uppercase tracking-wide"
                    style={{
                      color,
                      background: `color-mix(in srgb, ${color} 15%, transparent)`,
                    }}
                    title={TIER_LABEL[node.tier]}
                  >
                    {node.tier}
                  </span>
                  <span
                    className={`ml-auto text-xs font-semibold ${
                      st.done
                        ? 'text-emerald-300'
                        : st.live
                          ? 'text-glide-300'
                          : 'text-slate-500'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">{node.focus}</p>
                {node.apis.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {node.apis.map((a) => (
                      <span
                        key={a}
                        className="rounded bg-slate-950 px-1.5 py-0.5 font-mono text-[0.68rem] text-slate-400 ring-1 ring-slate-800"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                )}
                {node.reviewOf && (
                  <p className="mt-2 text-xs text-yellow-200/80">
                    Reviews units {node.reviewOf[0]}–
                    {node.reviewOf[node.reviewOf.length - 1]}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
