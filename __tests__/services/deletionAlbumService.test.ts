import {
  getAlbumAsync,
  createAlbumAsync,
  addAssetsToAlbumAsync,
  removeAssetsFromAlbumAsync,
  deleteAssetsAsync,
  getAssetsAsync,
} from 'expo-media-library';
import {
  getOrCreateAlbum,
  markForDeletion,
  restore,
  restoreAll,
  getMarkedAssets,
  getMarkedCount,
  permanentlyDelete,
  _resetCache,
} from '../../services/deletionAlbumService';

jest.mock('expo-media-library');

const mockGetAlbum = getAlbumAsync as jest.MockedFunction<typeof getAlbumAsync>;
const mockCreateAlbum = createAlbumAsync as jest.MockedFunction<typeof createAlbumAsync>;
const mockAddAssets = addAssetsToAlbumAsync as jest.MockedFunction<typeof addAssetsToAlbumAsync>;
const mockRemoveAssets = removeAssetsFromAlbumAsync as jest.MockedFunction<
  typeof removeAssetsFromAlbumAsync
>;
const mockDeleteAssets = deleteAssetsAsync as jest.MockedFunction<typeof deleteAssetsAsync>;
const mockGetAssets = getAssetsAsync as jest.MockedFunction<typeof getAssetsAsync>;

const fakeAlbum = { id: 'album-1', title: 'Picky Saver - To Delete' } as any;
const fakeAsset = { id: 'asset-1', uri: 'file://photo1.jpg' } as any;
const fakeAsset2 = { id: 'asset-2', uri: 'file://photo2.jpg' } as any;

