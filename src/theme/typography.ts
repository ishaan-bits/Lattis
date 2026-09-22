/**
 * Type scale for Lattis.
 *
 * Uses platform system fonts by default (zero network cost, native metrics).
 * Drop custom faces into `assets/fonts/` and register them with `expo-font`
 * when brand fonts are introduced — then point `fontFamily` here at them.
 */

import { Platform, type TextStyle } from 'react-native';

const systemFontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

const systemFontFamilyMedium = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
});

export const fontFamily = {
  regular: systemFontFamily,
  medium: systemFontFamilyMedium,
} as const;

export const typography = {
  /** Hero / marketing display. */
  display: {
    fontFamily: fontFamily.regular,
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  /** Screen titles. */
  title: {
    fontFamily: fontFamily.regular,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  /** Section headers. */
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  /** Default reading text. */
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  /** Emphasized reading text. */
  bodyMedium: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  /** Dense supporting text. */
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  /** Uppercase-friendly micro label. */
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
