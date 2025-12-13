// @ts-nocheck
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { postTweet, refreshTwitterToken } from '@/lib/social/twitter';
import { createLinkedInPost } from '@/lib/social/linkedin';

// This cron job runs every 5 minutes to publish scheduled posts
export async function GET(request: Request) {
  // Verify cron secret (Vercel cron)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const supabase = createAdminClient();
  const now = new Date();

  try {
    // Get posts that are due to be published
    const { data: duePostsData, error } = await supabase
      .from('scheduled_posts')
      .select(`
        *,
        generated_contents(content),
        users(id),
        social_accounts(*)
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_at', now.toISOString())
      .limit(10);

    if (error) {
      console.error('Error fetching due posts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch scheduled posts' },
        { status: 500 }
      );
    }

    interface ScheduledPost {
      id: string;
      platform: string;
      generated_content_id: string;
      generated_contents?: { content: string };
      social_accounts?: Array<{
        id: string;
        platform: string;
        is_active: boolean;
        access_token: string;
        refresh_token?: string;
        token_expires_at?: string;
        platform_user_id: string;
      }>;
    }

    const duePosts = duePostsData as ScheduledPost[] | null;
    const results: Array<{ id: string; status: string; url?: string; error?: string }> = [];

    for (const post of duePosts || []) {
      try {
        // Update status to publishing
        await supabase
          .from('scheduled_posts')
          .update({ status: 'publishing' } as never)
          .eq('id', post.id);

        // Get social account for platform
        const socialAccount = post.social_accounts?.find(
          (a) => a.platform === post.platform && a.is_active
        );

        if (!socialAccount) {
          throw new Error(`No active ${post.platform} account found`);
        }

        let accessToken = socialAccount.access_token;

        // Refresh token if expired
        if (socialAccount.token_expires_at) {
          const expiresAt = new Date(socialAccount.token_expires_at);
          if (expiresAt <= now) {
            if (post.platform === 'twitter' && socialAccount.refresh_token) {
              const tokens = await refreshTwitterToken(socialAccount.refresh_token);
              accessToken = tokens.accessToken;
              
              // Update tokens
              await supabase
                .from('social_accounts')
                .update({
                  access_token: tokens.accessToken,
                  refresh_token: tokens.refreshToken,
                  token_expires_at: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
                } as never)
                .eq('id', socialAccount.id);
            }
          }
        }

        const content = post.generated_contents?.content;
        if (!content) {
          throw new Error('No content to publish');
        }

        let publishedUrl = '';

        // Publish based on platform
        if (post.platform === 'twitter') {
          const result = await postTweet(accessToken, { text: content });
          publishedUrl = `https://twitter.com/i/status/${result.id}`;
        } else if (post.platform === 'linkedin') {
          const result = await createLinkedInPost(
            accessToken,
            socialAccount.platform_user_id,
            { text: content }
          );
          publishedUrl = result.url;
        }

        // Update status to published
        await supabase
          .from('scheduled_posts')
          .update({ status: 'published' } as never)
          .eq('id', post.id);

        // Update generated content
        await supabase
          .from('generated_contents')
          .update({
            status: 'published',
            published_at: now.toISOString(),
            published_url: publishedUrl,
          } as never)
          .eq('id', post.generated_content_id);

        results.push({ id: post.id, status: 'published', url: publishedUrl });
      } catch (error) {
        console.error(`Error publishing post ${post.id}:`, error);
        
        // Update status to failed
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          } as never)
          .eq('id', post.id);

        results.push({ id: post.id, status: 'failed', error: (error as Error).message });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


