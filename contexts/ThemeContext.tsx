'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';

/**
 * Available theme options
 */
type Theme = 'light' | 'dark';

/**
 * Theme context shape
 */
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Storage key for persisting theme preference
 */
const THEME_STORAGE_KEY = 'theme';

/**
 * Type guard to validate theme value
 *
 * Ensures localStorage values are valid before using them.
 * This prevents issues from corrupted or manually edited localStorage.
 *
 * @param value - Value to check
 * @returns True if value is a valid Theme
 */
function isValidTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

/**
 * Get theme from localStorage with validation
 *
 * @returns Valid theme or null if not found/invalid
 */
function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isValidTheme(stored)) {
      return stored;
    }
    return null;
  } catch {
    // localStorage may be disabled or blocked
    return null;
  }
}

/**
 * Save theme to localStorage
 *
 * @param theme - Theme to save
 */
function saveTheme(theme: Theme): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage may be disabled or blocked
    console.warn('Unable to save theme preference to localStorage');
  }
}

/**
 * Apply theme to document
 *
 * @param theme - Theme to apply
 */
function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.toggle('dark', theme === 'dark');
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

/**
 * Theme provider component
 *
 * Manages theme state and persistence.
 * Applies theme class to document root for CSS variable switching.
 *
 * @example
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 *
 * @example with default theme
 * <ThemeProvider defaultTheme="dark">
 *   <App />
 * </ThemeProvider>
 */
export function ThemeProvider({
  children,
  defaultTheme = 'light',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true);

    const storedTheme = getStoredTheme();
    if (storedTheme) {
      setTheme(storedTheme);
      applyTheme(storedTheme);
    } else {
      // Apply default theme
      applyTheme(defaultTheme);
    }
  }, [defaultTheme]);

  // Toggle theme function - memoized for stable reference
  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => {
      const newTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
      saveTheme(newTheme);
      applyTheme(newTheme);
      return newTheme;
    });
  }, []);

  // Prevent flash of unstyled content
  // Returns null until client-side hydration is complete
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 *
 * @returns Theme context value
 * @throws Error if used outside ThemeProvider
 *
 * @example
 * const { theme, toggleTheme } = useTheme();
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
