import type { ProgressRecord } from '../types';
import { supabase, syncEnabled } from './supabase';
import { loadProgress, saveProgress, unitProgressFor } from './db';

/**
 * Cross-device sync (build-spec §10). IndexedDB stays the source of truth;
 * this layer pulls the remote row, merges it with local using a
 * never-lose-progress strategy, and writes the result back to both.
 *
 * Everything here no-ops when sync is not configured or no user is signed in,
 * so the app keeps working exactly like the local-first MVP.
 */

const TABLE = 'progress';

type ProgressRow = {
  user_id: string;
  xp: number;
  streak: number;
  last_active_date: string | null;
  hearts: number;
  max_hearts: number;
  hearts_date: string | null;
  completed_exercises: string[];
  unit_progress: Record<string, { completed: number; total: number }>;
  badges: string[];
  active_days: string[];
  updated_at?: string;
};

function rowToRecord(row: ProgressRow): ProgressRecord {
  return {
    id: 'progress',
    xp: row.xp,
    streak: row.streak,
    lastActiveDate: row.last_active_date,
    hearts: row.hearts,
    maxHearts: row.max_hearts,
    heartsDate: row.hearts_date,
    completedExercises: row.completed_exercises ?? [],
    unitProgress: row.unit_progress ?? {},
    badges: row.badges ?? [],
    activeDays: row.active_days ?? [],
  };
}

function recordToRow(userId: string, r: ProgressRecord): ProgressRow {
  return {
    user_id: userId,
    xp: r.xp,
    streak: r.streak,
    last_active_date: r.lastActiveDate,
    hearts: r.hearts,
    max_hearts: r.maxHearts,
    hearts_date: r.heartsDate,
    completed_exercises: r.completedExercises,
    unit_progress: r.unitProgress,
    badges: r.badges,
    active_days: r.activeDays,
  };
}

function union(a: string[], b: string[]): string[] {
  return Array.from(new Set([...a, ...b]));
}

/** 'local' | 'remote' | 'tie', by whichever has the more recent activity. */
function moreRecent(
  local: ProgressRecord,
  remote: ProgressRecord,
): 'local' | 'remote' | 'tie' {
  const l = local.lastActiveDate;
  const r = remote.lastActiveDate;
  if (l && r) {
    if (l > r) return 'local';
    if (r > l) return 'remote';
    return 'tie';
  }
  if (l && !r) return 'local';
  if (!l && r) return 'remote';
  return 'tie';
}

/**
 * Merge two progress records without ever losing progress (§10):
 * - xp: max
 * - completedExercises / badges / activeDays: union
 * - streak / hearts / heartsDate / maxHearts: from the record with the more
 *   recent lastActiveDate (on a tie, the safe extreme of each)
 * - unitProgress: recomputed from the merged completed set
 */
export function mergeRecords(
  local: ProgressRecord,
  remote: ProgressRecord,
): ProgressRecord {
  const completedExercises = union(
    local.completedExercises,
    remote.completedExercises,
  );
  const recent = moreRecent(local, remote);

  let streak: number;
  let hearts: number;
  let heartsDate: string | null;
  let maxHearts: number;

  if (recent === 'local') {
    ({ streak, hearts, heartsDate, maxHearts } = pickDaily(local));
  } else if (recent === 'remote') {
    ({ streak, hearts, heartsDate, maxHearts } = pickDaily(remote));
  } else {
    // Same (or no) activity date — keep the safe extreme of each.
    streak = Math.max(local.streak, remote.streak);
    hearts = Math.min(local.hearts, remote.hearts);
    maxHearts = Math.max(local.maxHearts, remote.maxHearts);
    heartsDate = local.heartsDate ?? remote.heartsDate;
  }

  const lastActiveDate =
    recent === 'remote' ? remote.lastActiveDate : local.lastActiveDate;

  return {
    id: 'progress',
    xp: Math.max(local.xp, remote.xp),
    streak,
    lastActiveDate,
    hearts,
    maxHearts,
    heartsDate,
    completedExercises,
    unitProgress: unitProgressFor(completedExercises),
    badges: union(local.badges, remote.badges),
    activeDays: union(local.activeDays, remote.activeDays).sort(),
  };
}

