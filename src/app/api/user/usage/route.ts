import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    
    // Try to get existing user
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    // If user doesn't exist, create them
    if (error && error.code === 'PGRST116') {
      const clerkUser = await currentUser();
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          clerk_id: userId,
          email: clerkUser?.emailAddresses[0]?.emailAddress || 'unknown@example.com',
          name: clerkUser?.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : null,
          image_url: clerkUser?.imageUrl || null,
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

      user = newUser;
    } else if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // Calculate usage limits based on plan
    const planLimits: Record<string, number> = {
      free: 3,
      starter: 10,
      pro: 50,
      agency: -1, // unlimited
    };

    const limit = planLimits[user?.plan || 'free'] || 3;

    return NextResponse.json({
      success: true,
      usage: {
        current: user?.usage_this_month || 0,
        limit,
        plan: user?.plan || 'free',
      },
    });
  } catch (error) {
    console.error('Usage fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


