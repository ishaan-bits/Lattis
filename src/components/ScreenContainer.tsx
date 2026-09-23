/**
 * ScreenContainer — standard screen chrome.
 *
 * Applies the dark background, safe-area insets, and optional horizontal
 * padding so screens only supply their content.
 */

import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

export type ScreenContainerProps = {
  children: React.ReactNode;
  /** Wrap content in a ScrollView. Defaults to `false`. */
  scroll?: boolean;
  /** Safe-area edges to respect. Defaults to top + sides. */
  edges?: Edge[];
  /** Horizontal screen padding. Defaults to `spacing.lg`. Set `0` to opt out. */
  horizontalPadding?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function ScreenContainer({
  children,
  scroll = false,
  edges = ['top', 'left', 'right'],
  horizontalPadding = spacing.lg,
  style,
  contentStyle,
}: ScreenContainerProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const padding: ViewStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingLeft: horizontalPadding + (edges.includes('left') ? insets.left : 0),
    paddingRight: horizontalPadding + (edges.includes('right') ? insets.right : 0),
    // Keep content clear of the home indicator when not scrolling.
    paddingBottom: edges.includes('bottom') ? insets.bottom : spacing.lg,
  };

  if (scroll) {
    return (
      <View style={[styles.root, style]}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, padding, contentStyle]}
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return <View style={[styles.root, padding, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
