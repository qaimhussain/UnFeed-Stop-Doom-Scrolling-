import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { ThemeColors, lightColors, darkColors } from './colors';
import { typography } from './typography';
import { spacing, layout } from './spacing';
import { ThemeMode } from '../types';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  typography: typeof typography;
  spacing: typeof spacing;
  layout: typeof layout;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
  themeMode: 'system',
  setThemeMode: () => {},
  typography,
  spacing,
  layout,
});

interface ThemeProviderProps {
  children: React.ReactNode;
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  themeMode,
  onThemeModeChange,
}) => {
  const systemColorScheme = useRNColorScheme();

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  const colors = useMemo(() => {
    return isDark ? darkColors : lightColors;
  }, [isDark]);

  const value = useMemo(
    () => ({
      colors,
      isDark,
      themeMode,
      setThemeMode: onThemeModeChange,
      typography,
      spacing,
      layout,
    }),
    [colors, isDark, themeMode, onThemeModeChange]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
