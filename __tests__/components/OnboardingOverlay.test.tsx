import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingOverlay, ONBOARDING_KEY } from '../../components/OnboardingOverlay';

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

describe('OnboardingOverlay', () => {
  const mockDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('renders instruction text', () => {
    const { getByText } = render(<OnboardingOverlay onDismiss={mockDismiss} />);
    expect(getByText(/Swipe left to delete/)).toBeTruthy();
    expect(getByText(/Swipe right to keep/)).toBeTruthy();
    expect(getByText('You can undo anytime')).toBeTruthy();
  });

  it('renders Got it! button', () => {
    const { getByText } = render(<OnboardingOverlay onDismiss={mockDismiss} />);
    expect(getByText('Got it!')).toBeTruthy();
  });

  it('renders Skip button', () => {
    const { getByText } = render(<OnboardingOverlay onDismiss={mockDismiss} />);
    expect(getByText('Skip')).toBeTruthy();
  });

  it('Got it! dismisses and saves flag', async () => {
    const { getByLabelText } = render(<OnboardingOverlay onDismiss={mockDismiss} />);
    fireEvent.press(getByLabelText('Dismiss onboarding'));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(ONBOARDING_KEY, 'true');
    });
    expect(mockDismiss).toHaveBeenCalled();
  });

  it('Skip dismisses and saves flag', async () => {
    const { getByLabelText } = render(<OnboardingOverlay onDismiss={mockDismiss} />);
    fireEvent.press(getByLabelText('Skip onboarding'));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(ONBOARDING_KEY, 'true');
    });
    expect(mockDismiss).toHaveBeenCalled();
  });
});
