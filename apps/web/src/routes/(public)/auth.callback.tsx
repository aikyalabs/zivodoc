import { useEffect } from 'react';
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { useSession } from '@src/hooks/useSession';

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute('/(public)/auth/callback')({
  validateSearch: searchSchema,
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const { signIn } = useSession();
  const { token } = useSearch({ from: '/(public)/auth/callback' });

  useEffect(() => {
    if (token) {
      signIn();
      navigate({ to: '/dashboard' });
    } else {
      navigate({ to: '/login' });
    }
  }, [token, signIn, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="mx-auto size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
