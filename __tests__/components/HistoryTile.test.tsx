import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HistoryTile } from '../../components/HistoryTile';
import { ReviewRecord } from '../../types';

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

describe('HistoryTile', () => {
  const record: ReviewRecord = {
    year: 2026,
    month: 3,
    kept: 40,
    deleted: 12,
    total: 52,
    reviewedAt: '2026-03-15T14:30:00.000Z',
  };

  const defaultProps = {
    record,
    onReviewAgain: jest.fn(),
    onClear: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders month name', () => {
    const { getByText } = render(<HistoryTile {...defaultProps} />);
    expect(getByText('March')).toBeTruthy();
  });

  it('renders formatted review date', () => {
    const { getByText } = render(<HistoryTile {...defaultProps} />);
    expect(getByText(/Reviewed Mar 15/)).toBeTruthy();
  });

  it('renders kept and deleted stats', () => {
    const { getByText } = render(<HistoryTile {...defaultProps} />);
    expect(getByText('40 kept')).toBeTruthy();
    expect(getByText('12 deleted')).toBeTruthy();
  });

  it('Review Again button calls onReviewAgain with correct year and month', () => {
    const onReviewAgain = jest.fn();
    const { getByLabelText } = render(
      <HistoryTile {...defaultProps} onReviewAgain={onReviewAgain} />,
    );
    fireEvent.press(getByLabelText('Review Again'));
    expect(onReviewAgain).toHaveBeenCalledWith(2026, 3);
  });

  it('Clear button calls onClear with correct year and month', () => {
    const onClear = jest.fn();
    const { getByLabelText } = render(
      <HistoryTile {...defaultProps} onClear={onClear} />,
    );
    fireEvent.press(getByLabelText('Clear'));
    expect(onClear).toHaveBeenCalledWith(2026, 3);
  });
});
