'use client';

import { useState, Suspense, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Logo Component
function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <div className="relative w-10 h-10 flex-shrink-0">
        <Image src="/logo-icon.svg" alt="ClipForge" fill className="object-contain" />
      </div>
      <span className="text-2xl font-display font-bold tracking-tight">
        Clip<span className="text-primary">Forge</span>
      </span>
    </Link>
  );
}

// OTP Input Component
function OTPInput({ 
  value, 
  onChange, 
  disabled 
}: { 
  value: string; 
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focused, setFocused] = useState(0);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, char: string) => {
    if (!/^\d*$/.test(char)) return;
    
    const newValue = value.split('');
    newValue[index] = char;
    const result = newValue.join('').slice(0, 6);
    onChange(result);
    
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setFocused(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setFocused(index - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasteData);
    const nextIndex = Math.min(pasteData.length, 5);
    inputRefs.current[nextIndex]?.focus();
    setFocused(nextIndex);
  };

  return (
    <div className="flex gap-2 justify-center">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={() => setFocused(index)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            "w-12 h-14 text-center text-2xl font-semibold font-display rounded-xl border-2 bg-background",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            focused === index ? "border-primary" : "border-border"
          )}
        />
      ))}
    </div>
  );
}

function SignInContent() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const supabase = createClient();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
        },
      });

      if (error) throw error;

      setStep('otp');
      toast.success('Check your email for the verification code!');
    } catch (error) {
      console.error('OTP error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) throw error;

      toast.success('Successfully signed in!');
      router.push(redirect);
      router.refresh();
    } catch (error) {
      console.error('Verify error:', error);
      toast.error(error instanceof Error ? error.message : 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (otp.length === 6 && step === 'otp' && !isLoading) {
      handleVerifyOTP({ preventDefault: () => {} } as React.FormEvent);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/6 via-primary/3 to-transparent blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-accent/6 blur-[120px]" />
      </div>

      <Card className="relative w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-display">Welcome back</CardTitle>
          <CardDescription className="text-base">
            {step === 'email'
              ? 'Enter your email to receive a verification code'
              : 'Enter the 6-digit code sent to your email'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-background border-border/60"
                    disabled={isLoading}
                    autoFocus
                    autoComplete="email"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base press-effect" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="space-y-4">
                <OTPInput 
                  value={otp} 
                  onChange={setOtp} 
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground text-center">
                  Code sent to <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>

              <Button type="submit" className="w-full h-12 text-base press-effect" disabled={isLoading || otp.length !== 6}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Verify & Sign In'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => {
                  setStep('email');
                  setOtp('');
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Use a different email
              </Button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-border/50 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
