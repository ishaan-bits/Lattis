/**
 * Themed text primitive.
 *
 * Always prefer this over raw `Text` so type styles stay on the design scale.
 */

import { Text as RNText, type TextProps } from 'react-native';

import { colors, typography, type ColorName, type TypographyVariant } from '@/theme';

export type AppTextProps = Omit<TextProps, 'style'> & {
  /** Type scale variant. Defaults to `body`. */
  variant?: TypographyVariant;
  /** Semantic color token. Defaults to `text`. */
  color?: ColorName;
  style?: TextProps['style'];
};

export function Text({
  variant = 'body',
  color = 'text',
  style,
  ...rest
}: AppTextProps): React.JSX.Element {
  return <RNText style={[typography[variant], { color: colors[color] }, style]} {...rest} />;
}
