import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createPortalSession } from '@/lib/stripe';

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('clerk_id', userId)
      .single();

    if (!user?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found' },
        { status: 404 }
      );
    }

    // Create portal session
    const portalUrl = await createPortalSession(
      user.stripe_customer_id,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing`
    );

    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


