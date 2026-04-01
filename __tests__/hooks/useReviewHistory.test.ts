import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useReviewHistory } from '../../hooks/useReviewHistory';
import * as reviewService from '../../services/reviewService';

jest.mock('../../services/reviewService');

const mockService = reviewService as jest.Mocked<typeof reviewService>;

const fakeRecord1 = {
  year: 2026,
  month: 1,
  kept: 40,
  deleted: 12,
  total: 52,
  reviewedAt: '2026-01-15T10:00:00.000Z',
};

const fakeRecord2 = {
  year: 2026,
  month: 3,
  kept: 30,
  deleted: 5,
  total: 35,
  reviewedAt: '2026-03-20T14:00:00.000Z',
};

describe('useReviewHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockService.getReviewRecords.mockResolvedValue([fakeRecord1, fakeRecord2]);
    mockService.saveReviewRecord.mockResolvedValue(undefined);
    mockService.clearReviewRecord.mockResolvedValue(undefined);
  });

  it('loads records on mount and sets isLoading correctly', async () => {
    const { result } = renderHook(() => useReviewHistory());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.records).toHaveLength(2);
  });

  it('sorts records by reviewedAt descending', async () => {
    const { result } = renderHook(() => useReviewHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // fakeRecord2 (March, later date) should come first
    expect(result.current.records[0].month).toBe(3);
    expect(result.current.records[1].month).toBe(1);
  });

  it('saveReview calls service with reviewedAt added, then refreshes state', async () => {
    mockService.getReviewRecords.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useReviewHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newRecord = { year: 2026, month: 5, kept: 20, deleted: 3, total: 23 };
    const savedRecord = { ...newRecord, reviewedAt: '2026-05-01T12:00:00.000Z' };
    mockService.getReviewRecords.mockResolvedValue([savedRecord]);

    await act(async () => {
      await result.current.saveReview(newRecord);
    });

    expect(mockService.saveReviewRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        year: 2026,
        month: 5,
        kept: 20,
        deleted: 3,
        total: 23,
        reviewedAt: expect.any(String),
      }),
    );
    // refresh was called — records updated
    expect(result.current.records).toHaveLength(1);
  });

  it('clearReview calls service and refreshes state', async () => {
    const { result } = renderHook(() => useReviewHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // After clearing, only fakeRecord2 remains
    mockService.getReviewRecords.mockResolvedValue([fakeRecord2]);

    await act(async () => {
      await result.current.clearReview(2026, 1);
    });

    expect(mockService.clearReviewRecord).toHaveBeenCalledWith(2026, 1);
    expect(result.current.records).toHaveLength(1);
    expect(result.current.records[0].month).toBe(3);
  });

  it('isReviewed returns true for existing record, false for non-existent', async () => {
    const { result } = renderHook(() => useReviewHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isReviewed(2026, 1)).toBe(true);
    expect(result.current.isReviewed(2026, 3)).toBe(true);
    expect(result.current.isReviewed(2026, 6)).toBe(false);
    expect(result.current.isReviewed(2025, 1)).toBe(false);
  });

  it('getRecord returns matching record or undefined', async () => {
    const { result } = renderHook(() => useReviewHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.getRecord(2026, 1)).toEqual(fakeRecord1);
    expect(result.current.getRecord(2026, 3)).toEqual(fakeRecord2);
    expect(result.current.getRecord(2026, 6)).toBeUndefined();
  });

  it('refresh reloads from service', async () => {
    const { result } = renderHook(() => useReviewHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newRecord = {
      year: 2025,
      month: 12,
      kept: 10,
      deleted: 2,
      total: 12,
      reviewedAt: '2025-12-31T23:59:00.000Z',
    };
    mockService.getReviewRecords.mockResolvedValue([
      fakeRecord1,
      fakeRecord2,
      newRecord,
    ]);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.records).toHaveLength(3);
  });
});
