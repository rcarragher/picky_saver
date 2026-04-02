import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useReviewHistory } from '../hooks/useReviewHistory';
import { PermissionGate } from '../components/PermissionGate';
import { HistoryTile } from '../components/HistoryTile';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { getMonthName } from '../services/photoService';
import {
  borderRadius,
  fontSize,
  fontWeight,
  screenMargin,
  spacing,
  touchTarget,
} from '../constants/theme';
import type { ReviewRecord } from '../types';

type HistorySection = { type: 'header'; year: number } | { type: 'record'; data: ReviewRecord };

function buildSections(records: ReviewRecord[]): HistorySection[] {
  const sections: HistorySection[] = [];
  let currentYear: number | null = null;

  for (const record of records) {
    if (record.year !== currentYear) {
      currentYear = record.year;
      sections.push({ type: 'header', year: record.year });
    }
    sections.push({ type: 'record', data: record });
  }

  return sections;
}

function groupAndSort(records: ReviewRecord[]): ReviewRecord[] {
  return [...records].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
}

function HistoryContent() {
  const colors = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { records, refresh, clearReview } = useReviewHistory();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleReviewAgain = useCallback(
    (year: number, month: number) => {
      router.push(`/swipe/${year}/${month}`);
    },
    [router],
  );

  const handleClear = useCallback(
    (year: number, month: number) => {
      const monthName = getMonthName(month);
      Alert.alert(
        'Clear?',
        `This will remove the reviewed status for ${monthName} ${year}. Your photos won't be affected.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: () => clearReview(year, month),
          },
        ],
      );
    },
    [clearReview],
  );

  const sorted = groupAndSort(records);
  const sections = buildSections(sorted);

  const totalMonths = records.length;
  const totalKept = records.reduce((sum, r) => sum + r.kept, 0);
  const totalDeleted = records.reduce((sum, r) => sum + r.deleted, 0);

  const renderHeader = () => {
    if (records.length === 0) return null;
    return (
      <View style={[styles.summaryBanner, { backgroundColor: colors.surface }]}>
        <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>
          🎯 {totalMonths} {totalMonths === 1 ? 'month' : 'months'} reviewed
        </Text>
        <Text style={[styles.summaryStats, { color: colors.textSecondary }]}>
          <Text style={{ color: colors.keep }}>{totalKept} kept</Text>
          {' · '}
          <Text style={{ color: colors.delete }}>{totalDeleted} deleted</Text>
        </Text>
      </View>
    );
  };

  if (records.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={[styles.backArrow, { color: colors.textPrimary }]}>←</Text>
          </Pressable>
          <Text
            style={[styles.headerTitle, { color: colors.textPrimary }]}
            accessibilityRole="header"
          >
            Review History
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No months reviewed yet
          </Text>
          <AnimatedPressable
            style={[styles.emptyButton, { backgroundColor: colors.accent }]}
            onPress={() => router.push('/date-picker')}
            accessibilityRole="button"
            accessibilityLabel="Start organizing your photos"
          >
            <Text style={styles.emptyButtonText}>Start Organizing →</Text>
          </AnimatedPressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={[styles.backArrow, { color: colors.textPrimary }]}>←</Text>
        </Pressable>
        <Text
          style={[styles.headerTitle, { color: colors.textPrimary }]}
          accessibilityRole="header"
        >
          Review History
        </Text>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item, index) =>
          item.type === 'header'
            ? `header-${item.year}`
            : `record-${item.data.year}-${item.data.month}`
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <Text
                style={[styles.yearHeader, { color: colors.textSecondary }]}
                accessibilityRole="header"
              >
                {item.year}
              </Text>
            );
          }
          return (
            <HistoryTile
              record={item.data}
              onReviewAgain={handleReviewAgain}
              onClear={handleClear}
            />
          );
        }}
      />
    </View>
  );
}

export default function HistoryScreen() {
  return (
    <PermissionGate>
      <HistoryContent />
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenMargin,
    paddingVertical: spacing.md,
  },
  backButton: {
    minWidth: touchTarget.min,
    minHeight: touchTarget.min,
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  backArrow: {
    fontSize: fontSize.h1,
    fontWeight: fontWeight.medium,
  },
  headerTitle: {
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
  },
  listContent: {
    paddingHorizontal: screenMargin,
    paddingBottom: spacing.xl,
  },
  yearHeader: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  summaryBanner: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryTitle: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
  },
  summaryStats: {
    fontSize: fontSize.caption,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: screenMargin,
  },
  emptyText: {
    fontSize: fontSize.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    minHeight: touchTarget.min,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
  },
});
