import React, { createContext, useContext, useEffect } from 'react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { useUserSettings } from '@/hooks/use-user-settings';

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSetting, saveSettings } = useUserSettings();

  const setTheme = async (newTheme: string) => {
    updateSetting('theme', newTheme);
    await saveSettings({ theme: newTheme });
  };

  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme={settings.theme}
      enableSystem
      disableTransitionOnChange
    >
      <ThemeContext.Provider value={{ theme: settings.theme, setTheme }}>
        {children}
      </ThemeContext.Provider>
    </NextThemeProvider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}