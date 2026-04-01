import React from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePermissions, type PermissionStatus } from '../hooks/usePermissions';
import { useTheme } from '../hooks/useTheme';
import { AnimatedPressable } from './AnimatedPressable';
import { borderRadius, fontSize, fontWeight, screenMargin, spacing, touchTarget } from '../constants/theme';

type Props = {
  children: React.ReactNode;
};

export function PermissionGate({ children }: Props) {
  const { status, requestPermission, isLoading } = usePermissions();
  const colors = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (status === 'granted') {
    return <>{children}</>;
  }

  if (status === 'limited') {
    return (
      <View style={{ flex: 1 }}>
        <View style={[styles.banner, { backgroundColor: colors.surface }]}>
          <Text style={[styles.bannerText, { color: colors.textSecondary }]}>
            For best results, allow full photo access in Settings
          </Text>
          <Pressable
            onPress={() => Linking.openSettings()}
            accessibilityRole="button"
            accessibilityLabel="Open settings for full photo access"
            style={styles.bannerButton}
          >
            <Text style={[styles.bannerLink, { color: colors.accent }]}>Open Settings</Text>
          </Pressable>
        </View>
        {children}
      </View>
    );
  }

  if (status === 'undetermined') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Access Your Photos</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Picky Saver needs access to your photo library to help you organize and clean up your photos.
        </Text>
        <AnimatedPressable
          style={[styles.button, { backgroundColor: colors.accent }]}
          onPress={requestPermission}
          accessibilityRole="button"
          accessibilityLabel="Allow photo access"
        >
          <Text style={styles.buttonText}>Allow Access</Text>
        </AnimatedPressable>
      </View>
    );
  }

  // denied
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Photo Access Required</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        Picky Saver needs photo library access to work. Please enable it in your device settings.
      </Text>
      <AnimatedPressable
        style={[styles.button, { backgroundColor: colors.accent }]}
        onPress={() => Linking.openSettings()}
        accessibilityRole="button"
        accessibilityLabel="Open device settings"
      >
        <Text style={styles.buttonText}>Open Settings</Text>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: screenMargin,
  },
  title: {
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  body: {
    fontSize: fontSize.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    minHeight: touchTarget.min,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: screenMargin,
    paddingVertical: spacing.sm,
  },
  bannerText: {
    fontSize: fontSize.small,
    flex: 1,
    marginRight: spacing.sm,
  },
  bannerButton: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerLink: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
  },
});
