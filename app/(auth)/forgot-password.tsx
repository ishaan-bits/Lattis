/**
 * Forgot-password screen — send a reset link via Firebase.
 */

import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type TextInput,
} from 'react-native';
import { Link } from 'expo-router';

import { AuthButton, Input } from '@/features/auth';
import { ScreenContainer, Text } from '@/components';
import { resetPassword, resetPasswordErrorMessage } from '@/services';
import { colors, radius, spacing } from '@/theme';

export default function ForgotPasswordScreen(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const emailRef = useRef<TextInput>(null);

  const canSubmit = email.trim().length > 0 && !busy;

  async function onSubmit() {
    if (!canSubmit || busyRef.current) return;
    busyRef.current = true;
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      await resetPassword(email.trim());
      setSuccess('Password reset email sent. Check your inbox.');
    } catch (err) {
      setSuccess(null);
      setError(resetPasswordErrorMessage(err));
    } finally {
      busyRef.current = false;
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
              ref={emailRef}
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
                setSuccess(null);
              }}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="go"
              placeholder="you@example.com"
              editable={!busy}
              onSubmitEditing={() => void onSubmit()}
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
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Back to sign in"
                disabled={busy}
                hitSlop={12}
              >
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
    letterSpacing: -0.4,
  },
  form: {
    gap: spacing.md,
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  successBox: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
});
