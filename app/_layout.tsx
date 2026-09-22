/**
 * Root navigation layout.
 *
 * Wires the global providers once: gesture handler, safe areas, the dark
 * navigation theme, and a hidden-header stack for all routes.
 */

import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors, navigationTheme } from '@/theme';

/** Merge React Navigation's default dark theme with Lattis tokens. */
const theme = {
  ...DarkTheme,
  ...navigationTheme,
  colors: {
    ...DarkTheme.colors,
    ...navigationTheme.colors,
  },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider value={theme}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: styles.stackContent,
              animation: 'fade',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="splash" />
            <Stack.Screen name="threads" />
            <Stack.Screen name="(auth)/login" />
            <Stack.Screen name="(auth)/register" />
            <Stack.Screen name="(auth)/forgot-password" />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stackContent: {
    backgroundColor: colors.background,
  },
});
