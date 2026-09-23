/**
 * Login screen — email + password authentication.
 */

import { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type TextInput,
} from 'react-native';
import { Link, router } from 'expo-router';

import { AuthButton, Input, useAuth } from '@/features/auth';
import { ScreenContainer, Text } from '@/components';
import { colors, radius, spacing } from '@/theme';

export default function LoginScreen(): React.JSX.Element {
  const { login, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const busyRef = useRef(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !busy && !loading;

  const onSubmit = useCallback(async () => {
    if (!canSubmit || busyRef.current) return;
    busyRef.current = true;
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Unable to sign in.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [canSubmit, login, email, password]);

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
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              placeholder="you@example.com"
              editable={!busy && !loading}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <Input
              ref={passwordRef}
              label="Password"
              value={password}
              onChangeText={setPassword}
              secure
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              placeholder="Your password"
              editable={!busy && !loading}
              onSubmitEditing={() => void onSubmit()}
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
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel="Forgot password"
                  disabled={busy || loading}
                  hitSlop={12}
                >
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
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Create account"
                disabled={busy || loading}
                hitSlop={12}
              >
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
