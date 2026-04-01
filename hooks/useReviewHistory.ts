import { useCallback, useEffect, useState } from 'react';
import { ReviewRecord } from '../types';
import {
  getReviewRecords,
  saveReviewRecord,
  clearReviewRecord,
} from '../services/reviewService';

export function useReviewHistory() {
  const [records, setRecords] = useState<ReviewRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await getReviewRecords();
      all.sort(
        (a, b) =>
          new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime(),
      );
      setRecords(all);
    } catch {
      // Silently handle — storage may be empty or corrupt
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveReview = useCallback(
    async (data: Omit<ReviewRecord, 'reviewedAt'>) => {
      await saveReviewRecord({
        ...data,
        reviewedAt: new Date().toISOString(),
      });
      await refresh();
    },
    [refresh],
  );

  const clearReview = useCallback(
    async (year: number, month: number) => {
      await clearReviewRecord(year, month);
      await refresh();
    },
    [refresh],
  );

  const isReviewed = useCallback(
    (year: number, month: number): boolean => {
      return records.some((r) => r.year === year && r.month === month);
    },
    [records],
  );

  const getRecord = useCallback(
    (year: number, month: number): ReviewRecord | undefined => {
      return records.find((r) => r.year === year && r.month === month);
    },
    [records],
  );

  return {
    records,
    isLoading,
    refresh,
    saveReview,
    clearReview,
    isReviewed,
    getRecord,
  };
}
