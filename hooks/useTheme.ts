import { useColorScheme } from 'react-native';
import { colors, type Colors } from '../constants/theme';

export function useTheme(): Colors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? colors.dark : colors.light;
}