describe('deletionAlbumService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    _resetCache();
  });

  describe('getOrCreateAlbum', () => {
    it('returns album when it exists', async () => {
      mockGetAlbum.mockResolvedValue(fakeAlbum);
      const album = await getOrCreateAlbum();
      expect(album).toEqual(fakeAlbum);
      expect(mockGetAlbum).toHaveBeenCalledWith('Picky Saver - To Delete');
    });

    it('returns null when album does not exist', async () => {
      mockGetAlbum.mockResolvedValue(null as any);
      const album = await getOrCreateAlbum();
      expect(album).toBeNull();
    });

    it('caches album and re-verifies on subsequent calls', async () => {
      mockGetAlbum.mockResolvedValue(fakeAlbum);
      await getOrCreateAlbum();
      await getOrCreateAlbum();
      // Called twice: first lookup + cache verification
      expect(mockGetAlbum).toHaveBeenCalledTimes(2);
    });

    it('resets cache when album is deleted externally', async () => {
      // First call: album exists
      mockGetAlbum.mockResolvedValueOnce(fakeAlbum);
      await getOrCreateAlbum();

      // Second call: album was deleted
      mockGetAlbum.mockResolvedValueOnce(null as any);
      const album = await getOrCreateAlbum();
      expect(album).toBeNull();
    });
  });

  describe('markForDeletion', () => {
    it('creates album on first mark when album does not exist', async () => {
      mockGetAlbum.mockResolvedValue(null as any);
      mockCreateAlbum.mockResolvedValue(fakeAlbum);

      await markForDeletion(fakeAsset);

      expect(mockCreateAlbum).toHaveBeenCalledWith('Picky Saver - To Delete', fakeAsset);
      expect(mockAddAssets).not.toHaveBeenCalled();
    });

    it('adds to existing album on subsequent marks', async () => {
      mockGetAlbum.mockResolvedValue(fakeAlbum);
      mockAddAssets.mockResolvedValue(true as any);

      await markForDeletion(fakeAsset);

      expect(mockAddAssets).toHaveBeenCalledWith([fakeAsset], fakeAlbum, false);
      expect(mockCreateAlbum).not.toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    it('calls removeAssetsFromAlbumAsync', async () => {
      mockGetAlbum.mockResolvedValue(fakeAlbum);
      mockRemoveAssets.mockResolvedValue(true as any);

      await restore(fakeAsset);

      expect(mockRemoveAssets).toHaveBeenCalledWith([fakeAsset], fakeAlbum);
    });

    it('does nothing when album does not exist', async () => {
      mockGetAlbum.mockResolvedValue(null as any);

      await restore(fakeAsset);

      expect(mockRemoveAssets).not.toHaveBeenCalled();
    });
  });

  describe('restoreAll', () => {
    it('calls removeAssetsFromAlbumAsync with all assets', async () => {
      mockGetAlbum.mockResolvedValue(fakeAlbum);
      mockRemoveAssets.mockResolvedValue(true as any);

      await restoreAll([fakeAsset, fakeAsset2]);

      expect(mockRemoveAssets).toHaveBeenCalledWith([fakeAsset, fakeAsset2], fakeAlbum);
    });

    it('does nothing when album does not exist', async () => {
      mockGetAlbum.mockResolvedValue(null as any);

      await restoreAll([fakeAsset]);

      expect(mockRemoveAssets).not.toHaveBeenCalled();
    });

    it('does nothing for empty array', async () => {
      await restoreAll([]);

      expect(mockGetAlbum).not.toHaveBeenCalled();
      expect(mockRemoveAssets).not.toHaveBeenCalled();
    });
  });

  describe('getMarkedAssets', () => {
    it('returns assets from the album', async () => {
      mockGetAlbum.mockResolvedValue(fakeAlbum);
      mockGetAssets.mockResolvedValue({
        assets: [fakeAsset, fakeAsset2],
        hasNextPage: false,
        endCursor: '2',
        totalCount: 2,
      } as any);

      const result = await getMarkedAssets();
      expect(result).toEqual([fakeAsset, fakeAsset2]);
    });

    it('returns empty array when album does not exist', async () => {
      mockGetAlbum.mockResolvedValue(null as any);
      const result = await getMarkedAssets();
      expect(result).toEqual([]);
    });

    it('paginates through all assets', async () => {
      mockGetAlbum.mockResolvedValue(fakeAlbum);
      mockGetAssets
        .mockResolvedValueOnce({
          assets: [fakeAsset],
          hasNextPage: true,
          endCursor: '1',
          totalCount: 2,
        } as any)
        .mockResolvedValueOnce({
          assets: [fakeAsset2],
          hasNextPage: false,
          endCursor: '2',
          totalCount: 2,
        } as any);

      const result = await getMarkedAssets();
      expect(result).toEqual([fakeAsset, fakeAsset2]);
      expect(mockGetAssets).toHaveBeenCalledTimes(2);
    });
  });

  describe('getMarkedCount', () => {
    it('returns totalCount from the album', async () => {
      mockGetAlbum.mockResolvedValue(fakeAlbum);
      mockGetAssets.mockResolvedValue({
        assets: [fakeAsset],
        hasNextPage: false,
        endCursor: '1',
        totalCount: 42,
      } as any);

      const count = await getMarkedCount();
      expect(count).toBe(42);
    });

    it('returns 0 when album does not exist', async () => {
      mockGetAlbum.mockResolvedValue(null as any);
      const count = await getMarkedCount();
      expect(count).toBe(0);
    });
  });

  describe('permanentlyDelete', () => {
    it('calls deleteAssetsAsync with asset ids', async () => {
      mockDeleteAssets.mockResolvedValue(true as any);

      const result = await permanentlyDelete([fakeAsset, fakeAsset2]);

      expect(mockDeleteAssets).toHaveBeenCalledWith(['asset-1', 'asset-2']);
      expect(result).toBe(true);
    });

    it('returns true for empty array', async () => {
      const result = await permanentlyDelete([]);
      expect(result).toBe(true);
      expect(mockDeleteAssets).not.toHaveBeenCalled();
    });
  });
});
