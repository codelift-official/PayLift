import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';

const COOKIE_NAME = 'billify_theme';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function getCookieTheme(): Theme {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  const val = match?.[1];
  return val === 'dark' ? 'dark' : 'light';
}

function setCookieTheme(theme: Theme) {
  document.cookie = `${COOKIE_NAME}=${theme};max-age=${COOKIE_MAX_AGE};path=/;SameSite=Lax`;
}

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => getCookieTheme());

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    setCookieTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
