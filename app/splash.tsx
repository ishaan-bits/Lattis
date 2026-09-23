/**
 * Splash — animated brand gate that routes by auth state.
 */

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components';
import { useAuth } from '@/features/auth';
import { colors, spacing } from '@/theme';

const ANIMATION_MS = 650;
const MIN_SPLASH_MS = 1400;

export default function SplashScreen(): React.JSX.Element {
  const { initialized, user, initialize, loading, authLoading } = useAuth();

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);

  const brandStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    const config = { duration: ANIMATION_MS, easing: Easing.out(Easing.cubic) };
    // Shared-value mutation is intentional for Reanimated; React Compiler doesn't track it.
    // eslint-disable-next-line react-hooks/immutability
    opacity.value = withDelay(80, withTiming(1, config));
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withDelay(80, withTiming(1, config));
  }, [opacity, scale]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (authLoading || !initialized || loading) return;

    const timer = setTimeout(() => {
      router.replace(user ? '/' : '/login');
    }, MIN_SPLASH_MS);

    return () => clearTimeout(timer);
  }, [authLoading, initialized, loading, user]);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.brand, brandStyle]}>
        <Text variant="display" style={styles.wordmark}>
          Lattis
        </Text>
        <Text variant="body" color="textSecondary" style={styles.tagline}>
          Your second brain
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  brand: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  wordmark: {
    letterSpacing: -1,
  },
  tagline: {
    letterSpacing: 0.4,
  },
});
