import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RoadmapTopicCard } from './index';

const topic = {
  title: 'Kubernetes fundamentals',
  priority: 'HIGH' as const,
  rationale: 'Required by the offer, absent from the CV.',
  gap: true,
};

describe('RoadmapTopicCard', () => {
  it('renders step, title, priority chip, rationale and gap marker', () => {
    render(<RoadmapTopicCard step={1} topic={topic} />);
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Kubernetes fundamentals')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toHaveClass('bg-error-weak', 'text-error');
    expect(
      screen.getByText('Required by the offer, absent from the CV.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Gap to close')).toBeInTheDocument();
  });

  it('maps MED and LOW priorities to warning and success tokens', () => {
    const { rerender } = render(
      <RoadmapTopicCard
        step={2}
        topic={{ ...topic, priority: 'MED', gap: false }}
      />,
    );
    expect(screen.getByText('MED')).toHaveClass(
      'bg-warning-weak',
      'text-warning',
    );
    expect(screen.queryByText('Gap to close')).not.toBeInTheDocument();
    rerender(
      <RoadmapTopicCard
        step={3}
        topic={{ ...topic, priority: 'LOW', gap: false }}
      />,
    );
    expect(screen.getByText('LOW')).toHaveClass(
      'bg-success-weak',
      'text-success',
    );
  });
});
