import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, AppColors } from './colors';

type ThemeContextValue = { colors: AppColors; isDark: boolean };

const ThemeContext = createContext<ThemeContextValue>({ colors: lightColors, isDark: false });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  return <ThemeContext.Provider value={{ colors, isDark }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
