// @ts-nocheck
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/auth';

// Get scheduled posts
export async function GET() {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Get scheduled posts with generated content
    const { data: posts, error } = await supabase
      .from('scheduled_posts')
      .select(`
        *,
        generated_contents(content)
      `)
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Error fetching scheduled posts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch scheduled posts' },
        { status: 500 }
      );
    }

    // Transform data
    const transformedPosts = posts.map((post) => ({
      id: post.id,
      content: (post.generated_contents as { content?: string } | null)?.content || '',
      platform: post.platform,
      scheduledAt: post.scheduled_at,
      status: post.status,
      generatedContentId: post.generated_content_id,
    }));

    return NextResponse.json({
      success: true,
      posts: transformedPosts,
    });
  } catch (error) {
    console.error('Schedule fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create scheduled post
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
    const { generatedContentId, content, platform, scheduledAt } = body;

    if (!platform || !scheduledAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    let contentId = generatedContentId;

    // If no generated content ID, create one
    if (!contentId && content) {
      const { data: newContent, error: contentError } = await supabase
        .from('generated_contents')
        .insert({
          user_id: user.id,
          content_id: null, // Manual post, no source content
          type: `${platform}_post`,
          platform,
          content,
          status: 'scheduled',
        })
        .select()
        .single();

      if (contentError) {
        console.error('Error creating generated content:', contentError);
        return NextResponse.json(
          { error: 'Failed to create content' },
          { status: 500 }
        );
      }

      contentId = newContent.id;
    }

    // Create scheduled post
    const { data: post, error } = await supabase
      .from('scheduled_posts')
      .insert({
        user_id: user.id,
        generated_content_id: contentId,
        platform,
        scheduled_at: scheduledAt,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating scheduled post:', error);
      return NextResponse.json(
        { error: 'Failed to schedule post' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error('Schedule creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete scheduled post
export async function DELETE(request: Request) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json(
        { error: 'Missing postId' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Delete scheduled post
    const { error } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting scheduled post:', error);
      return NextResponse.json(
        { error: 'Failed to delete scheduled post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Schedule deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
