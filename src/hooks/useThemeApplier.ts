import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

/**
 * Hook that applies the current theme to the document root.
 * Use this in any component that needs to ensure the theme is applied on mount.
 *
 * @returns The current theme value and cycleTheme function
 */
export function useThemeApplier() {
  const theme = useStore((state) => state.theme);
  const cycleTheme = useStore((state) => state.cycleTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      // System mode - remove attribute so media query takes over
      root.removeAttribute('data-theme');
    }
  }, [theme]);

  return { theme, cycleTheme };
}

/**
 * Get the icon for the current theme
 */
export function getThemeIcon(theme: 'light' | 'dark' | 'system'): string {
  switch (theme) {
    case 'light': return '\u2600'; // Sun
    case 'dark': return '\u263D'; // Moon
    default: return '\u2699'; // Gear (system)
  }
}

/**
 * Get the title/tooltip for the current theme
 */
export function getThemeTitle(theme: 'light' | 'dark' | 'system'): string {
  switch (theme) {
    case 'light': return 'Light mode (click for dark)';
    case 'dark': return 'Dark mode (click for system)';
    default: return 'System theme (click for light)';
  }
}
