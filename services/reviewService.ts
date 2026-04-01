import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReviewRecord } from '../types';

const STORAGE_KEY = 'picky_saver_review_records';

export async function getReviewRecords(): Promise<ReviewRecord[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  if (!json) return [];
  return JSON.parse(json) as ReviewRecord[];
}

export async function getReviewRecord(
  year: number,
  month: number,
): Promise<ReviewRecord | null> {
  const records = await getReviewRecords();
  return records.find((r) => r.year === year && r.month === month) ?? null;
}

export async function saveReviewRecord(record: ReviewRecord): Promise<void> {
  const records = await getReviewRecords();
  const filtered = records.filter(
    (r) => !(r.year === record.year && r.month === record.month),
  );
  filtered.push(record);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export async function clearReviewRecord(
  year: number,
  month: number,
): Promise<void> {
  const records = await getReviewRecords();
  const filtered = records.filter(
    (r) => !(r.year === year && r.month === month),
  );
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export async function isMonthReviewed(
  year: number,
  month: number,
): Promise<boolean> {
  const record = await getReviewRecord(year, month);
  return record !== null;
}
