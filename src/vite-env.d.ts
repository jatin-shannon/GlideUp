/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** Supabase project URL. Absent → cloud sync disabled. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase publishable/anon key (safe to ship; protected by RLS). */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
