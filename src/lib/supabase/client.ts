import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Return a mock client during build if env vars are missing
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a placeholder that will fail gracefully at runtime
    return createBrowserClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-key'
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}


