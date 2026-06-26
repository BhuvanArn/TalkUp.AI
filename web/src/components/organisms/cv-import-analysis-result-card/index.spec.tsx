import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AnalysisResultCard } from './index';

vi.mock('../../atoms/icon/icon-map', () => ({
  iconMap: {
    'check-circle': ({ size }: { size?: number }) => (
      <svg data-testid="icon-check-circle" width={size} />
    ),
    tasks: () => <svg data-testid="icon-tasks" />,
    progression: () => <svg data-testid="icon-progression" />,
    cog: () => <svg data-testid="icon-cog" />,
    undo: ({ size }: { size?: number }) => (
      <svg data-testid="icon-undo" width={size} />
    ),
  },
}));

const defaultProps = {
  onRetry: vi.fn(),
  onStartCourse: vi.fn(),
};

describe('AnalysisResultCard', () => {
  describe('Initial render', () => {
    it('renders without crashing', () => {
      render(<AnalysisResultCard {...defaultProps} />);
      expect(screen.getByText('Analysis Complete!')).toBeInTheDocument();
    });

    it('renders the subtitle description', () => {
      render(<AnalysisResultCard {...defaultProps} />);
      expect(
        screen.getByText(/Your profile has been fully processed/),
      ).toBeInTheDocument();
    });

    it('renders the success icon', () => {
      render(<AnalysisResultCard {...defaultProps} />);
      expect(screen.getByTestId('icon-check-circle')).toBeInTheDocument();
    });
  });

  describe('Highlights grid', () => {
    it('renders Skills Validated highlight', () => {
      render(<AnalysisResultCard {...defaultProps} />);
      expect(screen.getByText('Skills Validated')).toBeInTheDocument();
    });

    it('renders Optimized Path highlight', () => {
      render(<AnalysisResultCard {...defaultProps} />);
      expect(screen.getByText('Optimized Path')).toBeInTheDocument();
    });

    it('renders Personalized AI highlight', () => {
      render(<AnalysisResultCard {...defaultProps} />);
      expect(screen.getByText('Personalized AI')).toBeInTheDocument();
    });

    it('renders all highlight icons', () => {
      render(<AnalysisResultCard {...defaultProps} />);
      expect(screen.getByTestId('icon-tasks')).toBeInTheDocument();
      expect(screen.getByTestId('icon-progression')).toBeInTheDocument();
      expect(screen.getByTestId('icon-cog')).toBeInTheDocument();
    });
  });

  describe('CTA section', () => {
    it('renders the CTA text', () => {
      render(<AnalysisResultCard {...defaultProps} />);
      expect(
        screen.getByText('Your custom training is ready.'),
      ).toBeInTheDocument();
    });

    it('renders the Start My Training button', () => {
      render(<AnalysisResultCard {...defaultProps} />);
      expect(
        screen.getByRole('button', { name: 'Start My Training' }),
      ).toBeInTheDocument();
    });

    it('calls onStartCourse when Start My Training is clicked', () => {
      const onStartCourse = vi.fn();
      render(
        <AnalysisResultCard {...defaultProps} onStartCourse={onStartCourse} />,
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'Start My Training' }),
      );
      expect(onStartCourse).toHaveBeenCalledTimes(1);
    });
  });

  describe('Retry button', () => {
    it('renders the retry button', () => {
      render(<AnalysisResultCard {...defaultProps} />);
      expect(screen.getByText('Analyze another profile')).toBeInTheDocument();
    });

    it('renders the retry icon', () => {
      render(<AnalysisResultCard {...defaultProps} />);
      expect(screen.getByTestId('icon-undo')).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      render(<AnalysisResultCard {...defaultProps} onRetry={onRetry} />);
      fireEvent.click(screen.getByText('Analyze another profile'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});
