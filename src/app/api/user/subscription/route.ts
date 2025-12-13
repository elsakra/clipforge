// @ts-nocheck
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

    // Get user with subscription
    const { data: dbUser } = await supabase
      .from('users')
      .select('plan, stripe_subscription_id')
      .eq('id', user.id)
      .single();

    if (!dbUser) {
      return NextResponse.json({
        success: true,
        subscription: {
          plan: 'free',
          status: 'active',
          currentPeriodEnd: null,
        },
      });
    }

    // Get subscription details if exists
    let subscription = null;
    if (dbUser.stripe_subscription_id) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', dbUser.stripe_subscription_id)
        .single();
      
      if (sub) {
        subscription = {
          plan: sub.plan,
          status: sub.status,
          currentPeriodEnd: sub.current_period_end,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        };
      }
    }

    return NextResponse.json({
      success: true,
      subscription: subscription || {
        plan: dbUser.plan || 'free',
        status: 'active',
        currentPeriodEnd: null,
      },
    });
  } catch (error) {
    console.error('Subscription fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
