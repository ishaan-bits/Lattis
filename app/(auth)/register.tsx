/**
 * Register screen — create account with username, DOB, and password meter.
 */

import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Link, router } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type TextInput,
} from 'react-native';

import { ScreenContainer, Text } from '@/components';
import { AuthButton, getPasswordStrength, Input, useAuth } from '@/features/auth';
import { isValidUsername } from '@/services';
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

const MIN_PASSWORD_LENGTH = 8;

function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateOnly(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function RegisterScreen(): React.JSX.Element {
  const { register, loading } = useAuth();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const strengthIndex =
    strength === 'weak' ? 1 : strength === 'fair' ? 2 : strength === 'good' ? 3 : 4;

  const trimmedUsername = username.trim();
  const usernameFormatError =
    trimmedUsername.length > 0 && !isValidUsername(trimmedUsername)
      ? '3–20 characters: letters, numbers, underscores.'
      : null;
  const passwordError =
    password.length > 0 && password.length < MIN_PASSWORD_LENGTH
      ? `Use at least ${MIN_PASSWORD_LENGTH} characters.`
      : null;

  const canSubmit =
    name.trim().length > 0 &&
    isValidUsername(trimmedUsername) &&
    dateOfBirth !== null &&
    email.trim().length > 0 &&
    password.length >= MIN_PASSWORD_LENGTH &&
    password === confirm &&
    !busy &&
    !loading;

  const onDateChange = useCallback((event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    if (selected) {
      setDateOfBirth(selected);
    }
    setShowDatePicker(false);
  }, []);

  const onSubmit = useCallback(async () => {
    if (!canSubmit || !dateOfBirth || busyRef.current) return;
    busyRef.current = true;
    setError(null);
    setBusy(true);
    try {
      await register({
        fullName: name.trim(),
        username: trimmedUsername,
        dateOfBirth: toDateOnly(dateOfBirth),
        email: email.trim(),
        password,
      });
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Unable to create account.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [canSubmit, dateOfBirth, register, name, trimmedUsername, email, password]);

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
              returnKeyType="next"
              placeholder="Ada Lovelace"
              editable={!busy && !loading}
              onSubmitEditing={() => usernameRef.current?.focus()}
            />
            <Input
              ref={usernameRef}
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoComplete="username-new"
              textContentType="username"
              returnKeyType="next"
              placeholder="ada_lovelace"
              error={usernameFormatError}
              editable={!busy && !loading}
              onSubmitEditing={() => emailRef.current?.focus()}
            />

            <View style={styles.group}>
              <Text variant="label" color="textMuted" style={styles.label}>
                Date of birth
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Date of birth"
                disabled={busy || loading}
                onPress={() => setShowDatePicker(true)}
                style={[styles.field, showDatePicker && styles.fieldFocused]}
              >
                <Text variant="body" color={dateOfBirth ? 'text' : 'textMuted'}>
                  {dateOfBirth ? formatDateOnly(dateOfBirth) : 'Select your date of birth'}
                </Text>
              </Pressable>
              {showDatePicker ? (
                <DateTimePicker
                  value={dateOfBirth ?? new Date(2000, 0, 1)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  onChange={onDateChange}
                />
              ) : null}
              {showDatePicker && Platform.OS === 'ios' ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowDatePicker(false)}
                  style={styles.dateDone}
                >
                  <Text variant="bodyMedium" color="primary">
                    Done
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <Input
              ref={emailRef}
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
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
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              error={passwordError}
              editable={!busy && !loading}
              onSubmitEditing={() => confirmRef.current?.focus()}
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
              ref={confirmRef}
              label="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              secure
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              placeholder="Repeat password"
              error={confirm.length > 0 && password !== confirm ? 'Passwords do not match.' : null}
              editable={!busy && !loading}
              onSubmitEditing={() => {
                Keyboard.dismiss();
                void onSubmit();
              }}
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
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Sign in"
                disabled={busy || loading}
                hitSlop={12}
              >
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
    letterSpacing: -0.4,
  },
  form: {
    gap: spacing.md,
  },
  group: {
    gap: spacing.xs,
  },
  label: {
    marginLeft: spacing.xxs,
  },
  field: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  fieldFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
  },
  dateDone: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
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
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    borderRadius: radius.md,
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
