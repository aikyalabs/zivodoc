import { useContext } from 'react';

import { SessionContext, type SessionContextType } from '@src/lib/contexts/SessionContext';

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider.');
  }
  return context;
};
