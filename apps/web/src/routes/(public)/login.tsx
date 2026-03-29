import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@src/components/atoms/button';
import { Input } from '@src/components/atoms/input';
import { Label } from '@src/components/atoms/label';
import { Separator } from '@src/components/atoms/separator';
import { useSession } from '@src/hooks/useSession';
import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { ApiOkResponse } from '@template/shared';

export const Route = createFileRoute('/(public)/login')({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiClient.post<ApiOkResponse<{ token: string }>>(
        '/auth/login',
        credentials,
      );
      return response.data.payload.token;
    },
    onSuccess: (token) => {
      signIn(token);
      navigate({ to: '/dashboard' });
    },
    onError: () => {
      toast.error('Invalid email or password.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email: email.trim(), password });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side — form */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Welcome Back!</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loginMutation.isPending}>
              {loginMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <a
              href="#"
              className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>

      {/* Right side — decorative gradient panel */}
      <div className="hidden lg:block lg:w-1/2">
        <div
          className="h-full w-full"
          style={{
            background:
              'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 25%, #f0f4ff 40%, #fdf2f8 60%, #fce7f3 75%, #fef3c7 100%)',
          }}
        />
      </div>
    </div>
  );
}
