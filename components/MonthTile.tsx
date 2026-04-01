import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { AnimatedPressable } from './AnimatedPressable';
import { borderRadius, fontSize, fontWeight, spacing } from '../constants/theme';
import { getMonthName } from '../services/photoService';

type Props = {
  year: number;
  /** 1-based month */
  month: number;
  count: number;
  onPress: (year: number, month: number) => void;
  reviewed?: boolean;
};

export function MonthTile({ year, month, count, onPress, reviewed }: Props) {
  const colors = useTheme();
  const photoText = `${count} ${count === 1 ? 'photo' : 'photos'}`;

  return (
    <AnimatedPressable
      style={[
        styles.container,
        { backgroundColor: colors.surface },
        reviewed && { borderLeftWidth: 3, borderLeftColor: colors.keep },
      ]}
      onPress={() => onPress(year, month)}
      accessibilityRole="button"
      accessibilityLabel={`${getMonthName(month)} ${year}, ${photoText}${reviewed ? ', reviewed' : ''}`}
    >
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {getMonthName(month)} {year}
        </Text>
        <Text style={[styles.caption, { color: colors.textSecondary }]}>
          {photoText}
          {reviewed && (
            <Text style={{ color: colors.keep }}> · ✓ Reviewed</Text>
          )}
        </Text>
      </View>
      <Text style={[styles.chevron, { color: colors.textSecondary }]}>→</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semibold,
  },
  caption: {
    fontSize: fontSize.caption,
    marginTop: spacing.xs,
  },
  chevron: {
    fontSize: fontSize.h2,
  },
});
