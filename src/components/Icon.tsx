/**
 * Icon — thin wrapper that normalizes glyph size, color, and hit area.
 *
 * Uses SF Symbols on iOS (via `expo-symbols`) and renders a react-native-svg
 * fallback elsewhere, so call sites stay platform-agnostic.
 */

import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme';

export type IconProps = {
  /** SF Symbol name (iOS) — also selects the fallback glyph. */
  name: SFSymbol;
  size?: number;
  /** Tint color. Defaults to theme text. */
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/** Minimal vector stand-ins for symbols on Android/web. */
const FALLBACK_PATHS: Partial<Record<SFSymbol, string>> = {
  'square.stack': 'M4 4h16v16H4zM8 8h16v16H8z',
  plus: 'M12 5v14M5 12h14',
  folder: 'M3 6h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  'chevron.right': 'M9 6l6 6-6 6',
  'chevron.left': 'M15 6l-6 6 6 6',
  magnifyingglass: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-4-4',
  xmark: 'M6 6l12 12M18 6L6 18',
};

const DEFAULT_FALLBACK = 'M4 4h16v16H4z';

export function Icon({
  name,
  size = 20,
  color = colors.text,
  style,
}: IconProps): React.JSX.Element {
  const fallbackPath = FALLBACK_PATHS[name] ?? DEFAULT_FALLBACK;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[styles.box, { width: size, height: size }, style]}
    >
      <SymbolView
        name={name}
        size={size}
        tintColor={color}
        fallback={
          <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path
              d={fallbackPath}
              stroke={color}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
