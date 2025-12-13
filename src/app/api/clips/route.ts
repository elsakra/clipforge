// @ts-nocheck
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/auth';
import { inngest } from '@/lib/inngest/client';

// Get clips for user
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
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createAdminClient();

    // Build query
    let query = supabase
      .from('clips')
      .select(`
        *,
        contents (
          title,
          thumbnail_url,
          file_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (contentId) {
      query = query.eq('content_id', contentId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: clips, error, count } = await query;

    if (error) {
      console.error('Error fetching clips:', error);
      return NextResponse.json(
        { error: 'Failed to fetch clips' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clips: clips || [],
      total: count || clips?.length || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get clips error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new clip or trigger generation
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
    const { contentId, title, startTime, endTime, aspectRatio = '9:16', generateNow = false } = body;

    if (!contentId || !title || startTime === undefined || endTime === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: contentId, title, startTime, endTime' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify content belongs to user
    const { data: contentData } = await supabase
      .from('contents')
      .select('id, file_url')
      .eq('id', contentId)
      .eq('user_id', user.id)
      .single();

    const content = contentData as { id: string; file_url: string } | null;
    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Create clip record
    const { data: clip, error: clipError } = await supabase
      .from('clips')
      .insert({
        content_id: contentId,
        user_id: user.id,
        title,
        start_time: startTime,
        end_time: endTime,
        duration: endTime - startTime,
        aspect_ratio: aspectRatio,
        status: generateNow ? 'processing' : 'pending',
      } as never)
      .select()
      .single();

    if (clipError) {
      console.error('Error creating clip:', clipError);
      return NextResponse.json(
        { error: 'Failed to create clip' },
        { status: 500 }
      );
    }

    // Trigger generation if requested
    const clipRecord = clip as { id: string } | null;
    if (generateNow && clipRecord) {
      try {
        await inngest.send({
          name: 'clip/generation.requested',
          data: {
            clipId: clipRecord.id,
            contentId,
            userId: user.id,
            sourceUrl: content.file_url,
            startTime,
            endTime,
            aspectRatio,
          },
        });
      } catch (inngestError) {
        console.error('Failed to trigger clip generation:', inngestError);
        await supabase
          .from('clips')
          .update({ status: 'pending' } as never)
          .eq('id', clipRecord.id);
      }
    }

    return NextResponse.json({
      success: true,
      clip,
    });
  } catch (error) {
    console.error('Create clip error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate a clip (trigger processing for existing clip)
export async function PUT(request: Request) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { clipId, aspectRatio } = body;

    if (!clipId) {
      return NextResponse.json(
        { error: 'Missing clipId' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get clip with content
    const { data: clipData } = await supabase
      .from('clips')
      .select(`
        *,
        contents (
          file_url
        )
      `)
      .eq('id', clipId)
      .eq('user_id', user.id)
      .single();

    const clip = clipData as { 
      id: string; 
      content_id: string; 
      aspect_ratio: string; 
      start_time: number; 
      end_time: number; 
      contents: { file_url: string } 
    } | null;

    if (!clip) {
      return NextResponse.json(
        { error: 'Clip not found' },
        { status: 404 }
      );
    }

    // Update aspect ratio if provided
    if (aspectRatio && aspectRatio !== clip.aspect_ratio) {
      await supabase
        .from('clips')
        .update({ aspect_ratio: aspectRatio } as never)
        .eq('id', clipId);
    }

    // Update status to processing
    await supabase
      .from('clips')
      .update({ status: 'processing' } as never)
      .eq('id', clipId);

    // Trigger generation
    await inngest.send({
      name: 'clip/generation.requested',
      data: {
        clipId: clip.id,
        contentId: clip.content_id,
        userId: user.id,
        sourceUrl: clip.contents.file_url,
        startTime: clip.start_time,
        endTime: clip.end_time,
        aspectRatio: aspectRatio || clip.aspect_ratio,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Clip generation started',
    });
  } catch (error) {
    console.error('Generate clip error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a clip
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
    const clipId = searchParams.get('clipId');

    if (!clipId) {
      return NextResponse.json(
        { error: 'Missing clipId' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Delete clip
    const { error } = await supabase
      .from('clips')
      .delete()
      .eq('id', clipId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting clip:', error);
      return NextResponse.json(
        { error: 'Failed to delete clip' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Delete clip error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
