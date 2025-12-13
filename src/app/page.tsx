'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { 
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
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Logo Component
function Logo({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative w-9 h-9 flex-shrink-0">
        <Image src="/logo-icon.svg" alt="ClipForge" fill className="object-contain" />
      </div>
      {!iconOnly && (
        <span className="text-xl font-display font-bold tracking-tight">
          Clip<span className="text-primary">Forge</span>
        </span>
      )}
    </div>
  );
}

const features = [
  {
    icon: Upload,
    title: 'Smart Upload',
    description: 'Drag & drop videos or import directly from YouTube, TikTok, and more.',
  },
  {
    icon: Sparkles,
    title: 'AI Transcription',
    description: 'Automatic speech-to-text with speaker detection using OpenAI Whisper.',
  },
  {
    icon: Scissors,
    title: 'Viral Clip Detection',
    description: 'AI identifies the most engaging moments for short-form clips.',
  },
  {
    icon: FileText,
    title: 'Multi-Platform Content',
    description: 'Generate posts, threads, and captions optimized for each platform.',
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Schedule posts at optimal times for maximum engagement.',
  },
  {
    icon: TrendingUp,
    title: 'Analytics & Insights',
    description: 'Track performance and get AI-powered recommendations.',
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <Logo />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                Features
              </Link>
              <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                Pricing
              </Link>
              <Link href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                Testimonials
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" asChild className="text-muted-foreground">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild className="press-effect">
                <Link href="/sign-up">Get Started</Link>
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
          <div className="md:hidden border-t border-border/40 bg-background/98 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-4">
              <Link href="#features" className="block text-sm text-muted-foreground hover:text-foreground">Features</Link>
              <Link href="#pricing" className="block text-sm text-muted-foreground hover:text-foreground">Pricing</Link>
              <Link href="#testimonials" className="block text-sm text-muted-foreground hover:text-foreground">Testimonials</Link>
              <div className="pt-4 space-y-2 border-t border-border/40">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Background gradient effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-primary/8 via-primary/4 to-transparent blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-primary/10 blur-[100px] animate-float" />
          <div className="absolute top-1/2 right-1/4 w-96 h-96 rounded-full bg-accent/8 blur-[120px] animate-float-delayed" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="animate-fade-in">
            <Badge variant="secondary" className="mb-8 px-4 py-1.5 text-xs font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
              <Zap className="w-3 h-3 mr-1.5" />
              AI-Powered Content Repurposing
            </Badge>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-6 tracking-tight animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Turn one video into
            <br />
            <span className="text-gradient">100 pieces of content</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Upload your video or podcast once. Let AI transcribe, find viral moments, 
            generate clips, and create social posts for every platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Button size="lg" className="gap-2 h-12 px-8 text-base glow-sm press-effect" asChild>
              <Link href="/sign-up">
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 h-12 px-8 text-base press-effect" asChild>
              <Link href="#demo">
                <Play className="w-4 h-4" />
                Watch Demo
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.4s' }}>
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
        <div className="relative max-w-lg mx-auto mt-20 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <p className="text-center text-sm text-muted-foreground mb-6 font-medium">
            Publish to all major platforms
          </p>
          <div className="flex items-center justify-center gap-10">
            <Twitter className="w-6 h-6 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
            <Linkedin className="w-6 h-6 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
            <Instagram className="w-6 h-6 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
            <Youtube className="w-6 h-6 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-subtle">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-xs font-medium">Features</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
              Everything you need to <span className="text-gradient">scale your content</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From transcription to publishing, ClipForge handles the entire content repurposing workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="bg-card/60 border-border/50 card-hover group"
              >
                <CardContent className="p-6">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 group-hover:scale-105 transition-all duration-300">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold mb-2 font-display">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-xs font-medium">How It Works</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
              Three steps to <span className="text-gradient">10x your content</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            {[
              {
                step: '01',
                title: 'Upload',
                description: 'Upload your video, audio, or paste a YouTube/TikTok URL.',
                icon: Upload,
              },
              {
                step: '02',
                title: 'Generate',
                description: 'AI transcribes, identifies highlights, and creates clips + posts.',
                icon: Sparkles,
              },
              {
                step: '03',
                title: 'Publish',
                description: 'Review, edit, and publish to all platforms in one click.',
                icon: Zap,
              },
            ].map((item, index) => (
              <div key={index} className="relative text-center md:text-left">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-6 mx-auto md:mx-0">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-xs font-semibold text-primary mb-2 tracking-wider">STEP {item.step}</div>
                <h3 className="text-xl font-semibold mb-3 font-display">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                {index < 2 && (
                  <ChevronRight className="hidden md:block absolute top-8 -right-4 w-6 h-6 text-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-subtle">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-xs font-medium">Testimonials</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
              Loved by <span className="text-gradient">10,000+ creators</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-card/60 border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-0.5 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-5 leading-relaxed">&ldquo;{testimonial.content}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-sm font-semibold text-white">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-xs font-medium">Pricing</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
              Simple, transparent <span className="text-gradient">pricing</span>
            </h2>
            <p className="text-muted-foreground">Start free, upgrade when you need more</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={cn(
                  'relative bg-card/60 border-border/50 card-hover',
                  plan.popular && 'border-primary/50 shadow-lg shadow-primary/5 bg-card/80'
                )}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                <CardContent className="p-6 pt-8">
                  <h3 className="text-lg font-semibold mb-1 font-display">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-5">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold font-display">${plan.price}</span>
                    <span className="text-muted-foreground text-sm">/month</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={cn('w-full press-effect', plan.popular && 'glow-sm')}
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
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="relative p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/5 border border-primary/10 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="relative text-center">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4 tracking-tight">
                Ready to 10x your content output?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Join thousands of creators who save 10+ hours every week with ClipForge.
              </p>
              <Button size="lg" className="gap-2 h-12 px-8 glow-sm press-effect" asChild>
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
      <footer className="border-t border-border/50 py-12 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/">
              <Logo />
            </Link>
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
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
