import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RoadmapTalkingPoints } from './index';

const points = [
  {
    mission: 'Own the component library',
    angle: "You've maintained a design system, so you'd start by auditing it.",
  },
  {
    mission: 'Mentor two junior engineers',
    angle: 'Your lead experience means you can pair and review from day one.',
  },
];

describe('RoadmapTalkingPoints', () => {
  it('renders the heading and one entry per talking point', () => {
    render(<RoadmapTalkingPoints points={points} />);

    expect(
      screen.getByRole('heading', { name: /bring these to your interview/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Own the component library')).toBeInTheDocument();
    expect(
      screen.getByText(/you've maintained a design system/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Mentor two junior engineers')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders nothing when there are no points', () => {
    const { container } = render(<RoadmapTalkingPoints points={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
