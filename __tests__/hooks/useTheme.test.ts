import { useColorScheme } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { colors } from '../../constants/theme';
import { renderHook } from '@testing-library/react-native';

jest.mock('react-native', () => ({
  useColorScheme: jest.fn(),
}));

const mockedUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;

describe('useTheme', () => {
  it('returns light colors when color scheme is light', () => {
    mockedUseColorScheme.mockReturnValue('light');
    const { result } = renderHook(() => useTheme());
    expect(result.current).toBe(colors.light);
  });

  it('returns dark colors when color scheme is dark', () => {
    mockedUseColorScheme.mockReturnValue('dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current).toBe(colors.dark);
  });

  it('returns light colors when color scheme is null', () => {
    mockedUseColorScheme.mockReturnValue(null);
    const { result } = renderHook(() => useTheme());
    expect(result.current).toBe(colors.light);
  });
});
