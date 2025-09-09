import React, { createContext, useContext, useEffect } from 'react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { useUserSettings } from '@/hooks/use-user-settings';
import { useTheme as useNextTheme } from 'next-themes';

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSetting, saveSettings } = useUserSettings();

  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeProviderInner>
        {children}
      </ThemeProviderInner>
    </NextThemeProvider>
  );
}

function ThemeProviderInner({ children }: { children: React.ReactNode }) {
  const { setTheme: setNextTheme } = useNextTheme();
  const { settings, updateSetting, saveSettings } = useUserSettings();

  const setTheme = async (newTheme: string) => {
    updateSetting('theme', newTheme);
    setNextTheme(newTheme);
    await saveSettings({ theme: newTheme });
  };

  // Sync user settings theme with next-themes
  useEffect(() => {
    if (settings.theme) {
      setNextTheme(settings.theme);
    }
  }, [settings.theme, setNextTheme]);

  return (
    <ThemeContext.Provider value={{ theme: settings.theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}