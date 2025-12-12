import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/auth';
import { inngest } from '@/lib/inngest/client';

// Start processing a content item
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
    const { contentId } = body;

    if (!contentId) {
      return NextResponse.json(
        { error: 'Missing contentId' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get content
    const { data: content, error: contentError } = await supabase
      .from('contents')
      .select('*')
      .eq('id', contentId)
      .eq('user_id', user.id)
      .single();

    if (contentError || !content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Check if already processing
    if (content.status === 'transcribing' || content.status === 'analyzing') {
      return NextResponse.json(
        { message: 'Content is already being processed' },
        { status: 200 }
      );
    }

    // Get the file URL
    let fileUrl = content.file_url;
    
    // If it's an R2 key, we need to get a signed URL
    if (content.source_type === 'upload' && content.file_url && !content.file_url.startsWith('http')) {
      try {
        const { getDownloadUrl } = await import('@/lib/storage/r2');
        fileUrl = await getDownloadUrl({ key: content.file_url });
      } catch {
        // R2 not configured, use file_url as-is (might be Cloudinary URL)
        fileUrl = content.file_url;
      }
    }

    // For YouTube/TikTok sources, use the source URL
    if (content.source_type === 'youtube' || content.source_type === 'tiktok' || content.source_type === 'url') {
      fileUrl = content.source_url;
    }

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'No file URL available' },
        { status: 400 }
      );
    }

    // Send event to Inngest for background processing
    await inngest.send({
      name: 'content/uploaded',
      data: {
        contentId,
        userId: user.id,
        fileUrl,
        title: content.title,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Processing started',
    });
  } catch (error) {
    console.error('Process error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get processing status for a content item
export async function GET(request: Request) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json(
        { error: 'Missing contentId' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get content with clips count
    const { data: content, error } = await supabase
      .from('contents')
      .select(`
        *,
        clips (count)
      `)
      .eq('id', contentId)
      .eq('user_id', user.id)
      .single();

    if (error || !content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: content.id,
      status: content.status,
      title: content.title,
      duration: content.duration,
      hasTranscription: !!content.transcription,
      clipsCount: (content.clips as unknown as { count: number }[])?.[0]?.count || 0,
    });
  } catch (error) {
    console.error('Get process status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
