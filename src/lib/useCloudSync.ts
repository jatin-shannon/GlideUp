import { useEffect, useRef } from 'react';
import type { ProgressRecord } from '../types';
import { syncEnabled } from './supabase';
import { onAuthChange, pushLocal, syncNow } from './sync';

/**
 * Sync-on-reconnect lifecycle (build-spec §10): full reconcile when the app
 * comes to the foreground or the network returns, and a cheap push when it
 * loses focus. iOS has no reliable Background Sync, so there is no silent
 * background path by design.
 *
 * `onSynced` fires with the merged record whenever a reconcile updates local
 * state, so the caller can refresh the UI. No-ops entirely when sync is off.
 */
export function useCloudSync(onSynced: (p: ProgressRecord) => void): void {
  // Keep the latest callback without re-registering listeners.
  const cb = useRef(onSynced);
  cb.current = onSynced;

  useEffect(() => {
    if (!syncEnabled) return;

    let cancelled = false;
    const reconcile = async () => {
      try {
        const res = await syncNow();
        if (!cancelled && res.status === 'ok' && res.progress) {
          cb.current(res.progress);
        }
      } catch {
        // Offline or transient — local stays authoritative; try again later.
      }
    };

    // Reconcile on sign-in/out and on first mount (if already signed in).
    const unsub = onAuthChange(() => void reconcile());
    void reconcile();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void reconcile();
      else void pushLocal().catch(() => {});
    };
    const onOnline = () => void reconcile();

    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      unsub();
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}
