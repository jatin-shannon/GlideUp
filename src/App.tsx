import { useEffect, useState } from 'react';
import type { ProgressRecord } from './types';
import { loadProgress } from './lib/db';
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

  if (!progress) {
    return (
      <div className="flex min-h-full items-center justify-center text-slate-500">
        <span className="animate-pulse">Loading GlideUp…</span>
      </div>
    );
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
        <Profile progress={progress} onBack={() => setView({ name: 'home' })} />
      );
  }
}
