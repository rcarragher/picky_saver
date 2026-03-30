import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../hooks/useTheme';
import { useMonthPhotos } from '../../../hooks/usePhotos';
import { getMonthName } from '../../../services/photoService';
import { PhotoCard } from '../../../components/PhotoCard';
import { OnboardingOverlay, ONBOARDING_KEY } from '../../../components/OnboardingOverlay';
import {
  borderRadius,
  fontSize,
  fontWeight,
  screenMargin,
  spacing,
  touchTarget,
} from '../../../constants/theme';

const HINT_SWIPE_COUNT_KEY = 'picky_saver_swipe_count';
const HINT_THRESHOLD = 5;

type HistoryEntry = {
  index: number;
  action: 'keep' | 'delete';
};

export default function SwipeScreen() {
  const { year: yearParam, month: monthParam } = useLocalSearchParams<{
    year: string;
    month: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useTheme();

  const year = Number(yearParam);
  const month = Number(monthParam);

  const isValidParams = Number.isFinite(year) && Number.isFinite(month);

  const { photos, isLoading, error } = useMonthPhotos(
    isValidParams ? year : 0,
    isValidParams ? month : 0,
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [kept, setKept] = useState(0);
  const [deleted, setDeleted] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHint, setShowHint] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const swipeCountRef = useRef(0);

  useEffect(() => {
    AsyncStorage.getItem(HINT_SWIPE_COUNT_KEY).then((val) => {
      const count = val ? parseInt(val, 10) : 0;
      swipeCountRef.current = count;
      if (count >= HINT_THRESHOLD) {
        setShowHint(false);
      }
    });
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      if (val !== 'true') {
        setShowOnboarding(true);
      }
    });
  }, []);

  const incrementSwipeCount = useCallback(async () => {
    swipeCountRef.current += 1;
    if (swipeCountRef.current >= HINT_THRESHOLD) {
      setShowHint(false);
    }
    await AsyncStorage.setItem(HINT_SWIPE_COUNT_KEY, String(swipeCountRef.current));
  }, []);

  // Prefetch next photo
  useEffect(() => {
    if (photos.length > 0 && currentIndex + 1 < photos.length) {
      const nextAsset = photos[currentIndex + 1];
      Image.prefetch(nextAsset.uri);
    }
  }, [currentIndex, photos]);

  const currentPhoto = photos[currentIndex];
  const isComplete = currentIndex >= photos.length && photos.length > 0;
  const total = kept + deleted;

  const handleSwipeRight = useCallback(() => {
    setHistory((prev) => [...prev, { index: currentIndex, action: 'keep' }]);
    setKept((k) => k + 1);
    setCurrentIndex((i) => i + 1);
    incrementSwipeCount();
  }, [currentIndex, incrementSwipeCount]);

  const handleSwipeLeft = useCallback(() => {
    setHistory((prev) => [...prev, { index: currentIndex, action: 'delete' }]);
    setDeleted((d) => d + 1);
    setCurrentIndex((i) => i + 1);
    incrementSwipeCount();
  }, [currentIndex, incrementSwipeCount]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCurrentIndex(last.index);
    if (last.action === 'keep') {
      setKept((k) => k - 1);
    } else {
      setDeleted((d) => d - 1);
    }
  }, [history]);

  // Navigate to summary when complete
  useEffect(() => {
    if (isComplete) {
      router.replace(
        `/summary?total=${photos.length}&kept=${kept}&deleted=${deleted}&year=${year}&month=${month}`,
      );
    }
  }, [isComplete, photos.length, kept, deleted, year, month, router]);

  const monthName = useMemo(() => getMonthName(month), [month]);
  const headerTitle = `${monthName} ${year}`;

  if (!isValidParams) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>Invalid parameters</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Onboarding overlay */}
      {showOnboarding && (
        <OnboardingOverlay onDismiss={() => setShowOnboarding(false)} />
      )}

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={8}
        >
          <Text style={[styles.backArrow, { color: colors.textPrimary }]}>←</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {headerTitle}
        </Text>
        {!isLoading && photos.length > 0 && (
          <Text style={[styles.progressCounter, { color: colors.textSecondary }]}>
            {Math.min(currentIndex + 1, photos.length)}/{photos.length}
          </Text>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={[styles.shimmerCard, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : error ? (
          <Text style={[styles.errorText, { color: colors.delete }]}>
            Failed to load photos
          </Text>
        ) : currentPhoto ? (
          <PhotoCard
            key={currentPhoto.id}
            asset={currentPhoto}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
          />
        ) : null}
      </View>

      {/* Hint text */}
      {showHint && !isLoading && currentPhoto && (
        <Text style={[styles.hintText, { color: colors.textSecondary }]}>
          ← DELETE    KEEP →
        </Text>
      )}

      {/* Bottom controls */}
      {!isLoading && currentPhoto && (
        <View style={styles.controls}>
          {/* Delete button */}
          <Pressable
            onPress={handleSwipeLeft}
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            accessibilityLabel="Delete this photo"
            accessibilityRole="button"
          >
            <Text style={[styles.actionIcon, { color: colors.delete }]}>✕</Text>
          </Pressable>

          {/* Undo button */}
          <Pressable
            onPress={handleUndo}
            style={[
              styles.undoButton,
              {
                backgroundColor: colors.surface,
                opacity: history.length > 0 ? 1 : 0.4,
              },
            ]}
            disabled={history.length === 0}
            accessibilityLabel="Undo last action"
            accessibilityRole="button"
          >
            <Text style={[styles.undoText, { color: colors.textSecondary }]}>↩ Undo</Text>
          </Pressable>

          {/* Keep button */}
          <Pressable
            onPress={handleSwipeRight}
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            accessibilityLabel="Keep this photo"
            accessibilityRole="button"
          >
            <Text style={[styles.actionIcon, { color: colors.keep }]}>✓</Text>
          </Pressable>
        </View>
      )}

      <View style={{ height: insets.bottom + spacing.md }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenMargin,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: touchTarget.min,
    height: touchTarget.min,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.medium,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    marginLeft: spacing.sm,
  },
  progressCounter: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    marginLeft: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: screenMargin,
    justifyContent: 'center',
  },
  shimmerCard: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: fontSize.body,
    textAlign: 'center',
  },
  hintText: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    letterSpacing: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: screenMargin,
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  actionButton: {
    width: touchTarget.min,
    height: touchTarget.min,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
  },
  undoButton: {
    height: touchTarget.min,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  undoText: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
  },
});
