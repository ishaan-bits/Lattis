/**
 * Spacing scale (4pt grid).
 *
 * Use these tokens instead of magic numbers so rhythm stays consistent
 * across screens and components.
 */

export const spacing = {
  /** 4 — icon gaps, tight inline spacing. */
  xxs: 4,
  /** 8 — compact padding. */
  xs: 8,
  /** 12 — default inner padding. */
  sm: 12,
  /** 16 — standard padding / stack gap. */
  md: 16,
  /** 24 — section padding. */
  lg: 24,
  /** 32 — screen horizontal margin. */
  xl: 32,
  /** 40 — large section gap. */
  xxl: 40,
  /** 56 — hero spacing. */
  xxxl: 56,
} as const;

export type SpacingToken = keyof typeof spacing;
