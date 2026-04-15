import { ComponentType, PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { SessionContext, SESSION_TOKEN_STORAGE_KEY } from '@src/lib/contexts/SessionContext';
import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { ApiOkResponse } from '@zivodoc/shared';

export const SessionProvider: ComponentType<PropsWithChildren> = ({ children }) => {
  const queryClient = useQueryClient();
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  const signIn = useCallback((token: string) => {
    localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token);
    setVerified(true);
  }, []);

  const signOut = useCallback(
    (timeout?: boolean) => {
      const token = localStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
      if (token && !timeout) {
        apiClient.delete('/auth').catch(() => {});
      }
      localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
      setVerified(false);
      queryClient.clear();
    },
    [queryClient],
  );

  useEffect(() => {
    const token = localStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    apiClient
      .get<ApiOkResponse<{ expiresAt: string | null }>>('/auth')
      .then((res) => {
        if (res.data.payload.expiresAt) {
          setVerified(true);
        } else {
          localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
        }
      })
      .catch(() => {
        localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SessionContext.Provider value={{ verified, signIn, signOut }}>
      {children}
    </SessionContext.Provider>
  );
};
