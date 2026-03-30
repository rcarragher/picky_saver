import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useDeletionAlbum } from '../hooks/useDeletionAlbum';
import { useAvailableMonths } from '../hooks/usePhotos';
import { PermissionGate } from '../components/PermissionGate';
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
  const { markedCount, isLoading: deletionLoading } = useDeletionAlbum();
  const { months, isLoading: monthsLoading } = useAvailableMonths();

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
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Picky Saver
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Organize your photos, one swipe at a time
          </Text>
        </View>

        <View style={styles.buttons}>
          {!isLoading && !hasPhotos ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No photos found on this device
            </Text>
          ) : (
            <>
              <Pressable
                style={[styles.primaryButton, { backgroundColor: colors.accent }]}
                onPress={() => router.push('/date-picker')}
              >
                <Text style={styles.primaryButtonText}>Start Organizing →</Text>
              </Pressable>

              {markedCount > 0 && (
                <Pressable
                  style={[
                    styles.secondaryButton,
                    { backgroundColor: colors.surface },
                  ]}
                  onPress={() => router.push('/to-delete')}
                >
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      { color: colors.textPrimary },
                    ]}
                  >
                    To Be Deleted ({markedCount} photos)
                  </Text>
                </Pressable>
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
});
