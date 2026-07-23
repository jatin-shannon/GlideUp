import { useEffect } from 'react';
import type { ProgressRecord } from '../types';
import { onAuthChange } from '../lib/sync';
import AccountSync from './AccountSync';

interface Props {
  onSynced: (p: ProgressRecord) => void;
  onDismiss: () => void;
}

/**
 * Load-time prompt to sign in and back up progress. Reuses the account panel
 * so every method (Google, email/password, magic link) is available, and
 * offers "Skip for now" so signing in is never required. Closes itself the
 * moment the user signs in.
 */
export default function SignInGate({ onSynced, onDismiss }: Props) {
  useEffect(() => {
    return onAuthChange((user) => {
      if (user) onDismiss();
    });
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="animate-pop-in w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-glide-500/15 text-3xl">
            🚀
          </div>
          <h2 className="text-xl font-black text-slate-50">
            Save your progress
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Sign in to back up your XP, streak, and badges across devices — or
            keep playing right here on this device.
          </p>
        </div>

        <AccountSync onSynced={onSynced} />

        <button
          onClick={onDismiss}
          className="mt-1 w-full rounded-xl py-2.5 text-sm font-semibold text-slate-400 transition hover:text-slate-200"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
