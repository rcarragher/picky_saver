import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useAvailableMonths } from '../hooks/usePhotos';
import { useAppStateRefresh } from '../hooks/useAppStateRefresh';
import { PermissionGate } from '../components/PermissionGate';
import { MonthTile } from '../components/MonthTile';
import { borderRadius, fontSize, fontWeight, screenMargin, spacing, touchTarget } from '../constants/theme';
import type { MonthBatch } from '../types';

function ShimmerTile({ colors }: { colors: ReturnType<typeof useTheme> }) {
  return (
    <View
      style={[
        styles.shimmerTile,
        { backgroundColor: colors.surface },
      ]}
    />
  );
}

type YearSection = { type: 'header'; year: number } | { type: 'month'; data: MonthBatch };

function buildSections(months: MonthBatch[]): YearSection[] {
  const sections: YearSection[] = [];
  let currentYear: number | null = null;

  for (const batch of months) {
    if (batch.year !== currentYear) {
      currentYear = batch.year;
      sections.push({ type: 'header', year: batch.year });
    }
    sections.push({ type: 'month', data: batch });
  }

  return sections;
}

function DatePickerContent() {
  const colors = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { months, isLoading, refresh } = useAvailableMonths();
  useAppStateRefresh(refresh);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const sections = buildSections(months);

  const handleMonthPress = (year: number, month: number) => {
    router.push(`/swipe/${year}/${month}`);
  };

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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} accessibilityRole="header">Pick a Month</Text>
      </View>

      {isLoading ? (
        <View style={styles.listContent}>
          {[0, 1, 2, 3].map((i) => (
            <ShimmerTile key={i} colors={colors} />
          ))}
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item, index) =>
            item.type === 'header' ? `header-${item.year}` : `month-${item.data.year}-${item.data.month}`
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <Text style={[styles.yearHeader, { color: colors.textSecondary }]} accessibilityRole="header">
                  {item.year}
                </Text>
              );
            }
            return (
              <MonthTile
                year={item.data.year}
                month={item.data.month}
                count={item.data.count}
                onPress={handleMonthPress}
              />
            );
          }}
        />
      )}
    </View>
  );
}

export default function DatePickerScreen() {
  return (
    <PermissionGate>
      <DatePickerContent />
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
  shimmerTile: {
    height: 80,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
});
