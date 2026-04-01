import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import HistoryScreen from '../../app/history';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useFocusEffect: jest.fn(),
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

const mockUseReviewHistory = jest.fn();
jest.mock('../../hooks/useReviewHistory', () => ({
  useReviewHistory: () => mockUseReviewHistory(),
}));

const fakeRecords = [
  {
    year: 2026,
    month: 3,
    kept: 40,
    deleted: 12,
    total: 52,
    reviewedAt: '2026-03-15T10:00:00.000Z',
  },
  {
    year: 2026,
    month: 1,
    kept: 30,
    deleted: 5,
    total: 35,
    reviewedAt: '2026-01-20T10:00:00.000Z',
  },
  {
    year: 2025,
    month: 12,
    kept: 20,
    deleted: 8,
    total: 28,
    reviewedAt: '2025-12-10T10:00:00.000Z',
  },
];

describe('HistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseReviewHistory.mockReturnValue({
      records: fakeRecords,
      isLoading: false,
      refresh: jest.fn(),
      saveReview: jest.fn(),
      clearReview: jest.fn(),
      isReviewed: jest.fn(),
      getRecord: jest.fn(),
    });
  });

  it('renders "Review History" header', () => {
    const { getByText } = render(<HistoryScreen />);
    expect(getByText('Review History')).toBeTruthy();
  });

  it('renders summary banner with correct totals', () => {
    const { getByText } = render(<HistoryScreen />);
    expect(getByText('🎯  3 months reviewed')).toBeTruthy();
    expect(getByText('90 kept')).toBeTruthy();
    expect(getByText('25 deleted')).toBeTruthy();
  });

  it('renders HistoryTile for each record', () => {
    const { getByText } = render(<HistoryScreen />);
    expect(getByText('March')).toBeTruthy();
    expect(getByText('January')).toBeTruthy();
    expect(getByText('December')).toBeTruthy();
  });

  it('shows empty state when no records', () => {
    mockUseReviewHistory.mockReturnValue({
      records: [],
      isLoading: false,
      refresh: jest.fn(),
      saveReview: jest.fn(),
      clearReview: jest.fn(),
      isReviewed: jest.fn(),
      getRecord: jest.fn(),
    });
    const { getByText, queryByText } = render(<HistoryScreen />);
    expect(getByText('No months reviewed yet')).toBeTruthy();
    expect(getByText('Start Organizing →')).toBeTruthy();
    expect(queryByText('months reviewed')).toBeNull();
  });

  it('"Review Again" navigates to correct swipe route', () => {
    const { getAllByLabelText } = render(<HistoryScreen />);
    const reviewAgainButtons = getAllByLabelText('Review Again');
    fireEvent.press(reviewAgainButtons[0]);
    expect(mockPush).toHaveBeenCalledWith('/swipe/2026/3');
  });

  it('"Clear" shows confirmation alert', () => {
    jest.spyOn(Alert, 'alert');
    const { getAllByLabelText } = render(<HistoryScreen />);
    const clearButtons = getAllByLabelText('Clear');
    fireEvent.press(clearButtons[0]);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Clear?',
      expect.stringContaining('March 2026'),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({ text: 'Clear', style: 'destructive' }),
      ]),
    );
  });

  it('"Clear" confirmation calls clearReview', () => {
    const mockClearReview = jest.fn();
    mockUseReviewHistory.mockReturnValue({
      records: fakeRecords,
      isLoading: false,
      refresh: jest.fn(),
      saveReview: jest.fn(),
      clearReview: mockClearReview,
      isReviewed: jest.fn(),
      getRecord: jest.fn(),
    });
    jest.spyOn(Alert, 'alert');
    const { getAllByLabelText } = render(<HistoryScreen />);
    const clearButtons = getAllByLabelText('Clear');
    fireEvent.press(clearButtons[0]);

    // Simulate pressing the destructive "Clear" button
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const destructiveButton = alertCall[2].find(
      (b: any) => b.style === 'destructive',
    );
    destructiveButton.onPress();
    expect(mockClearReview).toHaveBeenCalledWith(2026, 3);
  });

  it('empty state "Start Organizing" navigates to date picker', () => {
    mockUseReviewHistory.mockReturnValue({
      records: [],
      isLoading: false,
      refresh: jest.fn(),
      saveReview: jest.fn(),
      clearReview: jest.fn(),
      isReviewed: jest.fn(),
      getRecord: jest.fn(),
    });
    const { getByText } = render(<HistoryScreen />);
    fireEvent.press(getByText('Start Organizing →'));
    expect(mockPush).toHaveBeenCalledWith('/date-picker');
  });
});
