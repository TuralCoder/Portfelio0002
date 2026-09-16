import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'portfelio-theme';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    /* localStorage unavailable */
  }
  return null;
}

function systemTheme(): Theme {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

const initialStored = readStoredTheme();
const initialTheme: Theme = initialStored ?? systemTheme();

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', theme === 'dark' ? '#0b0d0b' : '#f6f7f1');
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const userSetRef = useRef(initialStored !== null);
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  useEffect(() => {
    applyTheme(theme);
    if (!userSetRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* localStorage unavailable */
    }
  }, [theme]);

  useEffect(() => {
    if (userSetRef.current) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      if (userSetRef.current) return;
      setThemeState(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setTheme = (next: Theme) => {
    userSetRef.current = true;
    setThemeState(next);
  };
  const toggleTheme = () => {
    userSetRef.current = true;
    setThemeState((t) => (t === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
