import { useEffect, useState } from 'react';
import type { ProgressRecord } from '../types';
import { syncEnabled } from '../lib/supabase';
import {
  getUser,
  onAuthChange,
  signInWithMagicLink,
  signOut,
  syncNow,
  type AuthUser,
} from '../lib/sync';

interface Props {
  onSynced: (p: ProgressRecord) => void;
}

/**
 * Account + cross-device sync panel. Renders nothing when sync isn't
 * configured, so the offline MVP is unaffected.
 */
export default function AccountSync({ onSynced }: Props) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!syncEnabled) return;
    getUser().then(setUser);
    return onAuthChange(setUser);
  }, []);

  if (!syncEnabled) return null;

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await signInWithMagicLink(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send link.');
    } finally {
      setBusy(false);
    }
  }

  async function doSync() {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const res = await syncNow();
      if (res.status === 'ok' && res.progress) {
        onSynced(res.progress);
        setStatus(`Synced at ${new Date().toLocaleTimeString()}`);
      } else if (res.status === 'signed-out') {
        setStatus('Sign in to sync.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Cloud sync
      </h2>
      <div className="rounded-2xl bg-slate-900/50 p-4 ring-1 ring-slate-800">
        {user ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-300">
              Signed in as{' '}
              <span className="font-semibold text-slate-100">
                {user.email ?? 'your account'}
              </span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={doSync}
                disabled={busy}
                className="flex-1 rounded-xl bg-glide-500 py-2.5 text-sm font-bold text-slate-950 transition enabled:hover:bg-glide-400 disabled:opacity-50"
              >
                {busy ? 'Syncing…' : 'Sync now'}
              </button>
              <button
                onClick={() => signOut()}
                disabled={busy}
                className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 transition enabled:hover:bg-slate-700 disabled:opacity-50"
              >
                Sign out
              </button>
            </div>
            {status && <p className="text-xs text-emerald-300">{status}</p>}
          </div>
        ) : sent ? (
          <p className="text-sm text-slate-300">
            📬 Check <span className="font-semibold">{email}</span> for a magic
            link to finish signing in. Progress syncs automatically once you're
            back.
          </p>
        ) : (
          <form onSubmit={sendLink} className="space-y-3">
            <p className="text-sm text-slate-400">
              Sign in to back up and sync your progress across devices.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoCorrect="off"
                className="flex-1 rounded-xl bg-slate-800 px-3 py-2.5 text-sm text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-glide-500"
              />
              <button
                type="submit"
                disabled={busy || !email.trim()}
                className="rounded-xl bg-glide-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition enabled:hover:bg-glide-400 disabled:opacity-50"
              >
                {busy ? '…' : 'Send link'}
              </button>
            </div>
          </form>
        )}
        {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
      </div>
    </section>
  );
}
