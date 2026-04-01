/**
 * Represents a batch of photos grouped by month.
 * @property month - 1-based month number (1 = January, 12 = December)
 */
export type MonthBatch = {
  year: number;
  /** 1-based month number (1 = January, 12 = December) */
  month: number;
  count: number;
};

export type SwipeDirection = 'left' | 'right';

export type SwipeSession = {
  kept: number;
  deleted: number;
  total: number;
};

export type ReviewRecord = {
  year: number;
  /** 1-based month number (1 = January, 12 = December) */
  month: number;
  kept: number;
  deleted: number;
  total: number;
  /** ISO 8601 date string */
  reviewedAt: string;
};
