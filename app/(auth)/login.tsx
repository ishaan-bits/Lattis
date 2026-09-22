/**
 * Login screen — email + password authentication.
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
import { Link, router } from 'expo-router';

import { AuthButton, Input, useAuth } from '@/features/auth';
import { ScreenContainer, Text } from '@/components';
import { colors, spacing } from '@/theme';

export default function LoginScreen(): React.JSX.Element {
  const { login, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !busy && !loading;

  async function onSubmit() {
    if (!canSubmit) return;
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
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
              Welcome back
            </Text>
            <Text variant="body" color="textSecondary">
              Sign in to continue to Lattis.
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
              editable={!busy && !loading}
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secure
              autoComplete="password"
              textContentType="password"
              placeholder="Your password"
              editable={!busy && !loading}
            />

            {error ? (
              <View style={styles.errorBox} accessibilityRole="alert">
                <Text variant="caption" color="danger">
                  {error}
                </Text>
              </View>
            ) : null}

            <View style={styles.rowEnd}>
              <Link href="/forgot-password" asChild>
                <Pressable accessibilityRole="link" disabled={busy || loading} hitSlop={8}>
                  <Text variant="bodyMedium" color="primary">
                    Forgot password?
                  </Text>
                </Pressable>
              </Link>
            </View>

            <AuthButton
              label="Continue"
              loading={busy || loading}
              disabled={!canSubmit}
              onPress={() => void onSubmit()}
            />
          </View>

          <View style={styles.footer}>
            <Text variant="body" color="textSecondary">
              Don&apos;t have an account?{' '}
            </Text>
            <Link href="/register" asChild>
              <Pressable accessibilityRole="link" disabled={busy || loading}>
                <Text variant="bodyMedium" color="primary">
                  Create account
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
  rowEnd: {
    alignItems: 'flex-end',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
});
