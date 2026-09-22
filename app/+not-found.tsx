/**
 * Not-found fallback for unmatched routes.
 */

import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer, Text } from '@/components';
import { colors, spacing } from '@/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <ScreenContainer style={styles.container}>
        <View style={styles.content}>
          <Text variant="title" style={styles.title}>
            This screen doesn&apos;t exist.
          </Text>
          <Link href="/" style={styles.link}>
            <Text variant="bodyMedium" color="primary">
              Open the home screen
            </Text>
          </Link>
        </View>
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  title: {
    textAlign: 'center',
  },
  link: {
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
});
