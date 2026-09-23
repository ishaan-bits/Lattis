/**
 * Button — primary interaction control.
 *
 * Variants: primary (filled), secondary (tinted), ghost (bare).
 * Handles disabled + loading states; keeps hit target ≥ 44pt.
 */

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Text } from '@/components/Text';
import { colors, radius, spacing } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

const heightBySize: Record<ButtonSize, number> = {
  sm: 36,
  md: 44,
  lg: 52,
};

const baseStyles: ViewStyle = {
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: spacing.lg,
  borderRadius: radius.md,
  flexDirection: 'row',
};

const restingStyles: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primarySoft },
  ghost: { backgroundColor: colors.transparent },
};

const pressedStyles: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.primaryPressed },
  secondary: { backgroundColor: colors.primarySoftPressed },
  ghost: { backgroundColor: colors.surface },
};

const disabledStyle: ViewStyle = { opacity: 0.45 };

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps): React.JSX.Element {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        baseStyles,
        restingStyles[variant],
        { height: heightBySize[size] },
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && pressedStyles[variant],
        isDisabled && disabledStyle,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.textInverse : colors.primary}
          size="small"
        />
      ) : (
        <Text
          color={variant === 'primary' ? 'textInverse' : 'primary'}
          variant={size === 'lg' ? 'bodyMedium' : 'body'}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    alignSelf: 'stretch',
  },
});
