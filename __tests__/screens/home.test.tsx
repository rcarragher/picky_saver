import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../../app/index';

const mockPush = jest.fn();

let focusCallback: (() => void) | null = null;
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (cb: () => void) => {
    // Capture the callback so we can simulate focus events
    focusCallback = cb;
    // Call it on mount like the real implementation does
    cb();
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    background: '#FAFAF8',
    surface: '#F2F0EC',
    textPrimary: '#1C1C1E',
    textSecondary: '#6B6B6B',
    accent: '#E8725A',
    keep: '#4CAF7D',
    delete: '#E05555',
    border: '#E5E3DF',
  }),
}));

jest.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    status: 'granted',
    requestPermission: jest.fn(),
    isLoading: false,
  }),
}));

const mockUseDeletionAlbum = jest.fn();
jest.mock('../../hooks/useDeletionAlbum', () => ({
  useDeletionAlbum: () => mockUseDeletionAlbum(),
}));

const mockUseAvailableMonths = jest.fn();
jest.mock('../../hooks/usePhotos', () => ({
  useAvailableMonths: () => mockUseAvailableMonths(),
}));

const mockUseReviewHistory = jest.fn();
jest.mock('../../hooks/useReviewHistory', () => ({
  useReviewHistory: () => mockUseReviewHistory(),
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDeletionAlbum.mockReturnValue({
      markedCount: 5,
      isLoading: false,
      refresh: jest.fn(),
    });
    mockUseAvailableMonths.mockReturnValue({
      months: [{ year: 2024, month: 3, count: 20 }],
      isLoading: false,
      refresh: jest.fn(),
    });
    mockUseReviewHistory.mockReturnValue({
      records: [],
      isLoading: false,
      refresh: jest.fn(),
      saveReview: jest.fn(),
      clearReview: jest.fn(),
      isReviewed: jest.fn(() => false),
      getRecord: jest.fn(() => undefined),
    });
  });

  it('renders title and tagline', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Picky Saver')).toBeTruthy();
    expect(
      getByText('Organize your photos, one swipe at a time'),
    ).toBeTruthy();
  });

  it('shows both buttons when there are photos and marked deletions', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Start Organizing →')).toBeTruthy();
    expect(getByText('To Be Deleted (5 photos)')).toBeTruthy();
  });

  it('hides deletion button when count is 0', () => {
    mockUseDeletionAlbum.mockReturnValue({
      markedCount: 0,
      isLoading: false,
      refresh: jest.fn(),
    });
    const { getByText, queryByText } = render(<HomeScreen />);
    expect(getByText('Start Organizing →')).toBeTruthy();
    expect(queryByText(/To Be Deleted/)).toBeNull();
  });

  it('navigates to date picker on Start Organizing press', () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Start Organizing →'));
    expect(mockPush).toHaveBeenCalledWith('/date-picker');
  });

  it('navigates to to-delete on deletion button press', () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('To Be Deleted (5 photos)'));
    expect(mockPush).toHaveBeenCalledWith('/to-delete');
  });

  it('refreshes deletion count when screen gains focus', () => {
    const mockRefreshDeletion = jest.fn();
    const mockRefreshMonths = jest.fn();
    mockUseDeletionAlbum.mockReturnValue({
      markedCount: 5,
      isLoading: false,
      refresh: mockRefreshDeletion,
    });
    mockUseAvailableMonths.mockReturnValue({
      months: [{ year: 2024, month: 3, count: 20 }],
      isLoading: false,
      refresh: mockRefreshMonths,
    });

    render(<HomeScreen />);

    // Clear calls from initial mount/focus
    mockRefreshDeletion.mockClear();
    mockRefreshMonths.mockClear();

    // Simulate screen regaining focus (e.g., navigating back from to-delete)
    expect(focusCallback).not.toBeNull();
    focusCallback!();

    expect(mockRefreshDeletion).toHaveBeenCalled();
    expect(mockRefreshMonths).toHaveBeenCalled();
  });

  it('shows empty state when no photos on device', () => {
    mockUseAvailableMonths.mockReturnValue({
      months: [],
      isLoading: false,
      refresh: jest.fn(),
    });
    mockUseDeletionAlbum.mockReturnValue({
      markedCount: 0,
      isLoading: false,
      refresh: jest.fn(),
    });
    const { getByText, queryByText } = render(<HomeScreen />);
    expect(getByText('No photos found on this device')).toBeTruthy();
    expect(queryByText('Start Organizing →')).toBeNull();
  });

  it('shows Review History button when records exist', () => {
    mockUseReviewHistory.mockReturnValue({
      records: [{ year: 2024, month: 3, kept: 18, deleted: 7, total: 25, reviewedAt: '2024-03-15T10:00:00.000Z' }],
      isLoading: false,
      refresh: jest.fn(),
      saveReview: jest.fn(),
      clearReview: jest.fn(),
      isReviewed: jest.fn(() => true),
      getRecord: jest.fn(),
    });
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Review History')).toBeTruthy();
  });

  it('hides Review History button when no records', () => {
    const { queryByText } = render(<HomeScreen />);
    expect(queryByText('Review History')).toBeNull();
  });

  it('navigates to /history on Review History press', () => {
    mockUseReviewHistory.mockReturnValue({
      records: [{ year: 2024, month: 3, kept: 18, deleted: 7, total: 25, reviewedAt: '2024-03-15T10:00:00.000Z' }],
      isLoading: false,
      refresh: jest.fn(),
      saveReview: jest.fn(),
      clearReview: jest.fn(),
      isReviewed: jest.fn(() => true),
      getRecord: jest.fn(),
    });
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Review History'));
    expect(mockPush).toHaveBeenCalledWith('/history');
  });
});
