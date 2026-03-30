export type Colors = {
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  keep: string;
  delete: string;
  border: string;
};

const lightColors: Colors = {
  background: '#FAFAF8',
  surface: '#F2F0EC',
  textPrimary: '#1C1C1E',
  textSecondary: '#6B6B6B',
  accent: '#E8725A',
  keep: '#4CAF7D',
  delete: '#E05555',
  border: '#E5E3DF',
};

const darkColors: Colors = {
  background: '#141414',
  surface: '#1E1E1E',
  textPrimary: '#F0F0F0',
  textSecondary: '#9A9A9A',
  accent: '#E8725A',
  keep: '#5BC88A',
  delete: '#E86060',
  border: '#2A2A2A',
};

export const colors = {
  light: lightColors,
  dark: darkColors,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fontSize = {
  h1: 28,
  h2: 22,
  body: 17,
  caption: 14,
  small: 12,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

export const screenMargin = 20;

export const touchTarget = {
  min: 48,
} as const;
