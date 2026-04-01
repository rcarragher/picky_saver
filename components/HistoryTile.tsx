import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { AnimatedPressable } from './AnimatedPressable';
import { borderRadius, fontSize, fontWeight, spacing } from '../constants/theme';
import { getMonthName } from '../services/photoService';
import { ReviewRecord } from '../types';

type HistoryTileProps = {
  record: ReviewRecord;
  onReviewAgain: (year: number, month: number) => void;
  onClear: (year: number, month: number) => void;
};

export function HistoryTile({ record, onReviewAgain, onClear }: HistoryTileProps) {
  const colors = useTheme();
  const reviewDate = new Date(record.reviewedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {getMonthName(record.month)}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Reviewed {reviewDate}
      </Text>
      <Text style={[styles.stats, { color: colors.textSecondary }]}>
        <Text style={{ color: colors.keep }}>{record.kept} kept</Text>
        {' · '}
        <Text style={{ color: colors.delete }}>{record.deleted} deleted</Text>
      </Text>
      <View style={styles.actions}>
        <AnimatedPressable
          style={[styles.reviewAgainButton, { borderColor: colors.border }]}
          onPress={() => onReviewAgain(record.year, record.month)}
          accessibilityRole="button"
          accessibilityLabel="Review Again"
        >
          <Text style={[styles.reviewAgainText, { color: colors.textPrimary }]}>
            Review Again
          </Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={styles.clearButton}
          onPress={() => onClear(record.year, record.month)}
          accessibilityRole="button"
          accessibilityLabel="Clear"
        >
          <Text style={[styles.clearText, { color: colors.textSecondary }]}>
            Clear
          </Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semibold,
  },
  subtitle: {
    fontSize: fontSize.caption,
    marginTop: spacing.xs,
  },
  stats: {
    fontSize: fontSize.caption,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  reviewAgainButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  reviewAgainText: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
  },
  clearButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  clearText: {
    fontSize: fontSize.small,
  },
});
