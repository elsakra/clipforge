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
    
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('plan, usage_this_month, usage_limit')
      .eq('id', user.id)
      .single();

    if (error) {
      // User might not exist in our table yet
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          usage: {
            current: 0,
            limit: 3,
          plan: 'free',
          },
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      usage: {
        current: dbUser.usage_this_month,
        limit: dbUser.plan === 'agency' ? -1 : dbUser.usage_limit,
        plan: dbUser.plan,
      },
    });
  } catch (error) {
    console.error('User usage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
