import * as MediaLibrary from 'expo-media-library';
import type { MonthBatch } from '../types';

const PAGE_SIZE = 500;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Returns the display name for a 1-based month number. */
export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? '';
}

/**
 * Paginate through all assets and group by year/month.
 * Returns MonthBatch[] sorted newest-first.
 * Month values are 1-based (1 = January, 12 = December).
 */
export async function getAvailableMonths(): Promise<MonthBatch[]> {
  const counts = new Map<string, { year: number; month: number; count: number }>();

  let hasNextPage = true;
  let endCursor: string | undefined;

  while (hasNextPage) {
    const page = await MediaLibrary.getAssetsAsync({
      sortBy: ['creationTime'],
      first: PAGE_SIZE,
      ...(endCursor ? { after: endCursor } : {}),
    });

    for (const asset of page.assets) {
      const date = new Date(asset.creationTime);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 1-based
      const key = `${year}-${month}`;

      const existing = counts.get(key);
      if (existing) {
        existing.count++;
      } else {
        counts.set(key, { year, month, count: 1 });
      }
    }

    hasNextPage = page.hasNextPage;
    endCursor = page.endCursor;
  }

  const batches = Array.from(counts.values());
  // Sort newest-first: by year desc, then month desc
  batches.sort((a, b) => b.year - a.year || b.month - a.month);
  return batches;
}

/**
 * Get all photos for a specific month.
 * @param year - The year
 * @param month - 1-based month (1 = January, 12 = December)
 */
export async function getPhotosForMonth(
  year: number,
  month: number,
): Promise<MediaLibrary.Asset[]> {
  const createdAfter = new Date(year, month - 1, 1).getTime();
  const createdBefore = new Date(year, month, 0, 23, 59, 59).getTime();

  const assets: MediaLibrary.Asset[] = [];
  let hasNextPage = true;
  let endCursor: string | undefined;

  while (hasNextPage) {
    const page = await MediaLibrary.getAssetsAsync({
      sortBy: ['creationTime'],
      first: PAGE_SIZE,
      createdAfter,
      createdBefore,
      ...(endCursor ? { after: endCursor } : {}),
    });

    assets.push(...page.assets);
    hasNextPage = page.hasNextPage;
    endCursor = page.endCursor;
  }

  return assets;
}
