import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useDeletionAlbum } from '../hooks/useDeletionAlbum';
import { useAvailableMonths } from '../hooks/usePhotos';
import { useAppStateRefresh } from '../hooks/useAppStateRefresh';
import { PermissionGate } from '../components/PermissionGate';
import { AnimatedPressable } from '../components/AnimatedPressable';
import {
  borderRadius,
  fontSize,
  fontWeight,
  screenMargin,
  spacing,
  touchTarget,
} from '../constants/theme';

export default function HomeScreen() {
  const colors = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { markedCount, isLoading: deletionLoading, refresh: refreshDeletion } = useDeletionAlbum();
  const { months, isLoading: monthsLoading, refresh: refreshMonths } = useAvailableMonths();

  const handleForeground = useCallback(() => {
    refreshDeletion();
    refreshMonths();
  }, [refreshDeletion, refreshMonths]);
  useAppStateRefresh(handleForeground);

  const hasPhotos = months.length > 0;
  const isLoading = deletionLoading || monthsLoading;

  return (
    <PermissionGate>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + spacing.xxl,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
      >
        <View style={styles.content}>
          <Text style={[styles.icon, { color: colors.accent }]}>📷</Text>
          <Text
            style={[styles.title, { color: colors.textPrimary }]}
            accessibilityRole="header"
          >
            Picky Saver
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Organize your photos, one swipe at a time
          </Text>
        </View>

        <View style={styles.buttons}>
          {isLoading ? (
            <View style={styles.shimmerButtons}>
              <View style={[styles.shimmerButton, { backgroundColor: colors.surface }]} />
              <View style={[styles.shimmerButtonSmall, { backgroundColor: colors.surface }]} />
            </View>
          ) : !hasPhotos ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No photos found on this device
            </Text>
          ) : (
            <>
              <AnimatedPressable
                style={[styles.primaryButton, { backgroundColor: colors.accent }]}
                onPress={() => router.push('/date-picker')}
                accessibilityRole="button"
                accessibilityLabel="Start organizing your photos"
              >
                <Text style={styles.primaryButtonText}>Start Organizing →</Text>
              </AnimatedPressable>

              {markedCount > 0 && (
                <AnimatedPressable
                  style={[
                    styles.secondaryButton,
                    { backgroundColor: colors.surface },
                  ]}
                  onPress={() => router.push('/to-delete')}
                  accessibilityRole="button"
                  accessibilityLabel={`Review ${markedCount} photos marked for deletion`}
                >
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      { color: colors.textPrimary },
                    ]}
                  >
                    To Be Deleted ({markedCount} photos)
                  </Text>
                </AnimatedPressable>
              )}
            </>
          )}
        </View>
      </View>
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: screenMargin,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttons: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: touchTarget.min,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
  },
  secondaryButton: {
    width: '100%',
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: touchTarget.min,
  },
  secondaryButtonText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
  },
  emptyText: {
    fontSize: fontSize.body,
    textAlign: 'center',
  },
  shimmerButtons: {
    gap: spacing.md,
  },
  shimmerButton: {
    width: '100%',
    height: 56,
    borderRadius: borderRadius.md,
  },
  shimmerButtonSmall: {
    width: '100%',
    height: 48,
    borderRadius: borderRadius.md,
  },
});
