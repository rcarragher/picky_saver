import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Linking, Text } from 'react-native';
import { PermissionGate } from '../../components/PermissionGate';
import { usePermissions } from '../../hooks/usePermissions';

jest.mock('../../hooks/usePermissions');
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

const mockUsePermissions = usePermissions as jest.MockedFunction<typeof usePermissions>;
const mockRequestPermission = jest.fn();

function setPermissionState(
  status: 'granted' | 'denied' | 'undetermined' | 'limited',
  isLoading = false,
) {
  mockUsePermissions.mockReturnValue({
    status,
    requestPermission: mockRequestPermission,
    isLoading,
  });
}

describe('PermissionGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when permission is granted', () => {
    setPermissionState('granted');
    const { getByText } = render(
      <PermissionGate>
        <Text>Child content</Text>
      </PermissionGate>,
    );
    expect(getByText('Child content')).toBeTruthy();
  });

  it('shows loading indicator when loading', () => {
    setPermissionState('undetermined', true);
    const { queryByText } = render(
      <PermissionGate>
        <Text>Child content</Text>
      </PermissionGate>,
    );
    expect(queryByText('Child content')).toBeNull();
  });

  it('shows request button when permission is undetermined', () => {
    setPermissionState('undetermined');
    const { getByText, queryByText } = render(
      <PermissionGate>
        <Text>Child content</Text>
      </PermissionGate>,
    );
    expect(queryByText('Child content')).toBeNull();
    expect(getByText('Allow Access')).toBeTruthy();
    expect(getByText('Access Your Photos')).toBeTruthy();
  });

  it('calls requestPermission when Allow Access is pressed', () => {
    setPermissionState('undetermined');
    const { getByText } = render(
      <PermissionGate>
        <Text>Child content</Text>
      </PermissionGate>,
    );
    fireEvent.press(getByText('Allow Access'));
    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
  });

  it('shows settings button when permission is denied', () => {
    setPermissionState('denied');
    const { getByText, queryByText } = render(
      <PermissionGate>
        <Text>Child content</Text>
      </PermissionGate>,
    );
    expect(queryByText('Child content')).toBeNull();
    expect(getByText('Open Settings')).toBeTruthy();
    expect(getByText('Photo Access Required')).toBeTruthy();
  });

  it('opens settings when Open Settings is pressed (denied)', () => {
    setPermissionState('denied');
    jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined as never);
    const { getByText } = render(
      <PermissionGate>
        <Text>Child content</Text>
      </PermissionGate>,
    );
    fireEvent.press(getByText('Open Settings'));
    expect(Linking.openSettings).toHaveBeenCalled();
  });

  it('renders children with banner when permission is limited', () => {
    setPermissionState('limited');
    const { getByText } = render(
      <PermissionGate>
        <Text>Child content</Text>
      </PermissionGate>,
    );
    expect(getByText('Child content')).toBeTruthy();
    expect(getByText(/allow full photo access/i)).toBeTruthy();
  });
});
