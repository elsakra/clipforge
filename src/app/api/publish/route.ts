import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/auth';
import { postTweet, postThread, refreshTwitterToken } from '@/lib/social/twitter';
import { createLinkedInPost } from '@/lib/social/linkedin';

// Publish content to social platforms
export async function POST(request: Request) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { generatedContentId, platform } = body;

    if (!generatedContentId || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get generated content
    const { data: generatedContent } = await supabase
      .from('generated_contents')
      .select('*')
      .eq('id', generatedContentId)
      .eq('user_id', user.id)
      .single();

    if (!generatedContent) {
      return NextResponse.json(
        { error: 'Generated content not found' },
        { status: 404 }
      );
    }

    // Get social account
    const { data: socialAccount } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .eq('is_active', true)
      .single();

    if (!socialAccount) {
      return NextResponse.json(
        { error: `No ${platform} account connected` },
        { status: 400 }
      );
    }

    let publishedUrl: string | null = null;
    let accessToken = socialAccount.access_token;

    // Check if token needs refresh
    if (socialAccount.token_expires_at) {
      const expiresAt = new Date(socialAccount.token_expires_at);
      if (expiresAt <= new Date()) {
        // Refresh token
        if (platform === 'twitter' && socialAccount.refresh_token) {
          try {
            const tokens = await refreshTwitterToken(socialAccount.refresh_token);
            accessToken = tokens.accessToken;
            
            // Update tokens in database
            await supabase
              .from('social_accounts')
              .update({
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken,
                token_expires_at: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
              })
              .eq('id', socialAccount.id);
          } catch {
            return NextResponse.json(
              { error: 'Failed to refresh token. Please reconnect your account.' },
              { status: 401 }
            );
          }
        }
      }
    }

    try {
      // Publish based on platform
      if (platform === 'twitter') {
        const contentType = generatedContent.type;
        
        if (contentType === 'twitter_thread') {
          // Parse thread content (assuming format: tweet1\n---\ntweet2\n---\ntweet3)
          const tweets = generatedContent.content.split('\n---\n').map((t: string) => t.trim());
          const results = await postThread(accessToken, tweets);
          publishedUrl = `https://twitter.com/i/status/${results[0].id}`;
        } else {
          const result = await postTweet(accessToken, { text: generatedContent.content });
          publishedUrl = `https://twitter.com/i/status/${result.id}`;
        }
      } else if (platform === 'linkedin') {
        const result = await createLinkedInPost(
          accessToken,
          socialAccount.platform_user_id,
          { text: generatedContent.content }
        );
        publishedUrl = result.url;
      }

      // Update generated content status
      await supabase
        .from('generated_contents')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          published_url: publishedUrl,
        })
        .eq('id', generatedContentId);

      return NextResponse.json({
        success: true,
        publishedUrl,
      });
    } catch (error) {
      console.error('Publishing error:', error);
      
      // Update status to failed
      await supabase
        .from('generated_contents')
        .update({ status: 'failed' })
        .eq('id', generatedContentId);

      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to publish' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
