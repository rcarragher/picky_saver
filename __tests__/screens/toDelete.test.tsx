import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import ToDeleteScreen from '../../app/to-delete';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush, replace: mockReplace }),
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

const mockRestore = jest.fn().mockResolvedValue(undefined);
const mockPermanentlyDeleteAll = jest.fn().mockResolvedValue(true);
const mockRefresh = jest.fn();

const makeAsset = (id: string) => ({
  id,
  uri: `file:///photos/${id}.jpg`,
  filename: `${id}.jpg`,
  mediaType: 'photo',
  width: 100,
  height: 100,
  creationTime: Date.now(),
  modificationTime: Date.now(),
  duration: 0,
});

let mockPhotos: any[] = [];
let mockCount = 0;
let mockIsLoading = false;

jest.mock('../../hooks/useDeletionAlbum', () => ({
  useDeletionAlbum: () => ({
    markedPhotos: mockPhotos,
    markedCount: mockCount,
    isLoading: mockIsLoading,
    restore: mockRestore,
    permanentlyDeleteAll: mockPermanentlyDeleteAll,
    refresh: mockRefresh,
    markForDeletion: jest.fn(),
  }),
}));

describe('ToDeleteScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockPhotos = [makeAsset('a1'), makeAsset('a2'), makeAsset('a3')];
    mockCount = 3;
    mockIsLoading = false;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders header with title and count badge', () => {
    const { getByText } = render(<ToDeleteScreen />);
    expect(getByText('To Be Deleted')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
  });

  it('renders grid of photos', () => {
    const { getByTestId } = render(<ToDeleteScreen />);
    expect(getByTestId('grid-photo-a1')).toBeTruthy();
    expect(getByTestId('grid-photo-a2')).toBeTruthy();
    expect(getByTestId('grid-photo-a3')).toBeTruthy();
  });

  it('renders delete all button with count', () => {
    const { getByTestId } = render(<ToDeleteScreen />);
    const button = getByTestId('delete-all-button');
    expect(button).toBeTruthy();
  });

  it('opens preview when tapping a photo', () => {
    const { getByTestId } = render(<ToDeleteScreen />);
    fireEvent.press(getByTestId('grid-photo-a1'));
    expect(getByTestId('preview-image')).toBeTruthy();
    expect(getByTestId('restore-button')).toBeTruthy();
  });

  it('closes preview when tapping close button', () => {
    const { getByTestId, queryByTestId } = render(<ToDeleteScreen />);
    fireEvent.press(getByTestId('grid-photo-a1'));
    expect(getByTestId('preview-image')).toBeTruthy();
    fireEvent.press(getByTestId('close-preview'));
    expect(queryByTestId('preview-image')).toBeNull();
  });

  it('calls restore when tapping Restore Photo', async () => {
    const { getByTestId } = render(<ToDeleteScreen />);
    fireEvent.press(getByTestId('grid-photo-a2'));
    await act(async () => {
      fireEvent.press(getByTestId('restore-button'));
    });
    expect(mockRestore).toHaveBeenCalledWith(mockPhotos[1]);
  });

  it('calls permanentlyDeleteAll when tapping Delete All', async () => {
    const { getByTestId } = render(<ToDeleteScreen />);
    await act(async () => {
      fireEvent.press(getByTestId('delete-all-button'));
    });
    expect(mockPermanentlyDeleteAll).toHaveBeenCalled();
  });

  it('shows success message and navigates home after delete all', async () => {
    const { getByTestId, getByText } = render(<ToDeleteScreen />);
    await act(async () => {
      fireEvent.press(getByTestId('delete-all-button'));
    });
    expect(getByText('Deleted 3 photos')).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('renders empty state when no photos marked', () => {
    mockPhotos = [];
    mockCount = 0;
    const { getByText, queryByTestId } = render(<ToDeleteScreen />);
    expect(getByText('Nothing here yet')).toBeTruthy();
    expect(getByText('Start organizing to mark photos for deletion.')).toBeTruthy();
    expect(getByText('Start Organizing')).toBeTruthy();
    expect(queryByTestId('delete-all-button')).toBeNull();
  });

  it('navigates to date picker from empty state', () => {
    mockPhotos = [];
    mockCount = 0;
    const { getByText } = render(<ToDeleteScreen />);
    fireEvent.press(getByText('Start Organizing'));
    expect(mockReplace).toHaveBeenCalledWith('/date-picker');
  });

  it('navigates back when pressing back arrow', () => {
    const { getByLabelText } = render(<ToDeleteScreen />);
    fireEvent.press(getByLabelText('Go back'));
    expect(mockBack).toHaveBeenCalled();
  });
});
