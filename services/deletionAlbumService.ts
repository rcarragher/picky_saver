import * as MediaLibrary from 'expo-media-library';

const ALBUM_NAME = 'Picky Saver - To Delete';

let cachedAlbum: MediaLibrary.Album | null = null;

/**
 * Look up the "Picky Saver - To Delete" album.
 * Returns the album if it exists, null otherwise.
 * Resets cache if the album was deleted externally.
 */
export async function getOrCreateAlbum(): Promise<MediaLibrary.Album | null> {
  if (cachedAlbum) {
    // Verify cached album still exists
    const album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
    if (!album) {
      cachedAlbum = null;
      return null;
    }
    cachedAlbum = album;
    return album;
  }

  const album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
  cachedAlbum = album;
  return album;
}

/**
 * Mark an asset for deletion by adding it to the "Picky Saver - To Delete" album.
 * Creates the album if it doesn't exist yet.
 */
export async function markForDeletion(asset: MediaLibrary.Asset): Promise<void> {
  const album = await getOrCreateAlbum();
  if (!album) {
    // Album doesn't exist yet — create it with this asset
    const newAlbum = await MediaLibrary.createAlbumAsync(ALBUM_NAME, asset);
    cachedAlbum = newAlbum;
  } else {
    await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
  }
}

/**
 * Restore an asset by removing it from the deletion album.
 */
export async function restore(asset: MediaLibrary.Asset): Promise<void> {
  const album = await getOrCreateAlbum();
  if (!album) return;
  await MediaLibrary.removeAssetsFromAlbumAsync([asset], album);
}

/**
 * Restore all assets by removing them from the deletion album.
 */
export async function restoreAll(assets: MediaLibrary.Asset[]): Promise<void> {
  if (assets.length === 0) return;
  const album = await getOrCreateAlbum();
  if (!album) return;
  await MediaLibrary.removeAssetsFromAlbumAsync(assets, album);
}

/**
 * Get all assets currently marked for deletion.
 * Paginates internally to return the full list.
 */
export async function getMarkedAssets(): Promise<MediaLibrary.Asset[]> {
  const album = await getOrCreateAlbum();
  if (!album) return [];

  const assets: MediaLibrary.Asset[] = [];
  let hasNextPage = true;
  let endCursor: string | undefined;

  while (hasNextPage) {
    const page = await MediaLibrary.getAssetsAsync({
      album,
      first: 500,
      ...(endCursor ? { after: endCursor } : {}),
    });

    assets.push(...page.assets);
    hasNextPage = page.hasNextPage;
    endCursor = page.endCursor;
  }

  return assets;
}

/**
 * Get the count of assets marked for deletion without loading them all.
 */
export async function getMarkedCount(): Promise<number> {
  const album = await getOrCreateAlbum();
  if (!album) return 0;

  const page = await MediaLibrary.getAssetsAsync({
    album,
    first: 1,
  });

  return page.totalCount;
}

/**
 * Permanently delete the given assets. The OS will show a confirmation dialog.
 * Returns true if the deletion was successful.
 */
export async function permanentlyDelete(
  assets: MediaLibrary.Asset[],
): Promise<boolean> {
  if (assets.length === 0) return true;
  const result = await MediaLibrary.deleteAssetsAsync(
    assets.map((a) => a.id),
  );
  return result;
}

/** Reset the cached album reference. Useful for testing. */
export function _resetCache(): void {
  cachedAlbum = null;
}
