/**
 * Auth feature — shared components, hooks, and password helpers.
 */

export { AuthButton, type AuthButtonProps } from './components/AuthButton';
export { Input, type InputProps } from './components/Input';
export { useAuth } from './hooks/useAuth';

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

/** Score a password for the register strength meter (weak → strong). */
export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) return 'weak';

  let score = 0;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score === 0) return 'weak';
  if (score <= 2) return 'fair';
  if (score <= 3) return 'good';
  return 'strong';
}
