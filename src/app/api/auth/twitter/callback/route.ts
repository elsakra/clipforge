// @ts-nocheck
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/auth';
import { exchangeTwitterCode, getTwitterUser } from '@/lib/social/twitter';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth error
    if (error) {
      console.error('Twitter OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=twitter_auth_failed`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=missing_code`
      );
    }

    // Get the code verifier from the cookie
    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get('twitter_code_verifier')?.value;
    const storedState = cookieStore.get('twitter_oauth_state')?.value;

    if (!codeVerifier || !storedState || storedState !== state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=invalid_state`
      );
    }

    // Get the current user
    const user = await getUser();
    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/sign-in?redirect=/dashboard/settings`
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeTwitterCode(code, codeVerifier);

    // Get Twitter user info
    const twitterUser = await getTwitterUser(tokens.accessToken);

    const supabase = createAdminClient();

    // Check if this Twitter account is already connected to another user
    const { data: existingAccount } = await supabase
      .from('social_accounts')
      .select('user_id')
      .eq('platform', 'twitter')
      .eq('platform_user_id', twitterUser.id)
      .single();

    if (existingAccount && existingAccount.user_id !== user.id) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=account_already_connected`
      );
    }

    // Upsert social account
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000).toISOString();
    
    const { error: upsertError } = await supabase
      .from('social_accounts')
      .upsert(
        {
          user_id: user.id,
          platform: 'twitter',
          platform_user_id: twitterUser.id,
          platform_username: twitterUser.username,
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          token_expires_at: expiresAt,
          is_active: true,
        },
        {
          onConflict: 'user_id,platform',
        }
      );

    if (upsertError) {
      console.error('Error saving Twitter account:', upsertError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=save_failed`
      );
    }

    // Clear OAuth cookies
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=twitter_connected`
    );
    
    response.cookies.delete('twitter_code_verifier');
    response.cookies.delete('twitter_oauth_state');

    return response;
  } catch (error) {
    console.error('Twitter OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=callback_failed`
    );
  }
}

