import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getReviewRecords,
  getReviewRecord,
  saveReviewRecord,
  clearReviewRecord,
  isMonthReviewed,
} from '../../services/reviewService';
import { ReviewRecord } from '../../types';

const fakeRecord: ReviewRecord = {
  year: 2026,
  month: 1,
  kept: 40,
  deleted: 12,
  total: 52,
  reviewedAt: '2026-01-15T14:30:00.000Z',
};

const fakeRecord2: ReviewRecord = {
  year: 2026,
  month: 3,
  kept: 30,
  deleted: 5,
  total: 35,
  reviewedAt: '2026-03-20T10:00:00.000Z',
};

describe('reviewService', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  describe('getReviewRecords', () => {
    it('returns [] when no data stored', async () => {
      const records = await getReviewRecords();
      expect(records).toEqual([]);
    });

    it('returns parsed records when data exists', async () => {
      await AsyncStorage.setItem(
        'picky_saver_review_records',
        JSON.stringify([fakeRecord, fakeRecord2]),
      );
      const records = await getReviewRecords();
      expect(records).toEqual([fakeRecord, fakeRecord2]);
    });
  });

  describe('saveReviewRecord', () => {
    it('stores and retrieves a record', async () => {
      await saveReviewRecord(fakeRecord);
      const records = await getReviewRecords();
      expect(records).toEqual([fakeRecord]);
    });

    it('upserts — saving for same year+month overwrites previous record', async () => {
      await saveReviewRecord(fakeRecord);
      const updated: ReviewRecord = {
        ...fakeRecord,
        kept: 45,
        deleted: 7,
        reviewedAt: '2026-01-20T10:00:00.000Z',
      };
      await saveReviewRecord(updated);
      const records = await getReviewRecords();
      expect(records).toHaveLength(1);
      expect(records[0].kept).toBe(45);
      expect(records[0].deleted).toBe(7);
    });
  });

  describe('getReviewRecord', () => {
    it('returns matching record', async () => {
      await saveReviewRecord(fakeRecord);
      await saveReviewRecord(fakeRecord2);
      const record = await getReviewRecord(2026, 3);
      expect(record).toEqual(fakeRecord2);
    });

    it('returns null for non-existent month', async () => {
      await saveReviewRecord(fakeRecord);
      const record = await getReviewRecord(2026, 6);
      expect(record).toBeNull();
    });
  });

  describe('clearReviewRecord', () => {
    it('removes only the target month, leaves others intact', async () => {
      await saveReviewRecord(fakeRecord);
      await saveReviewRecord(fakeRecord2);
      await clearReviewRecord(2026, 1);
      const records = await getReviewRecords();
      expect(records).toHaveLength(1);
      expect(records[0]).toEqual(fakeRecord2);
    });

    it('is a no-op when record does not exist', async () => {
      await saveReviewRecord(fakeRecord);
      await clearReviewRecord(2025, 12);
      const records = await getReviewRecords();
      expect(records).toHaveLength(1);
      expect(records[0]).toEqual(fakeRecord);
    });
  });

  describe('isMonthReviewed', () => {
    it('returns true when record exists', async () => {
      await saveReviewRecord(fakeRecord);
      const result = await isMonthReviewed(2026, 1);
      expect(result).toBe(true);
    });

    it('returns false when record does not exist', async () => {
      const result = await isMonthReviewed(2026, 6);
      expect(result).toBe(false);
    });
  });
});
