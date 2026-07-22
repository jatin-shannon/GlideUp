import { useEffect, useState } from 'react';
import type { ProgressRecord } from '../types';
import { syncEnabled } from '../lib/supabase';
import {
  getUser,
  onAuthChange,
  onPasswordRecovery,
  signInWithGoogle,
  signInWithMagicLink,
  signInWithPassword,
  signUpWithPassword,
  sendPasswordReset,
  updatePassword,
  signOut,
  syncNow,
  type AuthUser,
} from '../lib/sync';

interface Props {
  onSynced: (p: ProgressRecord) => void;
}

type Mode = 'signin' | 'signup' | 'reset';

/**
 * Account + cross-device sync panel. Email/password is the primary flow, with
 * a passwordless magic-link fallback and a full password-reset path. Renders
 * nothing when sync isn't configured, so the offline MVP is unaffected.
 */
export default function AccountSync({ onSynced }: Props) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mode, setMode] = useState<Mode>('signin');
  const [recovering, setRecovering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!syncEnabled) return;
    getUser().then(setUser);
    const unsubAuth = onAuthChange((u) => {
      setUser(u);
      setNotice(null);
    });
    const unsubRecovery = onPasswordRecovery(() => setRecovering(true));
    return () => {
      unsubAuth();
      unsubRecovery();
    };
  }, []);

  if (!syncEnabled) return null;

  function reset() {
    setError(null);
    setNotice(null);
    setStatus(null);
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true);
    reset();
    try {
      if (mode === 'signin') {
        await signInWithPassword(email.trim(), password);
      } else {
        const { needsConfirmation } = await signUpWithPassword(
          email.trim(),
          password,
        );
        setPassword('');
        if (needsConfirmation) {
          setNotice(
            `Account created — check ${email.trim()} for a confirmation link, then sign in.`,
          );
          setMode('signin');
        }
      }
    } catch (err) {
      setError(readableAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    reset();
    try {
      await sendPasswordReset(email.trim());
      setNotice(`Password-reset link sent to ${email.trim()}.`);
      setMode('signin');
    } catch (err) {
      setError(readableAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function submitNewPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    reset();
    try {
      await updatePassword(newPassword);
      setNewPassword('');
      setRecovering(false);
      setNotice('Password updated — you are signed in.');
    } catch (err) {
      setError(readableAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    reset();
    try {
      await signInWithGoogle();
      // On success the browser redirects to Google; nothing else to do.
    } catch (err) {
      setError(readableAuthError(err));
      setBusy(false);
    }
  }

  async function sendMagicLink() {
    if (!email.trim()) {
      setError('Enter your email first.');
      return;
    }
    setBusy(true);
    reset();
    try {
      await signInWithMagicLink(email.trim());
      setNotice(`Magic link sent — check ${email.trim()} to finish signing in.`);
    } catch (err) {
      setError(readableAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function doSync() {
    setBusy(true);
    reset();
    try {
      const res = await syncNow();
      if (res.status === 'ok' && res.progress) {
        onSynced(res.progress);
        setStatus(`Synced at ${new Date().toLocaleTimeString()}`);
      }
    } catch (err) {
      setError(readableAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    'w-full rounded-xl bg-slate-800 px-3 py-2.5 text-sm text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-glide-500';
  const primaryBtn =
    'w-full rounded-xl bg-glide-500 py-2.5 text-sm font-bold text-slate-950 transition enabled:hover:bg-glide-400 disabled:opacity-50';

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Cloud sync
      </h2>
      <div className="rounded-2xl bg-slate-900/50 p-4 ring-1 ring-slate-800">
        {recovering ? (
          // Arrived via a password-reset link — set a new password.
          <form onSubmit={submitNewPassword} className="space-y-3">
            <p className="text-sm text-slate-300">Choose a new password.</p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              autoComplete="new-password"
              minLength={6}
              className={inputClass}
            />
            <button type="submit" disabled={busy} className={primaryBtn}>
              {busy ? '…' : 'Update password'}
            </button>
          </form>
        ) : user ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-300">
              Signed in as{' '}
              <span className="font-semibold text-slate-100">
                {user.email ?? 'your account'}
              </span>
            </p>
            <div className="flex gap-2">
              <button onClick={doSync} disabled={busy} className={primaryBtn}>
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
        ) : mode === 'reset' ? (
          <form onSubmit={submitReset} className="space-y-3">
            <p className="text-sm text-slate-400">
              Enter your email and we'll send a reset link.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              className={inputClass}
            />
            <button
              type="submit"
              disabled={busy || !email.trim()}
              className={primaryBtn}
            >
              {busy ? '…' : 'Send reset link'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                reset();
              }}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              ← Back to sign in
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">
              {mode === 'signin'
                ? 'Sign in to back up and sync your progress across devices.'
                : 'Create an account to sync your progress across devices.'}
            </p>

            <button
              onClick={google}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-white py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:opacity-50"
            >
              <GoogleMark />
              Continue with Google
            </button>

            <div className="flex items-center gap-3 py-0.5 text-xs text-slate-600">
              <span className="h-px flex-1 bg-slate-700" />
              or
              <span className="h-px flex-1 bg-slate-700" />
            </div>

            <form onSubmit={submitPassword} className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                className={inputClass}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                minLength={6}
                className={inputClass}
              />
              <button
                type="submit"
                disabled={busy || !email.trim() || !password}
                className={primaryBtn}
              >
                {busy
                  ? '…'
                  : mode === 'signin'
                    ? 'Sign in'
                    : 'Create account'}
              </button>
            </form>

            <div className="flex items-center justify-between text-xs">
              <button
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  reset();
                }}
                className="text-glide-300 hover:text-glide-200"
              >
                {mode === 'signin'
                  ? 'New here? Create an account'
                  : 'Have an account? Sign in'}
              </button>
              {mode === 'signin' && (
                <button
                  onClick={() => {
                    setMode('reset');
                    reset();
                  }}
                  className="text-slate-400 hover:text-slate-200"
                >
                  Forgot password?
                </button>
              )}
            </div>

            <button
              onClick={sendMagicLink}
              disabled={busy}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 disabled:opacity-50"
            >
              Or email me a sign-in link instead
            </button>
          </div>
        )}

        {notice && <p className="mt-2 text-xs text-glide-200">{notice}</p>}
        {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
      </div>
    </section>
  );
}

/** Google "G" logo mark. */
function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.3 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.1 5.4-4.6 7l7.2 5.6c4.2-3.9 6.6-9.6 6.6-16.9z"
      />
      <path
        fill="#FBBC05"
        d="M10.4 28.3c-.5-1.4-.7-2.9-.7-4.5s.3-3.1.7-4.5l-7.8-6.1C1 16.5 0 20.1 0 23.8s1 7.3 2.6 10.4l7.8-5.9z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.2 0 11.5-2 15.3-5.6l-7.2-5.6c-2 1.4-4.7 2.3-8.1 2.3-6.3 0-11.7-3.8-13.6-9.3l-7.8 5.9C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}

/** Map common Supabase auth errors to friendlier copy. */
function readableAuthError(err: unknown): string {
  const msg = err instanceof Error ? err.message : 'Something went wrong.';
  if (/invalid login credentials/i.test(msg)) {
    return 'Incorrect email or password.';
  }
  if (/provider is not enabled|not enabled|unsupported provider/i.test(msg)) {
    return "Google sign-in isn't enabled yet — try email instead.";
  }
  if (/email not confirmed/i.test(msg)) {
    return 'Please confirm your email first — check your inbox for the link.';
  }
  if (/user already registered/i.test(msg)) {
    return 'That email already has an account — try signing in.';
  }
  if (/password should be at least/i.test(msg)) {
    return 'Password must be at least 6 characters.';
  }
  return msg;
}
