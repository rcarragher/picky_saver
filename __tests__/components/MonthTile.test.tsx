import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MonthTile } from '../../components/MonthTile';

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

describe('MonthTile', () => {
  const defaultProps = {
    year: 2024,
    month: 3,
    count: 42,
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders month name and year', () => {
    const { getByText } = render(<MonthTile {...defaultProps} />);
    expect(getByText('March 2024')).toBeTruthy();
  });

  it('renders photo count', () => {
    const { getByText } = render(<MonthTile {...defaultProps} />);
    expect(getByText('42 photos')).toBeTruthy();
  });

  it('renders singular "photo" for count of 1', () => {
    const { getByText } = render(<MonthTile {...defaultProps} count={1} />);
    expect(getByText('1 photo')).toBeTruthy();
  });

  it('renders chevron', () => {
    const { getByText } = render(<MonthTile {...defaultProps} />);
    expect(getByText('→')).toBeTruthy();
  });

  it('calls onPress with year and month when pressed', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<MonthTile {...defaultProps} onPress={onPress} />);
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledWith(2024, 3);
  });

  it('has correct accessibility label', () => {
    const { getByLabelText } = render(<MonthTile {...defaultProps} />);
    expect(getByLabelText('March 2024, 42 photos')).toBeTruthy();
  });

  it('shows reviewed indicator when reviewed is true', () => {
    const { getByText } = render(<MonthTile {...defaultProps} reviewed={true} />);
    expect(getByText(' · ✓ Reviewed')).toBeTruthy();
  });

  it('does not show reviewed indicator when reviewed is false', () => {
    const { queryByText } = render(<MonthTile {...defaultProps} reviewed={false} />);
    expect(queryByText(' · ✓ Reviewed')).toBeNull();
  });

  it('does not show reviewed indicator when reviewed is omitted', () => {
    const { queryByText } = render(<MonthTile {...defaultProps} />);
    expect(queryByText(' · ✓ Reviewed')).toBeNull();
  });

  it('includes reviewed in accessibility label when reviewed', () => {
    const { getByLabelText } = render(<MonthTile {...defaultProps} reviewed={true} />);
    expect(getByLabelText('March 2024, 42 photos, reviewed')).toBeTruthy();
  });
});
