/**
 * Forgot-password screen — send a reset link via Firebase.
 */

import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Link } from 'expo-router';

import { AuthButton, Input } from '@/features/auth';
import { ScreenContainer, Text } from '@/components';
import { authErrorMessage, resetPassword } from '@/services';
import { colors, spacing } from '@/theme';

export default function ForgotPasswordScreen(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = email.trim().length > 0 && !busy;

  async function onSubmit() {
    if (!canSubmit) return;
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      await resetPassword(email.trim());
      setSuccess('Password reset email sent. Check your inbox.');
    } catch (err) {
      setError(authErrorMessage(err));
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
              Reset password
            </Text>
            <Text variant="body" color="textSecondary">
              Enter your email and we&apos;ll send a reset link.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              placeholder="you@example.com"
              editable={!busy}
            />

            {error ? (
              <View style={styles.errorBox} accessibilityRole="alert">
                <Text variant="caption" color="danger">
                  {error}
                </Text>
              </View>
            ) : null}

            {success ? (
              <View style={styles.successBox} accessibilityRole="alert">
                <Text variant="caption" color="success">
                  {success}
                </Text>
              </View>
            ) : null}

            <AuthButton
              label="Send reset link"
              loading={busy}
              disabled={!canSubmit}
              onPress={() => void onSubmit()}
            />
          </View>

          <View style={styles.footer}>
            <Link href="/login" asChild>
              <Pressable accessibilityRole="link" disabled={busy}>
                <Text variant="bodyMedium" color="primary">
                  Back to sign in
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
  errorBox: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderColor: colors.danger,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  successBox: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: colors.success,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
});
