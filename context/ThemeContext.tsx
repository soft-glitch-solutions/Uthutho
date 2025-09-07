import React, { createContext, useContext } from 'react';

interface ThemeContextType {
  isDark: boolean;
  colors: {
    primary: string;
    background: string;
    text: string;
    card: string;
    border: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always dark mode
  const isDark = true;

  const colors = {
    primary: '#1ea2b1',
    background: '#000000',
    text: '#ffffff',
    card: '#1c1c1c',
    border: '#333333',
  };

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        colors,
      }}>
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