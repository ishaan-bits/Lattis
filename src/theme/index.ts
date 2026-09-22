/**
 * Lattis design system — single import surface.
 *
 * ```ts
 * import { colors, spacing, typography } from '@/theme';
 * ```
 */

import { colors } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { fontFamily, typography } from './typography';

export * from './colors';
export * from './navigation';
export * from './radius';
export * from './shadows';
export * from './spacing';
export * from './typography';

/**
 * Global dark theme object. Lattis ships a single (dark) appearance;
 * light mode is intentionally not wired up in the foundation phase.
 */
export const theme = {
  colors,
  typography,
  fontFamily,
  spacing,
  radius,
  shadows,
} as const;

export type Theme = typeof theme;
