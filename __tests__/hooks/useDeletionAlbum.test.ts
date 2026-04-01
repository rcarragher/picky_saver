import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useDeletionAlbum } from '../../hooks/useDeletionAlbum';
import * as deletionService from '../../services/deletionAlbumService';

jest.mock('expo-media-library');
jest.mock('../../services/deletionAlbumService');

const mockService = deletionService as jest.Mocked<typeof deletionService>;

const fakeAsset1 = { id: 'a1', uri: 'file://1.jpg' } as any;
const fakeAsset2 = { id: 'a2', uri: 'file://2.jpg' } as any;

describe('useDeletionAlbum', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockService.getMarkedAssets.mockResolvedValue([fakeAsset1]);
    mockService.getMarkedCount.mockResolvedValue(1);
    mockService.markForDeletion.mockResolvedValue(undefined);
    mockService.restore.mockResolvedValue(undefined);
    mockService.restoreAll.mockResolvedValue(undefined);
    mockService.permanentlyDelete.mockResolvedValue(true);
  });

  it('loads marked photos and count on mount', async () => {
    const { result } = renderHook(() => useDeletionAlbum());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.markedPhotos).toEqual([fakeAsset1]);
    expect(result.current.markedCount).toBe(1);
  });

  it('markForDeletion calls service and updates state', async () => {
    const { result } = renderHook(() => useDeletionAlbum());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.markForDeletion(fakeAsset2);
    });

    expect(mockService.markForDeletion).toHaveBeenCalledWith(fakeAsset2);
    expect(result.current.markedCount).toBe(2);
    expect(result.current.markedPhotos).toContainEqual(fakeAsset2);
  });

  it('restore calls service and updates state', async () => {
    const { result } = renderHook(() => useDeletionAlbum());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.restore(fakeAsset1);
    });

    expect(mockService.restore).toHaveBeenCalledWith(fakeAsset1);
    expect(result.current.markedCount).toBe(0);
    expect(result.current.markedPhotos).not.toContainEqual(fakeAsset1);
  });

  it('permanentlyDeleteAll calls service and clears state on success', async () => {
    const { result } = renderHook(() => useDeletionAlbum());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success: boolean;
    await act(async () => {
      success = await result.current.permanentlyDeleteAll();
    });

    expect(success!).toBe(true);
    // permanentlyDeleteAll now fetches fresh assets from the service
    expect(mockService.getMarkedAssets).toHaveBeenCalled();
    expect(mockService.permanentlyDelete).toHaveBeenCalledWith([fakeAsset1]);
    expect(result.current.markedPhotos).toEqual([]);
    expect(result.current.markedCount).toBe(0);
  });

  it('restoreAll calls service and clears state', async () => {
    mockService.getMarkedAssets.mockResolvedValue([fakeAsset1, fakeAsset2]);
    mockService.getMarkedCount.mockResolvedValue(2);

    const { result } = renderHook(() => useDeletionAlbum());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.restoreAll();
    });

    expect(mockService.restoreAll).toHaveBeenCalledWith([fakeAsset1, fakeAsset2]);
    expect(result.current.markedPhotos).toEqual([]);
    expect(result.current.markedCount).toBe(0);
  });

  it('refresh reloads data from service', async () => {
    const { result } = renderHook(() => useDeletionAlbum());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockService.getMarkedAssets.mockResolvedValue([fakeAsset1, fakeAsset2]);
    mockService.getMarkedCount.mockResolvedValue(2);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.markedPhotos).toEqual([fakeAsset1, fakeAsset2]);
    expect(result.current.markedCount).toBe(2);
  });

  it('handles missing album gracefully', async () => {
    mockService.getMarkedAssets.mockResolvedValue([]);
    mockService.getMarkedCount.mockResolvedValue(0);

    const { result } = renderHook(() => useDeletionAlbum());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.markedPhotos).toEqual([]);
    expect(result.current.markedCount).toBe(0);
  });
});
