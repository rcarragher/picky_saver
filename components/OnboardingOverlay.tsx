import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../hooks/useTheme';
import { borderRadius, fontSize, fontWeight, screenMargin, spacing } from '../constants/theme';

const ONBOARDING_KEY = 'onboarding_complete';

type Props = {
  onDismiss: () => void;
};

export function OnboardingOverlay({ onDismiss }: Props) {
  const colors = useTheme();

  const dismiss = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onDismiss();
  };

  return (
    <View style={styles.backdrop}>
      <View style={styles.content}>
        {/* Skip button */}
        <Pressable
          onPress={dismiss}
          style={styles.skipButton}
          accessibilityLabel="Skip onboarding"
          accessibilityRole="button"
        >
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
        </Pressable>

        {/* Instructions */}
        <View style={styles.instructions}>
          <View style={styles.instructionRow}>
            <Text style={[styles.instructionText, { color: '#FFFFFF' }]}>
              ← Swipe left to delete
            </Text>
          </View>
          <View style={styles.instructionRow}>
            <Text style={[styles.instructionText, { color: '#FFFFFF' }]}>
              Swipe right to keep →
            </Text>
          </View>
        </View>

        {/* Caption */}
        <Text style={[styles.caption, { color: colors.textSecondary }]}>
          You can undo anytime
        </Text>

        {/* Got it button */}
        <Pressable
          onPress={dismiss}
          style={[styles.gotItButton, { backgroundColor: colors.accent }]}
          accessibilityLabel="Dismiss onboarding"
          accessibilityRole="button"
        >
          <Text style={styles.gotItText}>Got it!</Text>
        </Pressable>
      </View>
    </View>
  );
}

export { ONBOARDING_KEY };

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  content: {
    width: '100%',
    paddingHorizontal: screenMargin,
    alignItems: 'center',
  },
  skipButton: {
    position: 'absolute',
    top: -80,
    right: screenMargin,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.sm,
  },
  skipText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
  },
  instructions: {
    gap: spacing.xl,
    marginBottom: spacing.xl,
  },
  instructionRow: {
    alignItems: 'center',
  },
  instructionText: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  caption: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.regular,
    marginBottom: spacing.xxl,
  },
  gotItButton: {
    width: '100%',
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  gotItText: {
    color: '#FFFFFF',
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
  },
});
