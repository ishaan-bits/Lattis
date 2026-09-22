/**
 * Elevation shadows.
 *
 * iOS uses shadow* props; Android uses `elevation` (shadowColor is ignored
 * there on the new architecture). Always spread these onto styles — never
 * hand-roll elevation.
 */

import { Platform, type ViewStyle } from 'react-native';

import { colors } from './colors';

const shadowColor = colors.background;

export const shadows = {
  /** Barely lifted — cards at rest. */
  sm: Platform.select<ViewStyle>({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    android: { elevation: 2 },
    default: {},
  })!,
  /** Standard lift — floating elements. */
  md: Platform.select<ViewStyle>({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
    default: {},
  })!,
  /** Strong lift — sheets, menus. */
  lg: Platform.select<ViewStyle>({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.36,
      shadowRadius: 20,
    },
    android: { elevation: 8 },
    default: {},
  })!,
} as const;

export type ShadowToken = keyof typeof shadows;
