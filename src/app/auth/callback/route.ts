import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect') || '/dashboard';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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
              // Handle cookie errors
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Ensure user record exists in our users table
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if user exists in our table
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!existingUser) {
          // Create user record
          await supabase.from('users').insert({
            id: user.id,
            email: user.email,
            plan: 'free',
            usage_limit: 3,
            usage_this_month: 0,
          });
        }
      }

      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // Return to sign-in on error
  return NextResponse.redirect(`${origin}/sign-in?error=auth`);
}

