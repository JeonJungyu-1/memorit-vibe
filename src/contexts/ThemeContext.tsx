import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { TamaguiProvider } from 'tamagui';
import {
  getThemeMode,
  setThemeMode as persistThemeMode,
  type ThemeMode,
} from '../utils/themeSettings';

export type ResolvedTheme = 'light' | 'dark';

type ThemeContextValue = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  resolvedTheme: ResolvedTheme;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useThemeMode(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeMode must be used within ThemeProvider');
  }
  return ctx;
}

type ThemeProviderProps = {
  children: React.ReactNode;
  tamaguiConfig: import('tamagui').TamaguiInternalConfig;
};

export function ThemeProvider({ children, tamaguiConfig }: ThemeProviderProps): React.ReactElement {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    getThemeMode().then(setThemeModeState);
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    await persistThemeMode(mode);
    setThemeModeState(mode);
  }, []);

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, systemColorScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ themeMode, setThemeMode, resolvedTheme }),
    [themeMode, setThemeMode, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme={resolvedTheme}>
        {children}
      </TamaguiProvider>
    </ThemeContext.Provider>
  );
}
