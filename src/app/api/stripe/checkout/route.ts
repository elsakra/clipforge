// @ts-nocheck
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/auth';
import { createCheckoutSession, createStripeCustomer, STRIPE_PRICES } from '@/lib/stripe';

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

    // Get or create user in our database
    let { data: dbUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!dbUser) {
      // Create user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }
      dbUser = newUser;
    }

    // Get or create Stripe customer
    let stripeCustomerId = dbUser.stripe_customer_id;

    if (!stripeCustomerId) {
      stripeCustomerId = await createStripeCustomer(
        dbUser.email,
        dbUser.name || undefined
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
