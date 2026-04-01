import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SummaryScreen from '../../app/summary';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({
    total: '25',
    kept: '18',
    deleted: '7',
    year: '2024',
    month: '3',
  }),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockSaveReview = jest.fn();
jest.mock('../../hooks/useReviewHistory', () => ({
  useReviewHistory: () => ({
    records: [],
    isLoading: false,
    saveReview: mockSaveReview,
    clearReview: jest.fn(),
    isReviewed: jest.fn(() => false),
    getRecord: jest.fn(() => undefined),
    refresh: jest.fn(),
  }),
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

describe('SummaryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the completion title', () => {
    const { getByText } = render(<SummaryScreen />);
    expect(getByText('Month Complete!')).toBeTruthy();
  });

  it('renders the total reviewed count', () => {
    const { getByText } = render(<SummaryScreen />);
    expect(getByText('You reviewed 25 photos')).toBeTruthy();
  });

  it('renders kept and deleted stats', () => {
    const { getByText } = render(<SummaryScreen />);
    expect(getByText('18')).toBeTruthy();
    expect(getByText('Kept')).toBeTruthy();
    expect(getByText('7')).toBeTruthy();
    expect(getByText('Marked for deletion')).toBeTruthy();
  });

  it('navigates to deletion review on "Review Deletions" press', () => {
    const { getByText } = render(<SummaryScreen />);
    fireEvent.press(getByText('Review Deletions'));
    expect(mockPush).toHaveBeenCalledWith('/to-delete');
  });

  it('navigates to home on "Back to Home" press', () => {
    const { getByText } = render(<SummaryScreen />);
    fireEvent.press(getByText('Back to Home'));
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('calls saveReview on mount with correct params', () => {
    render(<SummaryScreen />);
    expect(mockSaveReview).toHaveBeenCalledWith({
      year: 2024,
      month: 3,
      kept: 18,
      deleted: 7,
      total: 25,
    });
  });
});
