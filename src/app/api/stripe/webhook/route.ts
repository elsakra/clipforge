import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, getPlanFromPriceId } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0].price.id;
        const plan = getPlanFromPriceId(priceId);

        if (!plan) {
          console.error('Unknown price ID:', priceId);
          break;
        }

        // Update user
        await supabase
          .from('users')
          .update({
            plan,
            stripe_subscription_id: subscriptionId,
            usage_limit: plan === 'starter' ? 10 : plan === 'pro' ? 50 : -1,
          })
          .eq('stripe_customer_id', customerId);

        // Create subscription record
        await supabase.from('subscriptions').insert({
          user_id: (
            await supabase
              .from('users')
              .select('id')
              .eq('stripe_customer_id', customerId)
              .single()
          ).data?.id,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: priceId,
          plan,
          status: subscription.status === 'trialing' ? 'trialing' : 'active',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        });

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0].price.id;
        const plan = getPlanFromPriceId(priceId);

        // Update user plan
        await supabase
          .from('users')
          .update({
            plan: plan || 'free',
            usage_limit: plan === 'starter' ? 10 : plan === 'pro' ? 50 : plan === 'agency' ? -1 : 3,
          })
          .eq('stripe_customer_id', customerId);

        // Update subscription record
        await supabase
          .from('subscriptions')
          .update({
            stripe_price_id: priceId,
            plan: plan || 'starter',
            status: subscription.cancel_at_period_end ? 'canceled' : subscription.status === 'past_due' ? 'past_due' : 'active',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq('stripe_subscription_id', subscription.id);

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Downgrade to free
        await supabase
          .from('users')
          .update({
            plan: 'free',
            stripe_subscription_id: null,
            usage_limit: 3,
          })
          .eq('stripe_customer_id', customerId);

        // Update subscription status
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id);

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Mark subscription as past due
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', invoice.subscription as string);

        // TODO: Send email notification to user

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}


