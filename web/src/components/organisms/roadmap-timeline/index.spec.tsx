import type { Roadmap } from '@/services/applications/types';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RoadmapTimeline } from './index';

const roadmap: Roadmap = {
  match_score: 62,
  summary: 'Close the Kubernetes gap.',
  topics: [
    {
      title: 'Kubernetes fundamentals',
      priority: 'HIGH',
      rationale: 'Required by the offer, absent from the CV.',
      gap: true,
    },
    {
      title: 'System design refresh',
      priority: 'LOW',
      rationale: 'Already solid, keep it warm.',
      gap: false,
    },
  ],
  talking_points: [],
};

describe('RoadmapTimeline', () => {
  it('renders the gauge, one card per topic in order, and the goal node', () => {
    render(<RoadmapTimeline roadmap={roadmap} interviewAt={null} />);
    expect(screen.getByText('62%')).toBeInTheDocument();
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Kubernetes fundamentals')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('System design refresh')).toBeInTheDocument();
    expect(screen.getByText('Job-ready goal')).toBeInTheDocument();
  });

  it('shows the dated goal node when the interview date is set', () => {
    render(
      <RoadmapTimeline
        roadmap={roadmap}
        interviewAt="2026-07-26T10:00:00.000Z"
      />,
    );
    expect(screen.getByText(/Job-ready by 26 Jul 2026/)).toBeInTheDocument();
  });

  it('collapses to a vertical stepper on narrow screens (responsive classes)', () => {
    render(<RoadmapTimeline roadmap={roadmap} interviewAt={null} />);
    const rail = screen.getByTestId('roadmap-timeline');
    expect(rail).toHaveClass('flex-col', 'lg:flex-row');
  });
});
