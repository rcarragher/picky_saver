import { useCallback, useEffect, useState } from 'react';
import * as MediaLibrary from 'expo-media-library';
import {
  getMarkedAssets,
  getMarkedCount,
  markForDeletion as markService,
  restore as restoreService,
  restoreAll as restoreAllService,
  permanentlyDelete,
} from '../services/deletionAlbumService';

export function useDeletionAlbum() {
  const [markedPhotos, setMarkedPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [markedCount, setMarkedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [assets, count] = await Promise.all([getMarkedAssets(), getMarkedCount()]);
      setMarkedPhotos(assets);
      setMarkedCount(count);
    } catch {
      // Silently handle — album may not exist yet
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const markForDeletion = useCallback(async (asset: MediaLibrary.Asset) => {
    await markService(asset);
    setMarkedCount((c) => c + 1);
    setMarkedPhotos((prev) => [...prev, asset]);
  }, []);

  const restore = useCallback(async (asset: MediaLibrary.Asset) => {
    await restoreService(asset);
    setMarkedCount((c) => Math.max(0, c - 1));
    setMarkedPhotos((prev) => prev.filter((a) => a.id !== asset.id));
  }, []);

  const restoreAll = useCallback(async () => {
    await restoreAllService(markedPhotos);
    setMarkedPhotos([]);
    setMarkedCount(0);
  }, [markedPhotos]);

  const permanentlyDeleteAll = useCallback(async (): Promise<boolean> => {
    // Fetch fresh assets from the album to avoid stale closure state
    // (e.g. after restoring photos, the captured markedPhotos may be outdated)
    const freshAssets = await getMarkedAssets();
    if (freshAssets.length === 0) return true;
    const success = await permanentlyDelete(freshAssets);
    if (success) {
      setMarkedPhotos([]);
      setMarkedCount(0);
    }
    return success;
  }, []);

  return {
    markedPhotos,
    markedCount,
    isLoading,
    markForDeletion,
    restore,
    restoreAll,
    permanentlyDeleteAll,
    refresh,
  };
}
