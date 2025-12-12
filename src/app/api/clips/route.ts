import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { inngest } from '@/lib/inngest/client';

// Get clips for user
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
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
    
    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userRecord = user as { id: string };

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
      .eq('user_id', userRecord.id)
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
    const { userId } = await auth();
    
    if (!userId) {
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
    
    // Get user
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userErr || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const dbUser = user as { id: string };

    // Verify content belongs to user
    const { data: content } = await supabase
      .from('contents')
      .select('id, file_url')
      .eq('id', contentId)
      .eq('user_id', dbUser.id)
      .single();

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    const contentRecord = content as { id: string; file_url: string };

    // Create clip record
    const { data: clip, error: clipError } = await supabase
      .from('clips')
      .insert({
        content_id: contentId,
        user_id: dbUser.id,
        title,
        start_time: startTime,
        end_time: endTime,
        duration: endTime - startTime,
        aspect_ratio: aspectRatio,
        status: generateNow ? 'processing' : 'pending',
      })
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
    if (generateNow && clip) {
      try {
        await inngest.send({
          name: 'clip/generation.requested',
          data: {
            clipId: (clip as { id: string }).id,
            contentId,
            userId: dbUser.id,
            sourceUrl: contentRecord.file_url,
            startTime,
            endTime,
            aspectRatio,
          },
        });
      } catch (inngestError) {
        console.error('Failed to trigger clip generation:', inngestError);
        // Update clip status to pending if Inngest fails
        await supabase
          .from('clips')
          .update({ status: 'pending' })
          .eq('id', clip.id);
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
    const { userId } = await auth();
    
    if (!userId) {
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
    
    // Get user
    const { data: userPut, error: userPutErr } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userPutErr || !userPut) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const putUser = userPut as { id: string };

    // Get clip with content
    const { data: clip } = await supabase
      .from('clips')
      .select(`
        *,
        contents (
          file_url
        )
      `)
      .eq('id', clipId)
      .eq('user_id', putUser.id)
      .single();

    if (!clip) {
      return NextResponse.json(
        { error: 'Clip not found' },
        { status: 404 }
      );
    }

    const clipRecord = clip as { id: string; content_id: string; aspect_ratio: string; start_time: number; end_time: number; contents: { file_url: string } };

    // Update aspect ratio if provided
    if (aspectRatio && aspectRatio !== clipRecord.aspect_ratio) {
      await supabase
        .from('clips')
        .update({ aspect_ratio: aspectRatio })
        .eq('id', clipId);
    }

    // Update status to processing
    await supabase
      .from('clips')
      .update({ status: 'processing' })
      .eq('id', clipId);

    // Trigger generation
    await inngest.send({
      name: 'clip/generation.requested',
      data: {
        clipId: clipRecord.id,
        contentId: clipRecord.content_id,
        userId: putUser.id,
        sourceUrl: clipRecord.contents.file_url,
        startTime: clipRecord.start_time,
        endTime: clipRecord.end_time,
        aspectRatio: aspectRatio || clipRecord.aspect_ratio,
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
    const { userId } = await auth();
    
    if (!userId) {
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
    
    // Get user
    const { data: userDel, error: userDelErr } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userDelErr || !userDel) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const delUser = userDel as { id: string };

    // Delete clip
    const { error } = await supabase
      .from('clips')
      .delete()
      .eq('id', clipId)
      .eq('user_id', delUser.id);

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
