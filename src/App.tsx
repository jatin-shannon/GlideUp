import { useEffect, useState } from 'react';
import type { ProgressRecord } from './types';
import { loadProgress } from './lib/db';
import { useCloudSync } from './lib/useCloudSync';
import { getUnit } from './content';
import Home from './screens/Home';
import Lesson, { type SessionSummary } from './screens/Lesson';
import Results from './screens/Results';
import Profile from './screens/Profile';

type View =
  | { name: 'home' }
  | { name: 'lesson'; unitId: string }
  | { name: 'results'; summary: SessionSummary }
  | { name: 'profile' };

export default function App() {
  const [progress, setProgress] = useState<ProgressRecord | null>(null);
  const [view, setView] = useState<View>({ name: 'home' });

  useEffect(() => {
    loadProgress().then(setProgress);
  }, []);

  // Cross-device sync: reconcile on foreground/online, push on blur. Merged
  // results refresh the in-memory record. No-ops when sync is not configured.
  useCloudSync(setProgress);

  if (!progress) {
    return <Splash />;
  }

  switch (view.name) {
    case 'home':
      return (
        <Home
          progress={progress}
          onStartUnit={(unitId) => setView({ name: 'lesson', unitId })}
          onOpenProfile={() => setView({ name: 'profile' })}
        />
      );

    case 'lesson': {
      const unit = getUnit(view.unitId);
      if (!unit) {
        setView({ name: 'home' });
        return null;
      }
      return (
        <Lesson
          unit={unit}
          progress={progress}
          onQuit={() => setView({ name: 'home' })}
          onFinish={(summary, updated) => {
            setProgress(updated);
            setView({ name: 'results', summary });
          }}
        />
      );
    }

    case 'results':
      return (
        <Results
          summary={view.summary}
          onContinue={() =>
            // Reload from the DB so Home reflects the latest persisted state.
            loadProgress().then((p) => {
              setProgress(p);
              setView({ name: 'home' });
            })
          }
        />
      );

    case 'profile':
      return (
        <Profile
          progress={progress}
          onBack={() => setView({ name: 'home' })}
          onSynced={setProgress}
        />
      );
  }
}

/** Branded launch screen shown while the first progress load resolves. */
function Splash() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-5 bg-slate-950">
      <svg
        viewBox="0 0 512 512"
        className="h-24 w-24 animate-pop-in"
        aria-hidden="true"
      >
        <path
          d="M256 96 L392 176 V336 L256 416 L120 336 V176 Z"
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="24"
          strokeLinejoin="round"
        />
        <path
          d="M300 200 L220 280 H272 L212 344"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="28"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="text-center">
        <p className="text-2xl font-black tracking-tight text-slate-50">
          Glide<span className="text-glide-400">Up</span>
        </p>
        <p className="mt-1 text-sm text-slate-500">
          <span className="animate-pulse">Loading…</span>
        </p>
      </div>
    </div>
  );
}
