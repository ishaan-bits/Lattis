/**
 * Border radius tokens.
 *
 * `full` is for pills and circles (use with square dimensions).
 */

export const radius = {
  /** Small controls — inputs, chips. */
  sm: 8,
  /** Buttons. */
  md: 12,
  /** Cards. */
  lg: 16,
  /** Sheets, modals, hero blocks. */
  xl: 24,
  /** Extra-large feature panels. */
  xxl: 32,
  /** Pill / circle. */
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;
