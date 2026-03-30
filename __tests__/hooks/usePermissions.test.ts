import { renderHook, act, waitFor } from '@testing-library/react-native';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-media-library';
import { usePermissions } from '../../hooks/usePermissions';

jest.mock('expo-media-library');

const mockGetPermissions = getPermissionsAsync as jest.MockedFunction<typeof getPermissionsAsync>;
const mockRequestPermissions = requestPermissionsAsync as jest.MockedFunction<typeof requestPermissionsAsync>;

type MockPermissionResponse = {
  status: string;
  granted: boolean;
  canAskAgain: boolean;
  expires: string;
  accessPrivileges: string;
};

const makeResponse = (overrides: Partial<MockPermissionResponse> = {}): any => ({
  status: 'undetermined',
  granted: false,
  canAskAgain: true,
  expires: 'never',
  accessPrivileges: 'none',
  ...overrides,
});

describe('usePermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts in loading state', () => {
    mockGetPermissions.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.status).toBe('undetermined');
  });

  it('returns granted when permissions are granted', async () => {
    mockGetPermissions.mockResolvedValue(
      makeResponse({ granted: true, status: 'granted' }),
    );
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toBe('granted');
  });

  it('returns denied when permissions are denied and cannot ask again', async () => {
    mockGetPermissions.mockResolvedValue(
      makeResponse({ granted: false, canAskAgain: false, status: 'denied' }),
    );
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toBe('denied');
  });

  it('returns undetermined when not yet asked', async () => {
    mockGetPermissions.mockResolvedValue(
      makeResponse({ granted: false, canAskAgain: true }),
    );
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toBe('undetermined');
  });

  it('returns limited when access is limited', async () => {
    mockGetPermissions.mockResolvedValue(
      makeResponse({ granted: false, canAskAgain: true, accessPrivileges: 'limited' }),
    );
    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toBe('limited');
  });

  it('calls requestPermissionsAsync and updates status', async () => {
    mockGetPermissions.mockResolvedValue(makeResponse());
    mockRequestPermissions.mockResolvedValue(
      makeResponse({ granted: true, status: 'granted' }),
    );

    const { result } = renderHook(() => usePermissions());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toBe('undetermined');

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('granted');
  });
});
