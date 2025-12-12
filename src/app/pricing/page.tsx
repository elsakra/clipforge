'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Sparkles, Check, ArrowLeft, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 29,
    yearlyPrice: 290,
    description: 'Perfect for individual creators',
    features: [
      '10 videos per month',
      'Auto-transcription',
      'AI clip suggestions',
      'Social post generation',
      'Twitter & LinkedIn publishing',
      'Basic analytics',
      'Email support',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 79,
    yearlyPrice: 790,
    description: 'For serious content creators',
    features: [
      '50 videos per month',
      'Everything in Starter',
      'All social platforms',
      'Content calendar',
      'Auto-scheduling',
      'Advanced analytics',
      'Priority support',
      'Custom captions',
    ],
    popular: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    description: 'For teams and agencies',
    features: [
      'Unlimited videos',
      'Everything in Pro',
      'Team collaboration (5 seats)',
      'White-label exports',
      'API access',
      'Custom integrations',
      'Dedicated account manager',
      'Custom onboarding',
    ],
    popular: false,
  },
];

function PricingContent() {
  const searchParams = useSearchParams();
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('canceled')) {
      toast.error('Checkout was canceled. Feel free to try again when ready.');
    }
  }, [searchParams]);

  const handleSubscribe = async (planId: string) => {
    setIsLoading(planId);
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">ClipForge</span>
          </Link>
          <Button variant="ghost" asChild>
            <Link href="/" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <main className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Choose your <span className="text-gradient">plan</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Start with a 7-day free trial. Cancel anytime. No credit card required to start.
            </p>

            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <Label htmlFor="billing-toggle" className={cn(!isYearly && 'text-foreground', isYearly && 'text-muted-foreground')}>
                Monthly
              </Label>
              <Switch
                id="billing-toggle"
                checked={isYearly}
                onCheckedChange={setIsYearly}
              />
              <Label htmlFor="billing-toggle" className={cn(isYearly && 'text-foreground', !isYearly && 'text-muted-foreground')}>
                Yearly
                <Badge variant="secondary" className="ml-2">Save 17%</Badge>
              </Label>
            </div>
          </div>

          {/* Plans */}
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={cn(
                  'relative',
                  plan.popular && 'border-primary shadow-lg shadow-primary/20'
                )}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gap-1">
                    <Zap className="w-3 h-3" />
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">
                      ${isYearly ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                    {isYearly && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Billed ${plan.yearlyPrice}/year
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={cn('w-full', plan.popular && 'glow-sm')}
                    variant={plan.popular ? 'default' : 'outline'}
                    disabled={isLoading === plan.id}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {isLoading === plan.id ? (
                      'Loading...'
                    ) : (
                      <>Start Free Trial</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[
                {
                  q: 'What happens after my free trial?',
                  a: 'After 7 days, you\'ll be charged for your selected plan. You can cancel anytime before the trial ends.',
                },
                {
                  q: 'Can I change plans later?',
                  a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
                },
                {
                  q: 'What counts as a "video"?',
                  a: 'Each uploaded file (video or audio) counts as one video, regardless of length. YouTube/TikTok imports count too.',
                },
                {
                  q: 'Do you offer refunds?',
                  a: 'Yes, we offer a 30-day money-back guarantee if you\'re not satisfied with ClipForge.',
                },
              ].map((faq, i) => (
                <Card key={i} className="bg-card/50">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">{faq.q}</h3>
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}


