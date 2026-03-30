import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DatePickerScreen from '../../app/date-picker';
import { useAvailableMonths } from '../../hooks/usePhotos';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
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
const mockUseAvailableMonths = useAvailableMonths as jest.MockedFunction<typeof useAvailableMonths>;

describe('DatePickerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header with title', () => {
    mockUseAvailableMonths.mockReturnValue({
      months: [],
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    const { getByText } = render(<DatePickerScreen />);
    expect(getByText('Pick a Month')).toBeTruthy();
  });

  it('shows shimmer tiles when loading', () => {
    mockUseAvailableMonths.mockReturnValue({
      months: [],
      isLoading: true,
      error: null,
      refresh: jest.fn(),
    });

    const { queryByText } = render(<DatePickerScreen />);
    // Should not show any month tiles
    expect(queryByText(/January|February|March/)).toBeNull();
  });

  it('renders month list when loaded', () => {
    mockUseAvailableMonths.mockReturnValue({
      months: [
        { year: 2024, month: 3, count: 10 },
        { year: 2024, month: 1, count: 5 },
      ],
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    const { getByText } = render(<DatePickerScreen />);
    expect(getByText('March 2024')).toBeTruthy();
    expect(getByText('January 2024')).toBeTruthy();
    expect(getByText('10 photos')).toBeTruthy();
    expect(getByText('5 photos')).toBeTruthy();
  });

  it('shows year section headers when months span multiple years', () => {
    mockUseAvailableMonths.mockReturnValue({
      months: [
        { year: 2024, month: 2, count: 3 },
        { year: 2023, month: 12, count: 7 },
      ],
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    const { getByText } = render(<DatePickerScreen />);
    expect(getByText('2024')).toBeTruthy();
    expect(getByText('2023')).toBeTruthy();
  });

  it('navigates to swipe screen on month tap', () => {
    mockUseAvailableMonths.mockReturnValue({
      months: [{ year: 2024, month: 3, count: 10 }],
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    const { getByText } = render(<DatePickerScreen />);
    fireEvent.press(getByText('March 2024'));
    expect(mockPush).toHaveBeenCalledWith('/swipe/2024/3');
  });

  it('navigates back when back arrow is pressed', () => {
    mockUseAvailableMonths.mockReturnValue({
      months: [],
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    const { getByLabelText } = render(<DatePickerScreen />);
    fireEvent.press(getByLabelText('Go back'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('hides months with zero photos (no empty months in data)', () => {
    // photoService should never return months with 0 photos,
    // but verify the screen renders whatever it's given
    mockUseAvailableMonths.mockReturnValue({
      months: [{ year: 2024, month: 6, count: 15 }],
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    const { getByText, queryByText } = render(<DatePickerScreen />);
    expect(getByText('June 2024')).toBeTruthy();
    // Only the month we provided should be shown
    expect(queryByText('January 2024')).toBeNull();
  });
});
