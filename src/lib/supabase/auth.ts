import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

/**
 * Get the current authenticated user from Supabase
 * Returns null if not authenticated
 */
export async function getUser() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Cookie errors in Server Components
          }
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get the current user's database record
 * Creates the user record if it doesn't exist
 */
export async function getUserRecord() {
  const user = await getUser();
  
  if (!user) {
    return null;
  }

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  // Try to get existing user
  let { data: dbUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // Create user if doesn't exist
  if (!dbUser) {
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email || '',
        plan: 'free',
        usage_limit: 3,
        usage_this_month: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }
    dbUser = newUser;
  }

  return dbUser;
}

