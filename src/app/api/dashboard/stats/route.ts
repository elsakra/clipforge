import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/auth';

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
    
    // Get user record
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, plan, usage_this_month, usage_limit')
      .eq('id', user.id)
      .single();

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get stats using parallel queries
    const [
      contentsResult,
      clipsResult,
      generatedResult,
      durationResult,
      recentContentResult,
    ] = await Promise.all([
      // Total content count
      supabase
        .from('contents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      
      // Total clips count
      supabase
        .from('clips')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      
      // Total generated content count
      supabase
        .from('generated_contents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      
      // Total duration of processed content (time saved estimate: actual duration * 5)
      supabase
        .from('contents')
        .select('duration')
        .eq('user_id', user.id)
        .eq('status', 'ready'),
      
      // Recent content with clips count
      supabase
        .from('contents')
        .select(`
          id,
          title,
          status,
          thumbnail_url,
          created_at,
          clips (count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    // Calculate time saved (estimate: 5 minutes saved per minute of content)
    const totalDuration = durationResult.data?.reduce((acc, item) => acc + (item.duration || 0), 0) || 0;
    const timeSaved = Math.round(totalDuration * 5 / 60); // Convert to minutes saved

    // Format recent content
    const recentContent = recentContentResult.data?.map(item => ({
      id: item.id,
      title: item.title,
      status: item.status,
      thumbnailUrl: item.thumbnail_url,
      createdAt: item.created_at,
      clipsCount: (item.clips as any)?.[0]?.count || 0,
    })) || [];

    return NextResponse.json({
      totalContent: contentsResult.count || 0,
      totalClips: clipsResult.count || 0,
      totalPosts: generatedResult.count || 0,
      timeSaved,
      recentContent,
      usage: {
        current: dbUser.usage_this_month,
        limit: dbUser.usage_limit,
        plan: dbUser.plan,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
