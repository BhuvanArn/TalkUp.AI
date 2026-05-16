import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AnalysisResultCard } from './AnalysisResultCard';

vi.mock('../../atoms/icon/icon-map', () => ({
  iconMap: {
    'check-circle': ({ size, color }: { size?: number; color?: string }) => (
      <svg data-testid="icon-check-circle" width={size} color={color} />
    ),
    tasks: () => <svg data-testid="icon-tasks" />,
    progression: () => <svg data-testid="icon-progression" />,
    cog: () => <svg data-testid="icon-cog" />,
    undo: ({ size }: { size?: number }) => (
      <svg data-testid="icon-undo" width={size} />
    ),
  },
}));

describe('AnalysisResultCard', () => {
  describe('Initial render', () => {
    it('renders without crashing', () => {
      render(<AnalysisResultCard onRetry={vi.fn()} />);
      expect(screen.getByText('Analysis Complete!')).toBeInTheDocument();
    });

    it('renders the success title', () => {
      render(<AnalysisResultCard onRetry={vi.fn()} />);
      expect(screen.getByText('Analysis Complete!')).toBeInTheDocument();
    });

    it('renders the subtitle description', () => {
      render(<AnalysisResultCard onRetry={vi.fn()} />);
      expect(
        screen.getByText(/Your profile has been fully processed/),
      ).toBeInTheDocument();
    });

    it('renders the success icon', () => {
      render(<AnalysisResultCard onRetry={vi.fn()} />);
      expect(screen.getByTestId('icon-check-circle')).toBeInTheDocument();
    });
  });

  describe('Highlights grid', () => {
    it('renders Skills Validated highlight', () => {
      render(<AnalysisResultCard onRetry={vi.fn()} />);
      expect(screen.getByText('Skills Validated')).toBeInTheDocument();
    });

    it('renders Optimized Path highlight', () => {
      render(<AnalysisResultCard onRetry={vi.fn()} />);
      expect(screen.getByText('Optimized Path')).toBeInTheDocument();
    });

    it('renders Personalized AI highlight', () => {
      render(<AnalysisResultCard onRetry={vi.fn()} />);
      expect(screen.getByText('Personalized AI')).toBeInTheDocument();
    });

    it('renders all highlight icons', () => {
      render(<AnalysisResultCard onRetry={vi.fn()} />);
      expect(screen.getByTestId('icon-tasks')).toBeInTheDocument();
      expect(screen.getByTestId('icon-progression')).toBeInTheDocument();
      expect(screen.getByTestId('icon-cog')).toBeInTheDocument();
    });
  });

  describe('CTA section', () => {
    it('renders the CTA text', () => {
      render(<AnalysisResultCard onRetry={vi.fn()} />);
      expect(
        screen.getByText('Your custom training is ready.'),
      ).toBeInTheDocument();
    });

    it('renders the Start My Training button', () => {
      render(<AnalysisResultCard onRetry={vi.fn()} />);
      expect(screen.getByText('Start My Training 🚀')).toBeInTheDocument();
    });

    it('calls onStartCourse when Start My Training is clicked', () => {
      const onStartCourse = vi.fn();
      render(
        <AnalysisResultCard onRetry={vi.fn()} onStartCourse={onStartCourse} />,
      );
      fireEvent.click(screen.getByText('Start My Training 🚀'));
      expect(onStartCourse).toHaveBeenCalledTimes(1);
    });

    it('uses a default onStartCourse when none is provided', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      render(<AnalysisResultCard onRetry={vi.fn()} />);
      fireEvent.click(screen.getByText('Start My Training 🚀'));
      expect(consoleSpy).toHaveBeenCalledWith('Navigating to course...');
      consoleSpy.mockRestore();
    });
  });

  describe('Retry button', () => {
    it('renders the retry button', () => {
      render(<AnalysisResultCard onRetry={vi.fn()} />);
      expect(screen.getByText('Analyze another profile')).toBeInTheDocument();
    });

    it('renders the retry icon', () => {
      render(<AnalysisResultCard onRetry={vi.fn()} />);
      expect(screen.getByTestId('icon-undo')).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      render(<AnalysisResultCard onRetry={onRetry} />);
      fireEvent.click(screen.getByText('Analyze another profile'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('calls onRetry only once per click', () => {
      const onRetry = vi.fn();
      render(<AnalysisResultCard onRetry={onRetry} />);
      fireEvent.click(screen.getByText('Analyze another profile'));
      fireEvent.click(screen.getByText('Analyze another profile'));
      expect(onRetry).toHaveBeenCalledTimes(2);
    });
  });

  describe('Hover effects on Start button', () => {
    it('changes background on mouseOver', () => {
      render(<AnalysisResultCard onRetry={vi.fn()} />);
      const btn = screen.getByText('Start My Training 🚀');
      fireEvent.mouseOver(btn);
      expect(btn.style.backgroundColor).toBe('rgb(30, 91, 179)');
    });

    it('resets background on mouseOut', () => {
      render(<AnalysisResultCard onRetry={vi.fn()} />);
      const btn = screen.getByText('Start My Training 🚀');
      fireEvent.mouseOver(btn);
      fireEvent.mouseOut(btn);
      expect(btn.style.backgroundColor).toBe('rgb(43, 112, 201)');
    });
  });
});
