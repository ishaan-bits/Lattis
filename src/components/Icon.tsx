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
  'arrow.up': 'M12 19V5M5 12l7-7 7 7',
  magnifyingglass: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-4-4',
  xmark: 'M6 6l12 12M18 6L6 18',
  ellipsis: 'M5 12h.01M12 12h.01M19 12h.01',
  stop: 'M7 7h10v10H7z',
  sparkles:
    'M12 3l1.8 4.4L18 9l-4.2 1.6L12 15l-1.6-4.4L6 9l4.4-1.6zM18.5 14.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z',
  trash:
    'M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6',
  checkmark: 'M5 13l4 4L19 7',
  gobackward: 'M3.5 12a8.5 8.5 0 1 0 2.5-6M3.5 4.5V10H9',
  'doc.on.doc': 'M9 9h10v10H9zM5 15H4V5a1 1 0 0 1 1-1h10v1',
  scribble: 'M3 14c2-4 4 4 6 0s3.5-4 5.5-.5 3 2.5 6.5-1.5',
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
