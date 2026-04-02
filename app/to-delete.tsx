import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import { useTheme } from '../hooks/useTheme';
import { useDeletionAlbum } from '../hooks/useDeletionAlbum';
import { useAppStateRefresh } from '../hooks/useAppStateRefresh';
import { PermissionGate } from '../components/PermissionGate';
import { PhotoGrid } from '../components/PhotoGrid';
import { AnimatedPressable } from '../components/AnimatedPressable';
import {
  borderRadius,
  fontSize,
  fontWeight,
  screenMargin,
  spacing,
  touchTarget,
} from '../constants/theme';

function ShimmerGrid({ colors }: { colors: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.shimmerContainer}>
      {Array.from({ length: 9 }).map((_, i) => (
        <View key={i} style={[styles.shimmerSquare, { backgroundColor: colors.surface }]} />
      ))}
    </View>
  );
}

function ToDeleteContent() {
  const colors = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    markedPhotos,
    markedCount,
    isLoading,
    restore,
    restoreAll,
    permanentlyDeleteAll,
    refresh,
  } = useDeletionAlbum();
  useAppStateRefresh(refresh);

  const [previewAsset, setPreviewAsset] = useState<MediaLibrary.Asset | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  const handleRestore = async (asset: MediaLibrary.Asset) => {
    await restore(asset);
    setPreviewAsset(null);
  };

  const handleRestoreAll = async () => {
    await restoreAll();
  };

  const handleDeleteAll = async () => {
    const count = markedCount;
    const success = await permanentlyDeleteAll();
    if (success) {
      setDeleteMessage(`Deleted ${count} photos`);
      setTimeout(() => {
        setDeleteMessage(null);
        router.replace('/');
      }, 1500);
    }
  };

  const isEmpty = !isLoading && markedPhotos.length === 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
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
          To Be Deleted
        </Text>
        {markedCount > 0 && (
          <View style={[styles.countBadge, { backgroundColor: colors.delete }]}>
            <Text style={styles.countBadgeText}>{markedCount}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <ShimmerGrid colors={colors} />
      ) : isEmpty ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Nothing here yet</Text>
          <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
            Start organizing to mark photos for deletion.
          </Text>
          <AnimatedPressable
            onPress={() => router.replace('/date-picker')}
            style={[styles.startButton, { backgroundColor: colors.accent }]}
            accessibilityRole="button"
            accessibilityLabel="Start organizing your photos"
          >
            <Text style={styles.startButtonText}>Start Organizing</Text>
          </AnimatedPressable>
        </View>
      ) : (
        <View style={styles.gridContainer}>
          <PhotoGrid assets={markedPhotos} onTap={setPreviewAsset} />
        </View>
      )}

      {/* Bottom action buttons */}
      {!isEmpty && !isLoading && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <AnimatedPressable
            onPress={handleRestoreAll}
            style={[styles.restoreAllButton, { backgroundColor: colors.surface }]}
            accessibilityRole="button"
            accessibilityLabel={`Restore all ${markedCount} photos`}
            testID="restore-all-button"
          >
            <Text style={[styles.restoreAllText, { color: colors.textPrimary }]}>
              ↩ Restore All ({markedCount})
            </Text>
          </AnimatedPressable>
          <AnimatedPressable
            onPress={handleDeleteAll}
            style={[styles.deleteAllButton, { backgroundColor: colors.delete }]}
            accessibilityRole="button"
            accessibilityLabel={`Delete all ${markedCount} photos permanently`}
            testID="delete-all-button"
          >
            <Text style={styles.deleteAllText}>Delete All ({markedCount})</Text>
          </AnimatedPressable>
        </View>
      )}

      {/* Success message */}
      {deleteMessage && (
        <View style={styles.messageOverlay}>
          <View style={[styles.messageBubble, { backgroundColor: colors.surface }]}>
            <Text style={[styles.messageText, { color: colors.textPrimary }]}>{deleteMessage}</Text>
          </View>
        </View>
      )}

      {/* Full-screen preview modal */}
      <Modal visible={previewAsset !== null} transparent animationType="fade">
        <View style={styles.previewBackdrop}>
          <Pressable
            onPress={() => setPreviewAsset(null)}
            style={[styles.closeButton, { top: insets.top + spacing.md }]}
            accessibilityRole="button"
            accessibilityLabel="Close preview"
            testID="close-preview"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>

          {previewAsset && (
            <Image
              source={{ uri: previewAsset.uri }}
              style={styles.previewImage}
              contentFit="contain"
              testID="preview-image"
              accessibilityLabel="Photo preview"
            />
          )}

          <View style={[styles.previewActions, { paddingBottom: insets.bottom + spacing.lg }]}>
            <AnimatedPressable
              onPress={() => previewAsset && handleRestore(previewAsset)}
              style={[styles.restoreButton, { backgroundColor: colors.surface }]}
              accessibilityRole="button"
              accessibilityLabel="Restore photo"
              testID="restore-button"
            >
              <Text style={[styles.restoreButtonText, { color: colors.textPrimary }]}>
                ↩ Restore Photo
              </Text>
            </AnimatedPressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function ToDeleteScreen() {
  return (
    <PermissionGate>
      <ToDeleteContent />
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
    flex: 1,
  },
  countBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: fontSize.small,
    fontWeight: fontWeight.bold,
  },
  gridContainer: {
    flex: 1,
  },
  shimmerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    padding: 0,
  },
  shimmerSquare: {
    width: '32.5%',
    aspectRatio: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: screenMargin,
  },
  emptyTitle: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  emptyBody: {
    fontSize: fontSize.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  startButton: {
    width: '100%',
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
  },
  bottomBar: {
    paddingHorizontal: screenMargin,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  restoreAllButton: {
    width: '100%',
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    minHeight: touchTarget.min,
  },
  restoreAllText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
  },
  deleteAllButton: {
    width: '100%',
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    minHeight: touchTarget.min,
  },
  deleteAllText: {
    color: '#FFFFFF',
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  messageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  messageBubble: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  messageText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    left: screenMargin,
    width: touchTarget.min,
    height: touchTarget.min,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
  },
  previewImage: {
    width: '100%',
    height: '70%',
  },
  previewActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: screenMargin,
  },
  restoreButton: {
    width: '100%',
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    minHeight: touchTarget.min,
  },
  restoreButtonText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
  },
});
