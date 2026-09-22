/**
 * Register screen — create account with password strength meter.
 */

import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Link, router } from 'expo-router';

import { AuthButton, getPasswordStrength, Input, useAuth } from '@/features/auth';
import { ScreenContainer, Text } from '@/components';
import { colors, radius, spacing } from '@/theme';

const strengthColor: Record<string, string> = {
  weak: colors.danger,
  fair: colors.warning,
  good: colors.accent,
  strong: colors.success,
};

const strengthLabel: Record<string, string> = {
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
};

export default function RegisterScreen(): React.JSX.Element {
  const { register, loading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const strengthIndex =
    strength === 'weak' ? 1 : strength === 'fair' ? 2 : strength === 'good' ? 3 : 4;

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    password === confirm &&
    !busy &&
    !loading;

  async function onSubmit() {
    if (!canSubmit) return;
    setError(null);
    setBusy(true);
    try {
      await register(name.trim(), email.trim(), password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text variant="title" style={styles.title}>
              Create account
            </Text>
            <Text variant="body" color="textSecondary">
              Start building your second brain.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              placeholder="Ada Lovelace"
              editable={!busy && !loading}
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              placeholder="you@example.com"
              editable={!busy && !loading}
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secure
              autoComplete="new-password"
              textContentType="newPassword"
              placeholder="At least 6 characters"
              editable={!busy && !loading}
            />

            <View style={styles.strengthRow}>
              <View style={styles.strengthTrack} accessibilityRole="progressbar">
                {[0, 1, 2, 3].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.strengthSegment,
                      index < strengthIndex && {
                        backgroundColor: strengthColor[strength] ?? colors.border,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text variant="caption" color={strength === 'weak' ? 'danger' : 'textSecondary'}>
                {strengthLabel[strength]}
              </Text>
            </View>

            <Input
              label="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              secure
              autoComplete="new-password"
              textContentType="newPassword"
              placeholder="Repeat password"
              error={confirm.length > 0 && password !== confirm ? 'Passwords do not match.' : null}
              editable={!busy && !loading}
            />

            {error ? (
              <View style={styles.errorBox} accessibilityRole="alert">
                <Text variant="caption" color="danger">
                  {error}
                </Text>
              </View>
            ) : null}

            <AuthButton
              label="Create account"
              loading={busy || loading}
              disabled={!canSubmit}
              onPress={() => void onSubmit()}
            />
          </View>

          <View style={styles.footer}>
            <Text variant="body" color="textSecondary">
              Already have an account?{' '}
            </Text>
            <Link href="/login" asChild>
              <Pressable accessibilityRole="link" disabled={busy || loading}>
                <Text variant="bodyMedium" color="primary">
                  Sign in
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.xl,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    letterSpacing: -0.5,
  },
  form: {
    gap: spacing.md,
  },
  strengthRow: {
    gap: spacing.xs,
  },
  strengthTrack: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  errorBox: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderColor: colors.danger,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
});
