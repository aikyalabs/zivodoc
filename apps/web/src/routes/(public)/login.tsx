import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@src/components/atoms/button';
import { Input } from '@src/components/atoms/input';
import { Label } from '@src/components/atoms/label';
import { Separator } from '@src/components/atoms/separator';
import { useSession } from '@src/hooks/useSession';
import { API_URL, apiClient } from '@src/lib/queries/defaultQueryFn';
import { trackEvent } from '@src/lib/analytics';

import type { ApiOkResponse } from '@zivodoc/shared';

export const Route = createFileRoute('/(public)/login')({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useSession();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  const sendOtpMutation = useMutation({
    mutationFn: async (email: string) => {
      await apiClient.post('/auth/otp/send', { email });
    },
    onSuccess: () => {
      setStep('otp');
      toast.success('Code sent! Check your email.');
    },
    onError: () => {
      toast.error('Failed to send code. Try again.');
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (data: { email: string; code: string }) => {
      const response = await apiClient.post<ApiOkResponse<{ token: string; isNew: boolean }>>(
        '/auth/otp/verify',
        data,
      );
      return response.data.payload;
    },
    onSuccess: ({ isNew }) => {
      if (isNew) trackEvent('sign_up', { method: 'email_otp' });
      signIn();
      navigate({ to: '/dashboard' });
    },
    onError: () => {
      toast.error('Invalid or expired code.');
    },
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendOtpMutation.mutate(email.trim());
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyOtpMutation.mutate({ email: email.trim(), code: code.trim() });
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side — form */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              {step === 'email' ? 'Welcome to zivodoc' : 'Check your email'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {step === 'email'
                ? 'Sign in to start scanning your docs'
                : `We sent a 6-digit code to ${email}`}
            </p>
          </div>

          {step === 'email' ? (
            <>
              {/* Google OAuth */}
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleGoogleSignIn}
              >
                <svg className="mr-2 size-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Email OTP */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@company.com"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={sendOtpMutation.isPending}
                >
                  {sendOtpMutation.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 size-4" />
                  )}
                  {sendOtpMutation.isPending ? 'Sending code...' : 'Send sign-in code'}
                </Button>
              </form>
            </>
          ) : (
            <>
              {/* OTP verification */}
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Verification code</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    required
                    placeholder="000000"
                    autoFocus
                    className="text-center text-2xl tracking-[0.5em]"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={verifyOtpMutation.isPending || code.length !== 6}
                >
                  {verifyOtpMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify & sign in'}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Didn&apos;t receive a code?{' '}
                <button
                  type="button"
                  onClick={() => sendOtpMutation.mutate(email.trim())}
                  disabled={sendOtpMutation.isPending}
                  className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                >
                  Resend
                </button>
              </p>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                }}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
              >
                ← Use a different email
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right side — dark branded panel */}
      <div className="hidden lg:block lg:w-1/2">
        <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-950 px-12">
          <div className="max-w-md space-y-6">
            <svg width="48" height="32" viewBox="0 0 480 320" fillRule="evenodd">
              <path
                d="M160,160 m-140,0 a140,140 0 1,0 280,0 a140,140 0 1,0 -280,0 M320,160 m-140,0 a140,140 0 1,0 280,0 a140,140 0 1,0 -280,0"
                fill="white"
              />
            </svg>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Your docs are broken.
              <br />
              <span className="text-zinc-500">We fix them.</span>
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              zivodoc scans your documentation for broken code examples, stale API references, and
              dead links — then opens PRs to fix them. Automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
