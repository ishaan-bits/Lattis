/**
 * useTheme — access the global Lattis design tokens.
 *
 * The foundation ships a single dark theme; the hook exists so a future
 * theme switcher can be introduced without touching call sites.
 */

import { theme, type Theme } from '@/theme';

export function useTheme(): Theme {
  return theme;
}
