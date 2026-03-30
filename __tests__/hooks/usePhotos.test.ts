import { renderHook, waitFor } from '@testing-library/react-native';
import { getAvailableMonths, getPhotosForMonth } from '../../services/photoService';
import { useAvailableMonths, useMonthPhotos } from '../../hooks/usePhotos';

jest.mock('../../services/photoService');

const mockGetAvailableMonths = getAvailableMonths as jest.MockedFunction<typeof getAvailableMonths>;
const mockGetPhotosForMonth = getPhotosForMonth as jest.MockedFunction<typeof getPhotosForMonth>;

describe('useAvailableMonths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts in loading state', () => {
    mockGetAvailableMonths.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useAvailableMonths());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.months).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('returns months after loading', async () => {
    const months = [
      { year: 2024, month: 3, count: 10 },
      { year: 2024, month: 1, count: 5 },
    ];
    mockGetAvailableMonths.mockResolvedValue(months);

    const { result } = renderHook(() => useAvailableMonths());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.months).toEqual(months);
    expect(result.current.error).toBeNull();
  });

  it('returns error on failure', async () => {
    mockGetAvailableMonths.mockRejectedValue(new Error('Permission denied'));

    const { result } = renderHook(() => useAvailableMonths());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Permission denied');
    expect(result.current.months).toEqual([]);
  });
});

describe('useMonthPhotos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts in loading state', () => {
    mockGetPhotosForMonth.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useMonthPhotos(2024, 3));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.photos).toEqual([]);
  });

  it('returns photos after loading', async () => {
    const photos = [{ id: '1', uri: 'file://1.jpg' }] as any;
    mockGetPhotosForMonth.mockResolvedValue(photos);

    const { result } = renderHook(() => useMonthPhotos(2024, 3));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.photos).toEqual(photos);
    expect(result.current.error).toBeNull();
  });

  it('returns error on failure', async () => {
    mockGetPhotosForMonth.mockRejectedValue(new Error('Load failed'));

    const { result } = renderHook(() => useMonthPhotos(2024, 3));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error?.message).toBe('Load failed');
  });

  it('calls getPhotosForMonth with correct year and month', async () => {
    mockGetPhotosForMonth.mockResolvedValue([]);

    renderHook(() => useMonthPhotos(2023, 12));
    await waitFor(() => expect(mockGetPhotosForMonth).toHaveBeenCalled());

    expect(mockGetPhotosForMonth).toHaveBeenCalledWith(2023, 12);
  });
});
