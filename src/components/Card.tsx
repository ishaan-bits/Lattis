/**
 * Card — elevated surface for grouping content.
 */

import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing } from '@/theme';

export type CardProps = ViewProps & {
  /** Remove default padding (e.g. for media-filled cards). */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export function Card({ padded = true, style, children, ...rest }: CardProps): React.JSX.Element {
  return (
    <View style={[styles.card, padded && styles.padded, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.sm,
  },
  padded: {
    padding: spacing.lg,
  },
});
