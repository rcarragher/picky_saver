import React from 'react';
import { render } from '@testing-library/react-native';
import { PhotoCard } from '../../components/PhotoCard';

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

const mockAsset = {
  id: 'asset-1',
  uri: 'file:///photo1.jpg',
  width: 1080,
  height: 1920,
};

describe('PhotoCard', () => {
  const defaultProps = {
    asset: mockAsset,
    onSwipeLeft: jest.fn(),
    onSwipeRight: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the photo image', () => {
    const { getByTestId } = render(<PhotoCard {...defaultProps} />);
    expect(getByTestId('photo-card')).toBeTruthy();
    expect(getByTestId('photo-image')).toBeTruthy();
  });

  it('renders with correct aspect ratio from asset metadata', () => {
    const { getByTestId } = render(<PhotoCard {...defaultProps} />);
    const image = getByTestId('photo-image');
    const flatStyle = Array.isArray(image.props.style)
      ? Object.assign({}, ...image.props.style)
      : image.props.style;
    expect(flatStyle.aspectRatio).toBeCloseTo(1080 / 1920);
  });

  it('renders KEEP and DELETE overlay texts', () => {
    const { getByText } = render(<PhotoCard {...defaultProps} />);
    expect(getByText('KEEP')).toBeTruthy();
    expect(getByText('DELETE')).toBeTruthy();
  });

  it('accepts onSwipeLeft callback', () => {
    const onSwipeLeft = jest.fn();
    const { getByTestId } = render(<PhotoCard {...defaultProps} onSwipeLeft={onSwipeLeft} />);
    // Component renders with gesture detector
    expect(getByTestId('photo-card')).toBeTruthy();
  });

  it('accepts onSwipeRight callback', () => {
    const onSwipeRight = jest.fn();
    const { getByTestId } = render(<PhotoCard {...defaultProps} onSwipeRight={onSwipeRight} />);
    expect(getByTestId('photo-card')).toBeTruthy();
  });

  it('uses default aspect ratio when dimensions are 0', () => {
    const zeroAsset = { ...mockAsset, width: 0, height: 0 };
    const { getByTestId } = render(<PhotoCard {...defaultProps} asset={zeroAsset} />);
    const image = getByTestId('photo-image');
    const flatStyle = Array.isArray(image.props.style)
      ? Object.assign({}, ...image.props.style)
      : image.props.style;
    expect(flatStyle.aspectRatio).toBeCloseTo(3 / 4);
  });
});
