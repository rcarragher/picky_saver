import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SwipeScreen from '../../app/swipe/[year]/[month]';
import { useMonthPhotos } from '../../hooks/usePhotos';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ year: '2024', month: '3' }),
  useRouter: () => ({ push: mockPush, back: mockBack, replace: mockReplace }),
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

jest.mock('../../hooks/usePhotos');
const mockUseMonthPhotos = useMonthPhotos as jest.MockedFunction<typeof useMonthPhotos>;

const makePhotos = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `asset-${i}`,
    uri: `file:///photo-${i}.jpg`,
    width: 1080,
    height: 1920,
    filename: `photo-${i}.jpg`,
    mediaType: 'photo' as const,
    creationTime: Date.now(),
    modificationTime: Date.now(),
    duration: 0,
  }));

describe('SwipeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state', () => {
    mockUseMonthPhotos.mockReturnValue({
      photos: [],
      isLoading: true,
      error: null,
    });

    const { queryByTestId } = render(<SwipeScreen />);
    expect(queryByTestId('photo-card')).toBeNull();
  });

  it('renders header with month name and year', () => {
    mockUseMonthPhotos.mockReturnValue({
      photos: makePhotos(5),
      isLoading: false,
      error: null,
    });

    const { getByText } = render(<SwipeScreen />);
    expect(getByText('March 2024')).toBeTruthy();
  });

  it('shows progress counter', () => {
    mockUseMonthPhotos.mockReturnValue({
      photos: makePhotos(10),
      isLoading: false,
      error: null,
    });

    const { getByText } = render(<SwipeScreen />);
    expect(getByText('1/10')).toBeTruthy();
  });

  it('renders current photo card', () => {
    mockUseMonthPhotos.mockReturnValue({
      photos: makePhotos(3),
      isLoading: false,
      error: null,
    });

    const { getByTestId } = render(<SwipeScreen />);
    expect(getByTestId('photo-card')).toBeTruthy();
  });

  it('advances on keep button press', () => {
    mockUseMonthPhotos.mockReturnValue({
      photos: makePhotos(5),
      isLoading: false,
      error: null,
    });

    const { getByLabelText, getByText } = render(<SwipeScreen />);
    fireEvent.press(getByLabelText('Keep this photo'));
    expect(getByText('2/5')).toBeTruthy();
  });

  it('advances on delete button press', () => {
    mockUseMonthPhotos.mockReturnValue({
      photos: makePhotos(5),
      isLoading: false,
      error: null,
    });

    const { getByLabelText, getByText } = render(<SwipeScreen />);
    fireEvent.press(getByLabelText('Delete this photo'));
    expect(getByText('2/5')).toBeTruthy();
  });

  it('undo reverses last keep action', () => {
    mockUseMonthPhotos.mockReturnValue({
      photos: makePhotos(5),
      isLoading: false,
      error: null,
    });

    const { getByLabelText, getByText } = render(<SwipeScreen />);
    fireEvent.press(getByLabelText('Keep this photo'));
    expect(getByText('2/5')).toBeTruthy();

    fireEvent.press(getByLabelText('Undo last action'));
    expect(getByText('1/5')).toBeTruthy();
  });

  it('undo reverses last delete action', () => {
    mockUseMonthPhotos.mockReturnValue({
      photos: makePhotos(5),
      isLoading: false,
      error: null,
    });

    const { getByLabelText, getByText } = render(<SwipeScreen />);
    fireEvent.press(getByLabelText('Delete this photo'));
    expect(getByText('2/5')).toBeTruthy();

    fireEvent.press(getByLabelText('Undo last action'));
    expect(getByText('1/5')).toBeTruthy();
  });

  it('shows hint text', () => {
    mockUseMonthPhotos.mockReturnValue({
      photos: makePhotos(3),
      isLoading: false,
      error: null,
    });

    const { getByText } = render(<SwipeScreen />);
    expect(getByText(/DELETE.*KEEP/)).toBeTruthy();
  });

  it('navigates to summary when all photos are swiped', () => {
    mockUseMonthPhotos.mockReturnValue({
      photos: makePhotos(2),
      isLoading: false,
      error: null,
    });

    const { getByLabelText } = render(<SwipeScreen />);
    fireEvent.press(getByLabelText('Keep this photo'));
    fireEvent.press(getByLabelText('Delete this photo'));

    expect(mockReplace).toHaveBeenCalledWith('/summary?total=2&kept=1&deleted=1&year=2024&month=3');
  });

  it('navigates back when back arrow is pressed', () => {
    mockUseMonthPhotos.mockReturnValue({
      photos: makePhotos(3),
      isLoading: false,
      error: null,
    });

    const { getByLabelText } = render(<SwipeScreen />);
    fireEvent.press(getByLabelText('Go back'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('shows error state when photo loading fails', () => {
    mockUseMonthPhotos.mockReturnValue({
      photos: [],
      isLoading: false,
      error: new Error('Load failed'),
    });

    const { getByText } = render(<SwipeScreen />);
    expect(getByText('Failed to load photos')).toBeTruthy();
  });

  it('renders delete and keep tap buttons', () => {
    mockUseMonthPhotos.mockReturnValue({
      photos: makePhotos(3),
      isLoading: false,
      error: null,
    });

    const { getByLabelText } = render(<SwipeScreen />);
    expect(getByLabelText('Delete this photo')).toBeTruthy();
    expect(getByLabelText('Keep this photo')).toBeTruthy();
  });
});
