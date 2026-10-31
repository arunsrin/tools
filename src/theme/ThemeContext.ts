import { createContext, useContext } from 'react';
import type { ThemeContextType } from './types';

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useTheme = (): ThemeContextType => useContext(ThemeContext);
