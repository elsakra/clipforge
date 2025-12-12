'use client';

import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sidebar via-background to-sidebar relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-primary/20 blur-3xl animate-float"
                style={{
                  width: `${200 + i * 100}px`,
                  height: `${200 + i * 100}px`,
                  top: `${10 + i * 15}%`,
                  left: `${5 + i * 12}%`,
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center glow">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-gradient">ClipForge</span>
          </Link>

          <h1 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">
            Transform your content<br />
            <span className="text-gradient">into viral moments</span>
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-md">
            AI-powered content repurposing that turns your videos into clips, 
            social posts, and newsletters — automatically.
          </p>

          <div className="space-y-4">
            {[
              'Auto-transcribe videos with AI',
              'Generate viral clips in seconds',
              'Create posts for every platform',
              'Schedule and publish automatically',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gradient">ClipForge</span>
            </Link>
          </div>

          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "w-full shadow-none bg-transparent",
                headerTitle: "text-2xl font-bold",
                headerSubtitle: "text-muted-foreground",
                formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-11",
                formFieldInput: "h-11 bg-secondary/50 border-border focus:ring-2 focus:ring-primary",
                formFieldLabel: "text-foreground font-medium",
                footerAction: "text-muted-foreground",
                footerActionLink: "text-primary hover:text-primary/80 font-medium",
                identityPreviewEditButton: "text-primary",
                formResendCodeLink: "text-primary",
                otpCodeFieldInput: "border-border bg-secondary/50",
                dividerLine: "bg-border",
                dividerText: "text-muted-foreground",
                socialButtonsBlockButton: "border-border bg-secondary/30 hover:bg-secondary/50 text-foreground",
                socialButtonsBlockButtonText: "font-medium",
              },
            }}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            forceRedirectUrl="/dashboard"
          />
        </div>
      </div>
    </div>
  );
}


