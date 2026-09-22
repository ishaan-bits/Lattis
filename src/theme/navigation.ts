/**
 * React Navigation theme derived from the Lattis dark palette.
 *
 * Passed to Expo Router's `ThemeProvider` so stack backgrounds, headers,
 * and gestures match the design system.
 */

import type { Theme as NavigationTheme } from 'expo-router';

import { colors } from './colors';
import { fontFamily } from './typography';

export const navigationTheme: NavigationTheme = {
  dark: true,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
  fonts: {
    regular: { fontFamily: fontFamily.regular, fontWeight: '400' },
    medium: { fontFamily: fontFamily.medium, fontWeight: '500' },
    bold: { fontFamily: fontFamily.regular, fontWeight: '700' },
    heavy: { fontFamily: fontFamily.regular, fontWeight: '800' },
  },
};
