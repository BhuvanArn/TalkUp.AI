import { changeLanguage } from '@/i18n';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import GoalProgressCard from './index';

describe('GoalProgressCard', () => {
  afterEach(async () => {
    await act(() => changeLanguage('en'));
  });

  it('shows the progress as a percentage', () => {
    render(<GoalProgressCard title="Next goal" progress={75} target={70} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('rounds and clamps the label like the ring', () => {
    const { rerender } = render(
      <GoalProgressCard title="Next goal" progress={72.5} target={70} />,
    );
    expect(screen.getByText('73%')).toBeInTheDocument();

    rerender(<GoalProgressCard title="Next goal" progress={120} target={70} />);
    expect(screen.getByText('100%')).toBeInTheDocument();

    rerender(<GoalProgressCard title="Next goal" progress={-5} target={70} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('formats the percentage for French', async () => {
    await act(() => changeLanguage('fr'));
    render(<GoalProgressCard title="Objectif" progress={75} target={70} />);
    // Trim only: the default normalizer would turn the no-break space into a
    // plain space and hide a regression.
    expect(
      screen.getByText(/^75[  ]%$/, {
        normalizer: (text) => text.trim(),
      }),
    ).toBeInTheDocument();
  });
});
