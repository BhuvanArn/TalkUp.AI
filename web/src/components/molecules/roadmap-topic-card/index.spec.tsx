import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RoadmapTopicCard } from './index';

/**
 * jsdom reports every element as 0x0, so the card's clamp detection never
 * fires. Force scrollHeight > clientHeight so the card renders as a button
 * that opens the popover.
 */
const forceTruncation = () => {
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(200);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(50);
};

const topic = {
  title: 'Kubernetes fundamentals',
  priority: 'HIGH' as const,
  rationale: 'Required by the offer, absent from the CV.',
  gap: true,
};

describe('RoadmapTopicCard', () => {
  afterEach(() => vi.restoreAllMocks());

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

  // The popover is absolutely positioned over the card but is WIDER than it
  // (20rem vs the ~12rem timeline column), so the same text wraps into fewer
  // lines and the popover ends up SHORTER than the card it covers. The bottom
  // of the collapsed card — "Read more" and its border — then showed through
  // underneath. Hiding the card while the popover is open is what stops that;
  // it stays in flow (`invisible`, not `hidden`) so the timeline row keeps its
  // height.
  it('hides the collapsed card while the popover is open', () => {
    forceTruncation();
    render(<RoadmapTopicCard step={3} topic={topic} />);

    const card = screen.getByRole('button', { name: /Step 3/ });
    expect(card).not.toHaveClass('invisible');

    fireEvent.click(card);

    expect(card).toHaveClass('invisible');
    expect(card).toHaveAttribute('aria-hidden', 'true');
    expect(card).toHaveAttribute('inert');
    expect(
      screen.getByRole('region', { name: /Kubernetes fundamentals/ }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(card).not.toHaveClass('invisible');
    expect(card).not.toHaveAttribute('inert');
  });
});
