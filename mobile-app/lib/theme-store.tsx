import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colorScheme as nativewindColorScheme, vars } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, toCssVars, type ColorScheme, type ThemeColors } from '@/lib/theme';

// User's stored choice. `system` follows the OS appearance; `light`/`dark` force it.
export type ThemePreference = ColorScheme | 'system';

const STORAGE_KEY = 'theme-preference';

type ThemeState = {
  colors: ThemeColors;
  preference: ThemePreference;
  resolved: ColorScheme;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  // Load the persisted choice once on mount.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setPreferenceState(stored);
        }
      })
      .catch(() => {});
  }, []);

  // MONO THEME : le jeu est toujours en sombre.
  const resolved: ColorScheme = 'dark';

  // Keep NativeWind's own color scheme in sync so any `dark:` variants resolve too.
  useEffect(() => {
    nativewindColorScheme.set(resolved);
  }, [resolved]);

  const setPreference = () => {};

  const value = useMemo<ThemeState>(
    () => ({ colors: themes[resolved], preference, resolved, setPreference }),
    [resolved, preference]
  );

  return (
    <ThemeContext.Provider value={value}>
      {/* `vars()` swaps every `var(--color-*)` Tailwind token for descendants. */}
      <View style={vars(toCssVars(resolved))} className="flex-1 bg-background">
        <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
