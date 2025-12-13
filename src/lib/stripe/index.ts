import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    });
  }
  return stripeInstance;
}

// Export as getter for backwards compatibility
export const stripe = {
  get customers() { return getStripe().customers; },
  get subscriptions() { return getStripe().subscriptions; },
  get checkout() { return getStripe().checkout; },
  get billingPortal() { return getStripe().billingPortal; },
  get webhooks() { return getStripe().webhooks; },
};

// Price IDs for each plan
export const STRIPE_PRICES = {
  starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID!,
  pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
  agency: process.env.NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID!,
};

// Plan details
export const PLANS = {
  starter: {
    name: 'Starter',
    price: 29,
    priceId: STRIPE_PRICES.starter,
    features: [
      '10 videos per month',
      'Auto-transcription',
      'AI clip suggestions',
      'Social post generation',
      'Twitter & LinkedIn publishing',
      'Basic analytics',
    ],
    limits: {
      videosPerMonth: 10,
      clipsPerVideo: 5,
    },
  },
  pro: {
    name: 'Pro',
    price: 79,
    priceId: STRIPE_PRICES.pro,
    features: [
      '50 videos per month',
      'Everything in Starter',
      'All social platforms',
      'Content calendar',
      'Auto-scheduling',
      'Advanced analytics',
      'Priority support',
    ],
    limits: {
      videosPerMonth: 50,
      clipsPerVideo: 15,
    },
  },
  agency: {
    name: 'Agency',
    price: 199,
    priceId: STRIPE_PRICES.agency,
    features: [
      'Unlimited videos',
      'Everything in Pro',
      'Team collaboration',
      'White-label exports',
      'API access',
      'Custom integrations',
      'Dedicated support',
    ],
    limits: {
      videosPerMonth: -1, // unlimited
      clipsPerVideo: -1, // unlimited
    },
  },
};

/**
 * Create a Stripe customer for a user
 */
export async function createStripeCustomer(email: string, name?: string): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
  });
  return customer.id;
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      trial_period_days: 7,
    },
  });

  return session.url!;
}

/**
 * Create a customer portal session
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Resume subscription
 */
export async function resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Get plan from price ID
 */
export function getPlanFromPriceId(priceId: string): 'starter' | 'pro' | 'agency' | null {
  if (priceId === STRIPE_PRICES.starter) return 'starter';
  if (priceId === STRIPE_PRICES.pro) return 'pro';
  if (priceId === STRIPE_PRICES.agency) return 'agency';
  return null;
}


