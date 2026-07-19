import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client, created only when both env vars are present. Sync is
 * strictly additive: with no config the whole cloud layer is a no-op and the
 * app behaves exactly like the local-first MVP.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const syncEnabled = Boolean(url && key);

export const supabase: SupabaseClient | null = syncEnabled
  ? createClient(url!, key!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
