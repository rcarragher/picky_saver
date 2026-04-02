import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useReviewHistory } from '../hooks/useReviewHistory';
import { CelebrationBurst } from '../components/CelebrationBurst';
import { AnimatedPressable } from '../components/AnimatedPressable';
import {
  borderRadius,
  fontSize,
  fontWeight,
  screenMargin,
  spacing,
  touchTarget,
} from '../constants/theme';

export default function SummaryScreen() {
  const params = useLocalSearchParams<{
    total: string;
    kept: string;
    deleted: string;
    year: string;
    month: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useTheme();

  const { saveReview } = useReviewHistory();

  const total = Number(params.total) || 0;
  const kept = Number(params.kept) || 0;
  const deleted = Number(params.deleted) || 0;

  const hasSavedRef = useRef(false);
  useEffect(() => {
    if (hasSavedRef.current) return;
    if (!params.year || !params.month) return;
    hasSavedRef.current = true;
    saveReview({
      year: Number(params.year),
      month: Number(params.month),
      kept,
      deleted,
      total,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + spacing.xl },
      ]}
    >
      {/* Celebration animation */}
      <CelebrationBurst />

      {/* Title */}
      <Text style={[styles.title, { color: colors.textPrimary }]} accessibilityRole="header">
        Month Complete!
      </Text>

      {/* Subtitle */}
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        You reviewed {total} photos
      </Text>

      {/* Stat cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statCount, { color: colors.keep }]}>{kept}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Kept</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statCount, { color: colors.delete }]}>{deleted}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Marked for deletion
          </Text>
        </View>
      </View>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Review Deletions button */}
      <AnimatedPressable
        onPress={() => router.push('/to-delete')}
        style={[styles.reviewButton, { backgroundColor: colors.surface }]}
        accessibilityLabel="Review deletions"
        accessibilityRole="button"
      >
        <Text style={[styles.reviewButtonText, { color: colors.textPrimary }]}>
          Review Deletions
        </Text>
      </AnimatedPressable>

      {/* Back to Home button */}
      <AnimatedPressable
        onPress={() => router.replace('/')}
        style={styles.homeButton}
        accessibilityLabel="Back to home"
        accessibilityRole="button"
      >
        <Text style={[styles.homeButtonText, { color: colors.textSecondary }]}>Back to Home</Text>
      </AnimatedPressable>

      <View style={{ height: insets.bottom + spacing.md }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: screenMargin,
  },
  title: {
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.body,
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  statCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  statCount: {
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
  },
  reviewButton: {
    width: '100%',
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
    minHeight: touchTarget.min,
  },
  reviewButtonText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
  },
  homeButton: {
    padding: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
  },
});
