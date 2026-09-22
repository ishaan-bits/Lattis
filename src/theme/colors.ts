/**
 * Lattis color palette — global dark theme.
 *
 * Single source of truth for every color used in the app. Prefer semantic
 * names (surface, textSecondary) over literal ones so themes can evolve
 * without rewriting call sites.
 */

export const colors = {
  /** App background — deepest layer. */
  background: '#0B0F14',
  /** Default card / sheet surface. */
  surface: '#121820',
  /** Raised surface (modals, popovers, pressed cards). */
  surfaceElevated: '#1A222D',
  /** Hairline borders and dividers. */
  border: '#243040',
  /** Softer separators inside surfaces. */
  borderSubtle: '#1B2431',

  /** Primary text. */
  text: '#F5F7FA',
  /** Secondary text — descriptions, meta. */
  textSecondary: '#9AA6B8',
  /** Tertiary text — placeholders, hints. */
  textMuted: '#6B7688',
  /** Text on top of primary/accent fills. */
  textInverse: '#0B0F14',

  /** Brand / interactive accent. */
  primary: '#3B82F6',
  /** Primary pressed state. */
  primaryPressed: '#2563EB',
  /** Low-emphasis primary wash (selected rows, chips). */
  primarySoft: 'rgba(59, 130, 246, 0.16)',
  /** Secondary accent for highlights. */
  accent: '#38BDF8',

  /** Semantic feedback. */
  danger: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',

  /** Scrim behind dialogs / sheets. */
  overlay: 'rgba(0, 0, 0, 0.6)',
  transparent: 'transparent',
} as const;

export type ColorName = keyof typeof colors;
