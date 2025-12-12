'use client';

import Link from 'next/link';
import { useState } from 'react';
import { 
  Sparkles, 
  Zap, 
  Clock, 
  TrendingUp, 
  Play, 
  ArrowRight, 
  Check, 
  Star,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Upload,
  Scissors,
  FileText,
  Calendar,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Upload,
    title: 'Smart Upload',
    description: 'Drag & drop videos or import directly from YouTube and TikTok',
  },
  {
    icon: Sparkles,
    title: 'AI Transcription',
    description: 'Automatic speech-to-text with speaker detection using Whisper',
  },
  {
    icon: Scissors,
    title: 'Viral Clip Detection',
    description: 'AI identifies the most engaging moments for short-form clips',
  },
  {
    icon: FileText,
    title: 'Multi-Platform Content',
    description: 'Generate posts, threads, captions optimized for each platform',
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Schedule posts at optimal times for maximum engagement',
  },
  {
    icon: TrendingUp,
    title: 'Analytics & Insights',
    description: 'Track performance and get AI-powered recommendations',
  },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Podcast Host',
    avatar: 'SC',
    content: 'ClipForge saves me 15+ hours every week. I upload my podcast and it creates clips, tweets, and LinkedIn posts automatically.',
    rating: 5,
  },
  {
    name: 'Marcus Johnson',
    role: 'YouTube Creator',
    avatar: 'MJ',
    content: 'The viral clip detection is insanely accurate. My shorts get 3x more views now because ClipForge finds the perfect moments.',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Marketing Director',
    avatar: 'ER',
    content: 'We used to have a team member dedicated to content repurposing. Now ClipForge does it better in minutes.',
    rating: 5,
  },
];

const plans = [
  {
    name: 'Starter',
    price: 29,
    description: 'Perfect for individual creators',
    features: [
      '10 videos per month',
      'Auto-transcription',
      'AI clip suggestions',
      'Social post generation',
      'Twitter & LinkedIn',
      'Basic analytics',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Pro',
    price: 79,
    description: 'For serious content creators',
    features: [
      '50 videos per month',
      'Everything in Starter',
      'All social platforms',
      'Content calendar',
      'Auto-scheduling',
      'Advanced analytics',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Agency',
    price: 199,
    description: 'For teams and agencies',
    features: [
      'Unlimited videos',
      'Everything in Pro',
      'Team collaboration',
      'White-label exports',
      'API access',
      'Custom integrations',
      'Dedicated support',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-brand flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">ClipForge</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Testimonials
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild className="glow-sm">
                <Link href="/sign-up">Get Started Free</Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-lg">
            <div className="px-4 py-4 space-y-4">
              <Link href="#features" className="block text-sm text-muted-foreground">Features</Link>
              <Link href="#pricing" className="block text-sm text-muted-foreground">Pricing</Link>
              <Link href="#testimonials" className="block text-sm text-muted-foreground">Testimonials</Link>
              <div className="pt-4 space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link href="/sign-up">Get Started Free</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 gap-2">
            <Zap className="w-3 h-3" />
            AI-Powered Content Repurposing
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
            Turn one video into<br />
            <span className="text-gradient">100 pieces of content</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Upload your video or podcast once. Let AI transcribe, find viral moments, 
            generate clips, and create social posts for every platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button size="lg" className="gap-2 h-12 px-8 glow" asChild>
              <Link href="/sign-up">
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 h-12 px-8" asChild>
              <Link href="#demo">
                <Play className="w-4 h-4" />
                Watch Demo
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              7-day free trial
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              Cancel anytime
            </div>
          </div>
        </div>

        {/* Platform icons */}
        <div className="relative max-w-4xl mx-auto mt-16">
          <p className="text-center text-sm text-muted-foreground mb-6">
            Publish to all your favorite platforms
          </p>
          <div className="flex items-center justify-center gap-8 opacity-60">
            <Twitter className="w-8 h-8" />
            <Linkedin className="w-8 h-8" />
            <Instagram className="w-8 h-8" />
            <Youtube className="w-8 h-8" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need to <span className="text-gradient">scale your content</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From transcription to publishing, ClipForge handles the entire content repurposing workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card/50 hover:bg-card transition-colors group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Three steps to <span className="text-gradient">10x your content</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Upload',
                description: 'Upload your video, audio, or paste a YouTube/TikTok URL',
              },
              {
                step: '02',
                title: 'Generate',
                description: 'AI transcribes, identifies highlights, creates clips and posts',
              },
              {
                step: '03',
                title: 'Publish',
                description: 'Review, edit, and publish to all platforms in one click',
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-8xl font-bold text-primary/10 absolute -top-4 -left-4">
                  {item.step}
                </div>
                <div className="relative pt-8 pl-8">
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
                {index < 2 && (
                  <ChevronRight className="hidden md:block absolute top-1/2 -right-4 w-8 h-8 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Loved by <span className="text-gradient">10,000+ creators</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-card/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">&ldquo;{testimonial.content}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-medium">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Simple, transparent <span className="text-gradient">pricing</span>
            </h2>
            <p className="text-muted-foreground">Start free, upgrade when you need more</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={cn(
                  'relative',
                  plan.popular && 'border-primary shadow-lg shadow-primary/20'
                )}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={cn('w-full', plan.popular && 'glow-sm')}
                    variant={plan.popular ? 'default' : 'outline'}
                    asChild
                  >
                    <Link href="/sign-up">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(20,184,166,0.1),transparent_50%)]" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to 10x your content output?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of creators who save 10+ hours every week with ClipForge.
              </p>
              <Button size="lg" className="gap-2 h-12 px-8 glow" asChild>
                <Link href="/sign-up">
                  Start Your Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">ClipForge</span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
              <Link href="/contact" className="hover:text-foreground">Contact</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ClipForge. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
