import { createClient, SupabaseClient } from '@supabase/supabase-js';

function cleanEnv(raw?: string): string {
  if (!raw) return '';
  return raw.trim().replace(/^['"]|['"]$/g, '');
}

function isValidHttpUrl(value: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

const supabaseUrl = cleanEnv(import.meta.env.VITE_SUPABASE_URL as string | undefined);
const supabaseAnonKey = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

let client: SupabaseClient | null = null;
if (isValidHttpUrl(supabaseUrl) && Boolean(supabaseAnonKey)) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch {
    client = null;
  }
}

export const supabase: SupabaseClient | null = client;
export const isSupabaseConfigured = Boolean(client);
