import type { Application } from '@/services/applications/types';
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

const baseApplication: Application = {
  applicationId: 'app-1',
  companyName: 'Acme Corp',
  jobTitle: 'Frontend Engineer',
  status: 'sent',
  offerUrl: 'https://example.com/job/1',
  offerDetails: {
    job_title: 'Frontend Engineer',
    company_name: 'Acme Corp',
    company_description: null,
    sector: 'Tech',
    contract_type: 'CDI',
    location: 'Paris',
    required_skills: [],
    preferred_skills: [],
    required_experience: null,
    required_education: null,
    missions: [],
    soft_skills: [],
    languages_required: [],
    salary_range: null,
    company_values: [],
    team_description: null,
  },
  cvDetails: null,
  appliedAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

const defaultProps = {
  application: baseApplication,
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

    it('renders the job title and company name', () => {
      render(<AnalysisResultCard {...defaultProps} />);
      expect(
        screen.getByText('Frontend Engineer — Acme Corp'),
      ).toBeInTheDocument();
    });

    it('falls back to a generic role label when jobTitle is null', () => {
      render(
        <AnalysisResultCard
          {...defaultProps}
          application={{
            ...baseApplication,
            jobTitle: null,
            companyName: null,
          }}
        />,
      );
      expect(screen.getByText('Your target role')).toBeInTheDocument();
    });
  });

  describe('Highlights grid', () => {
    it('renders the sector highlight', () => {
      render(<AnalysisResultCard {...defaultProps} />);
      expect(screen.getByText('Tech')).toBeInTheDocument();
    });

    it('renders the location highlight', () => {
      render(<AnalysisResultCard {...defaultProps} />);
      expect(screen.getByText('Paris')).toBeInTheDocument();
    });

    it('renders the contract type highlight', () => {
      render(<AnalysisResultCard {...defaultProps} />);
      expect(screen.getByText('CDI')).toBeInTheDocument();
    });

    it('renders all highlight icons', () => {
      render(<AnalysisResultCard {...defaultProps} />);
      expect(screen.getByTestId('icon-tasks')).toBeInTheDocument();
      expect(screen.getByTestId('icon-progression')).toBeInTheDocument();
      expect(screen.getByTestId('icon-cog')).toBeInTheDocument();
    });

    it('renders no highlights when offerDetails is null', () => {
      render(
        <AnalysisResultCard
          {...defaultProps}
          application={{ ...baseApplication, offerDetails: null }}
        />,
      );
      expect(screen.queryByTestId('icon-tasks')).not.toBeInTheDocument();
      expect(screen.queryByTestId('icon-progression')).not.toBeInTheDocument();
      expect(screen.queryByTestId('icon-cog')).not.toBeInTheDocument();
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
