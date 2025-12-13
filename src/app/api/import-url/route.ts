// @ts-nocheck
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/auth';
import { inngest } from '@/lib/inngest/client';

// Regex patterns for URL validation
const YOUTUBE_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
const TIKTOK_REGEX = /tiktok\.com\/@[\w.-]+\/video\/(\d+)/;

function extractYouTubeId(url: string): string | null {
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

function extractTikTokId(url: string): string | null {
  const match = url.match(TIKTOK_REGEX);
  return match ? match[1] : null;
}

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
    const { url, sourceType } = body;

    if (!url || !sourceType) {
      return NextResponse.json(
        { error: 'Missing required fields: url, sourceType' },
        { status: 400 }
      );
    }

    // Validate URL based on source type
    let videoId: string | null = null;
    let title = 'Imported Video';

    if (sourceType === 'youtube') {
      videoId = extractYouTubeId(url);
      if (!videoId) {
        return NextResponse.json(
          { error: 'Invalid YouTube URL' },
          { status: 400 }
        );
      }
      title = `YouTube Video ${videoId}`;
    } else if (sourceType === 'tiktok') {
      videoId = extractTikTokId(url);
      if (!videoId) {
        return NextResponse.json(
          { error: 'Invalid TikTok URL' },
          { status: 400 }
        );
      }
      title = `TikTok Video ${videoId}`;
    } else {
      return NextResponse.json(
        { error: 'Unsupported source type. Use youtube or tiktok.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get user from database to check plan limits
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // Create user if doesn't exist
    let currentUser = dbUser;
    if (!currentUser) {
      const { data: newUser, error: createError } = await supabase
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

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }
      currentUser = newUser;
    }

    // Check usage limit
    const plan = currentUser.plan as string;
    if (currentUser.usage_this_month >= currentUser.usage_limit && plan !== 'agency') {
      return NextResponse.json(
        { error: 'You have reached your monthly content limit. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    // Create content record in database
    const { data: content, error: contentError } = await supabase
      .from('contents')
      .insert({
        user_id: user.id,
        title,
        source_type: sourceType,
        source_url: url,
        status: 'processing',
      })
      .select()
      .single();

    if (contentError) {
      console.error('Error creating content:', contentError);
      return NextResponse.json(
        { error: 'Failed to create content record' },
        { status: 500 }
      );
    }

    // Increment usage count
    await supabase.rpc('increment_usage', { p_user_id: user.id });

    // Trigger processing via Inngest
    try {
      await inngest.send({
        name: 'content/uploaded',
        data: {
          contentId: content.id,
          userId: user.id,
          fileUrl: url,
          title,
          sourceType,
        },
      });
    } catch (inngestError) {
      console.error('Failed to trigger Inngest:', inngestError);
      // Don't fail the request, processing can be triggered manually
    }

    return NextResponse.json({
      success: true,
      contentId: content.id,
      message: 'Content import started',
    });
  } catch (error) {
    console.error('Import URL error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

