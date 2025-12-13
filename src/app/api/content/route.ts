// @ts-nocheck
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/auth';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Get all content for user
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

    // Get contents with clip count
    const { data: contents, error } = await (supabase
      .from('contents') as any)
      .select(`
        *,
        clips(count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contents' },
        { status: 500 }
      );
    }

    // Transform data
    const transformedContents = contents.map((content: any) => ({
      ...content,
      clipCount: content.clips?.[0]?.count || 0,
      clips: undefined,
    }));

    return NextResponse.json({
      success: true,
      contents: transformedContents,
    });
  } catch (error) {
    console.error('Content fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete content
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
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json(
        { error: 'Missing contentId' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Delete content (cascades to clips and generated content)
    const { error } = await (supabase.from('contents') as any)
      .delete()
      .eq('id', contentId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting content:', error);
      return NextResponse.json(
        { error: 'Failed to delete content' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Content deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
