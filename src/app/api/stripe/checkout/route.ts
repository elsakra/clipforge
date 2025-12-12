import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createCheckoutSession, createStripeCustomer, STRIPE_PRICES } from '@/lib/stripe';

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
    const { plan } = body;

    if (!plan || !['starter', 'pro', 'agency'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    const priceId = STRIPE_PRICES[plan as keyof typeof STRIPE_PRICES];
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not configured for this plan' },
        { status: 500 }
      );
    }

    const supabase = createAdminClient();
    const clerkUser = await currentUser();

    // Get or create user
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      // Create user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          clerk_id: userId,
          email: clerkUser?.emailAddresses[0]?.emailAddress || '',
          name: clerkUser?.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : null,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }
      user = newUser;
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.stripe_customer_id;

    if (!stripeCustomerId) {
      stripeCustomerId = await createStripeCustomer(
        user.email,
        user.name || undefined
      );

      // Update user with Stripe customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id);
    }

    // Create checkout session
    const checkoutUrl = await createCheckoutSession(
      stripeCustomerId,
      priceId,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=true`,
      `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`
    );

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


