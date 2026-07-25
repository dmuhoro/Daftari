import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const IS_E2E = import.meta.env.VITE_E2E === 'true' || window.location.search.includes('e2e=true') || !!(window as Window & { __E2E__?: boolean }).__E2E__;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({} as ReturnType<typeof createClient>, {
      get(_, prop) {
        if (IS_E2E) return () => Promise.resolve({ data: null, error: null });
        throw new Error(`supabase.${String(prop)} called but VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set`);
      },
    });
