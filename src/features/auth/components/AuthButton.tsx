/**
 * Primary CTA for auth screens — full-width Button with loading wiring.
 */

import { Button, type ButtonProps } from '@/components';

export type AuthButtonProps = Pick<
  ButtonProps,
  'label' | 'loading' | 'disabled' | 'onPress' | 'variant' | 'size'
> & {
  fullWidth?: boolean;
};

export function AuthButton({
  label,
  loading = false,
  disabled = false,
  onPress,
  variant = 'primary',
  size = 'lg',
  fullWidth = true,
}: AuthButtonProps): React.JSX.Element {
  return (
    <Button
      label={label}
      loading={loading}
      disabled={disabled}
      onPress={onPress}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
    />
  );
}
