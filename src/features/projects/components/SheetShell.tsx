/**
 * SheetShell — native-feeling bottom modal sheet used by all project sheets.
 *
 * Fade scrim + spring slide-in (Reanimated), grabber, title, and an optional
 * footer row for actions. Tapping the scrim or Android back dismisses.
 */

import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components';
import { colors, radius, shadows, spacing } from '@/theme';

export type SheetShellProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Action row pinned below the content (e.g. Cancel / Save). */
  footer?: React.ReactNode;
};

export function SheetShell({
  visible,
  title,
  onClose,
  children,
  footer,
}: SheetShellProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const sheetPad = { paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.md) };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}
        >
          <Animated.View
            entering={SlideInDown.springify().damping(18).mass(0.85)}
            style={[styles.sheet, sheetPad]}
          >
            <View style={styles.grabber} accessibilityElementsHidden />
            <Text variant="subtitle" style={styles.title}>
              {title}
            </Text>
            {children}
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  kav: {
    width: '100%',
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    maxHeight: '90%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.lg,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  title: {
    letterSpacing: -0.2,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
