// @ts-nocheck
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/auth';
import { exchangeLinkedInCode, getLinkedInUser } from '@/lib/social/linkedin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth error
    if (error) {
      console.error('LinkedIn OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=linkedin_auth_failed`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=missing_code`
      );
    }

    // Verify state
    const cookieStore = await cookies();
    const storedState = cookieStore.get('linkedin_oauth_state')?.value;

    if (!storedState || storedState !== state) {
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
    const tokens = await exchangeLinkedInCode(code);

    // Get LinkedIn user info
    const linkedInUser = await getLinkedInUser(tokens.accessToken);

    const supabase = createAdminClient();

    // Check if this LinkedIn account is already connected to another user
    const { data: existingAccount } = await supabase
      .from('social_accounts')
      .select('user_id')
      .eq('platform', 'linkedin')
      .eq('platform_user_id', linkedInUser.id)
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
          platform: 'linkedin',
          platform_user_id: linkedInUser.id,
          platform_username: `${linkedInUser.firstName} ${linkedInUser.lastName}`,
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken || null,
          token_expires_at: expiresAt,
          is_active: true,
        },
        {
          onConflict: 'user_id,platform',
        }
      );

    if (upsertError) {
      console.error('Error saving LinkedIn account:', upsertError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=save_failed`
      );
    }

    // Clear OAuth cookie
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=linkedin_connected`
    );
    
    response.cookies.delete('linkedin_oauth_state');

    return response;
  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=callback_failed`
    );
  }
}

