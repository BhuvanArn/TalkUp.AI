import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MatchGauge } from './index';

describe('MatchGauge', () => {
  it('renders the score label', () => {
    render(<MatchGauge score={62} />);
    expect(screen.getByText('62%')).toBeInTheDocument();
  });

  it('clamps out-of-range scores into 0-100', () => {
    const { rerender } = render(<MatchGauge score={250} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    rerender(<MatchGauge score={-5} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('uses the success ring at or above 70 and accent below', () => {
    const { rerender } = render(<MatchGauge score={85} />);
    expect(screen.getByRole('img', { name: /match score 85%/i })).toHaveClass(
      'text-success',
    );
    rerender(<MatchGauge score={40} />);
    expect(screen.getByRole('img', { name: /match score 40%/i })).toHaveClass(
      'text-accent',
    );
  });
});
