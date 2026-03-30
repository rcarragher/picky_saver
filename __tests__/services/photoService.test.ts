import { getAssetsAsync } from 'expo-media-library';
import { getAvailableMonths, getPhotosForMonth, getMonthName } from '../../services/photoService';

jest.mock('expo-media-library');

const mockGetAssets = getAssetsAsync as jest.MockedFunction<typeof getAssetsAsync>;

function makeAsset(creationTime: number, id = String(creationTime)): any {
  return { id, creationTime, uri: `file://${id}.jpg`, filename: `${id}.jpg` };
}

describe('photoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMonthName', () => {
    it('returns correct names for 1-based months', () => {
      expect(getMonthName(1)).toBe('January');
      expect(getMonthName(6)).toBe('June');
      expect(getMonthName(12)).toBe('December');
    });
  });

  describe('getAvailableMonths', () => {
    it('groups assets by month with 1-based month values', async () => {
      const jan2024 = new Date(2024, 0, 15).getTime(); // January = month 0
      const jan2024b = new Date(2024, 0, 20).getTime();
      const mar2024 = new Date(2024, 2, 5).getTime(); // March = month 2

      mockGetAssets.mockResolvedValue({
        assets: [makeAsset(jan2024, '1'), makeAsset(jan2024b, '2'), makeAsset(mar2024, '3')],
        hasNextPage: false,
        endCursor: '3',
        totalCount: 3,
      } as any);

      const result = await getAvailableMonths();

      expect(result).toEqual([
        { year: 2024, month: 3, count: 1 },  // March = 3 (1-based)
        { year: 2024, month: 1, count: 2 },  // January = 1 (1-based)
      ]);
    });

    it('sorts newest-first', async () => {
      const dec2023 = new Date(2023, 11, 1).getTime();
      const feb2024 = new Date(2024, 1, 1).getTime();

      mockGetAssets.mockResolvedValue({
        assets: [makeAsset(dec2023, '1'), makeAsset(feb2024, '2')],
        hasNextPage: false,
        endCursor: '2',
        totalCount: 2,
      } as any);

      const result = await getAvailableMonths();

      expect(result[0]).toEqual({ year: 2024, month: 2, count: 1 });
      expect(result[1]).toEqual({ year: 2023, month: 12, count: 1 });
    });

    it('handles empty library', async () => {
      mockGetAssets.mockResolvedValue({
        assets: [],
        hasNextPage: false,
        endCursor: '0',
        totalCount: 0,
      } as any);

      const result = await getAvailableMonths();
      expect(result).toEqual([]);
    });

    it('handles pagination (hasNextPage)', async () => {
      const jan = new Date(2024, 0, 10).getTime();
      const feb = new Date(2024, 1, 10).getTime();

      mockGetAssets
        .mockResolvedValueOnce({
          assets: [makeAsset(jan, '1')],
          hasNextPage: true,
          endCursor: '1',
          totalCount: 2,
        } as any)
        .mockResolvedValueOnce({
          assets: [makeAsset(feb, '2')],
          hasNextPage: false,
          endCursor: '2',
          totalCount: 2,
        } as any);

      const result = await getAvailableMonths();

      expect(mockGetAssets).toHaveBeenCalledTimes(2);
      // Second call should include the cursor
      expect(mockGetAssets).toHaveBeenLastCalledWith(
        expect.objectContaining({ after: '1' }),
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('getPhotosForMonth', () => {
    it('passes correct 0-based date params for a 1-based month input', async () => {
      mockGetAssets.mockResolvedValue({
        assets: [],
        hasNextPage: false,
        endCursor: '0',
        totalCount: 0,
      } as any);

      await getPhotosForMonth(2024, 3); // March, 1-based

      const callArgs = mockGetAssets.mock.calls[0][0] as any;
      // createdAfter should be March 1 (month index 2 in Date constructor)
      expect(callArgs.createdAfter).toBe(new Date(2024, 2, 1).getTime());
      // createdBefore should be March 31 23:59:59 (new Date(2024, 3, 0) = March 31)
      expect(callArgs.createdBefore).toBe(new Date(2024, 3, 0, 23, 59, 59).getTime());
    });

    it('returns assets from the response', async () => {
      const asset = makeAsset(new Date(2024, 2, 15).getTime(), 'photo1');
      mockGetAssets.mockResolvedValue({
        assets: [asset],
        hasNextPage: false,
        endCursor: '1',
        totalCount: 1,
      } as any);

      const result = await getPhotosForMonth(2024, 3);
      expect(result).toEqual([asset]);
    });

    it('paginates through all results', async () => {
      const a1 = makeAsset(Date.now(), '1');
      const a2 = makeAsset(Date.now(), '2');

      mockGetAssets
        .mockResolvedValueOnce({
          assets: [a1],
          hasNextPage: true,
          endCursor: '1',
          totalCount: 2,
        } as any)
        .mockResolvedValueOnce({
          assets: [a2],
          hasNextPage: false,
          endCursor: '2',
          totalCount: 2,
        } as any);

      const result = await getPhotosForMonth(2024, 1);
      expect(result).toEqual([a1, a2]);
      expect(mockGetAssets).toHaveBeenCalledTimes(2);
    });
  });
});
