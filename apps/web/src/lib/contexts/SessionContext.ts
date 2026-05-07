import { createContext } from 'react';

export type SessionSignInFunction = () => void;
export type SessionSignOutFunction = (timeout?: boolean) => void;

export interface SessionContextType {
  verified: boolean;
  signIn: SessionSignInFunction;
  signOut: SessionSignOutFunction;
}

export const SessionContext = createContext<SessionContextType | null>(null);
