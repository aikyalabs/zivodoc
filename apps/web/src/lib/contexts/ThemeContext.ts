import { createContext } from 'react';

export type Theme = 'dark' | 'light' | 'system';

export const THEME_STORAGE_KEY = 'theme';
export const DEFAULT_THEME: Theme = 'system';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);
