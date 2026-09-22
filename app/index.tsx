/**
 * Home — authenticated landing screen (foundation phase).
 *
 * Shows the Lattis brand mark and an empty "Projects" state until the
 * projects feature lands.
 */

import { Redirect } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

import { Card, ScreenContainer, Text } from '@/components';
import { useAuth } from '@/features/auth';
import { spacing } from '@/theme';

export default function HomeScreen(): React.JSX.Element {
  const { initialized, user, loading } = useAuth();

  if (!initialized && loading) {
    return <Redirect href="/splash" />;
  }

  if (initialized && !user) {
    return <Redirect href="/login" />;
  }

  return (
    <ScreenContainer>
      <View style={styles.hero}>
        <Image
          source={require('../assets/images/icon.png')}
          style={styles.logo}
          accessibilityLabel="Lattis logo"
        />
        <Text variant="title" style={styles.brand}>
          Lattis
        </Text>
        <Text variant="body" color="textSecondary" style={styles.tagline}>
          A visual thinking workspace
        </Text>
      </View>

      <View style={styles.section}>
        <Text variant="label" color="textMuted" style={styles.sectionTitle}>
          Projects
        </Text>

        <Card style={styles.emptyCard}>
          <Text variant="subtitle" style={styles.emptyTitle}>
            No projects yet
          </Text>
          <Text variant="body" color="textSecondary" style={styles.emptyBody}>
            Projects you create will appear here, ready to open on your canvas.
          </Text>
        </Card>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
    marginBottom: spacing.sm,
  },
  brand: {
    letterSpacing: -0.5,
  },
  tagline: {
    textAlign: 'center',
  },
  section: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    marginLeft: spacing.xxs,
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyBody: {
    textAlign: 'center',
    maxWidth: 280,
  },
});
