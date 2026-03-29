import { createContext } from 'react';

export const SESSION_TOKEN_STORAGE_KEY = 'session-token';

export type SessionSignInFunction = (token: string) => void;
export type SessionSignOutFunction = (timeout?: boolean) => void;

export interface SessionContextType {
  verified: boolean;
  signIn: SessionSignInFunction;
  signOut: SessionSignOutFunction;
}

export const SessionContext = createContext<SessionContextType | null>(null);