function pickDaily(r: ProgressRecord) {
  return {
    streak: r.streak,
    hearts: r.hearts,
    heartsDate: r.heartsDate,
    maxHearts: r.maxHearts,
  };
}

// ---- Auth ---------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string | null;
}

export async function getUser(): Promise<AuthUser | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

/** Send a passwordless magic-link email. */
export async function signInWithMagicLink(email: string): Promise<void> {
  if (!supabase) throw new Error('Sync is not configured.');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
}

/** Start Google OAuth sign-in. Redirects to Google, then back to the app. */
export async function signInWithGoogle(): Promise<void> {
  if (!supabase) throw new Error('Sync is not configured.');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

/** Sign in with an existing email + password. */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<void> {
  if (!supabase) throw new Error('Sync is not configured.');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/**
 * Create an account with email + password. If the project requires email
 * confirmation (Supabase default), no session is returned until the user
 * clicks the confirmation link — `needsConfirmation` says which case it is.
 */
export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<{ needsConfirmation: boolean }> {
  if (!supabase) throw new Error('Sync is not configured.');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
  return { needsConfirmation: !data.session };
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/** Email a password-reset link. Clicking it returns to the app in recovery. */
export async function sendPasswordReset(email: string): Promise<void> {
  if (!supabase) throw new Error('Sync is not configured.');
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
}

/** Set a new password for the signed-in (or recovering) user. */
export async function updatePassword(password: string): Promise<void> {
  if (!supabase) throw new Error('Sync is not configured.');
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

/**
 * Fires when the user arrives via a password-reset link (Supabase emits a
 * PASSWORD_RECOVERY event once it processes the recovery token in the URL).
 * Returns an unsubscribe function.
 */
export function onPasswordRecovery(cb: () => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') cb();
  });
  return () => data.subscription.unsubscribe();
}

/** Subscribe to sign-in/out; returns an unsubscribe function. */
export function onAuthChange(cb: (user: AuthUser | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(
      session?.user
        ? { id: session.user.id, email: session.user.email ?? null }
        : null,
    );
  });
  return () => data.subscription.unsubscribe();
}

// ---- Pull / push / full sync -------------------------------------------

async function pullRemote(userId: string): Promise<ProgressRecord | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToRecord(data as ProgressRow) : null;
}

async function pushRemote(userId: string, record: ProgressRecord): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from(TABLE)
    .upsert(recordToRow(userId, record), { onConflict: 'user_id' });
  if (error) throw error;
}

export interface SyncResult {
  status: 'ok' | 'disabled' | 'signed-out';
  progress?: ProgressRecord;
}

/**
 * Full reconcile: pull remote, merge with local, then write the merged record
 * to both IndexedDB and Supabase. Returns the merged record so the UI can
 * refresh. Safe to call anytime — no-ops when disabled or signed out.
 */
export async function syncNow(): Promise<SyncResult> {
  if (!syncEnabled || !supabase) return { status: 'disabled' };
  const user = await getUser();
  if (!user) return { status: 'signed-out' };

  const local = await loadProgress();
  const remote = await pullRemote(user.id);
  const merged = remote ? mergeRecords(local, remote) : local;

  await saveProgress(merged);
  await pushRemote(user.id, merged);
  return { status: 'ok', progress: merged };
}

/**
 * Push-only: used when the app loses focus. Cheaper than a full reconcile and
 * avoids clobbering — the next foreground sync merges anyway.
 */
export async function pushLocal(): Promise<void> {
  if (!syncEnabled || !supabase) return;
  const user = await getUser();
  if (!user) return;
  const local = await loadProgress();
  await pushRemote(user.id, local);
}
