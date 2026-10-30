import { changeLanguage } from '@/i18n';
import { act, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { afterEach, describe, expect, it } from 'vitest';

import SimulationQueueBanner from './index';

describe('SimulationQueueBanner', () => {
  afterEach(async () => {
    await act(() => i18next.changeLanguage('en'));
    localStorage.clear();
  });

  it('shows the queue position, wait and GPU slots in English', () => {
    render(
      <SimulationQueueBanner
        queuePosition={3}
        estimatedWaitSec={150}
        activeCount={2}
        maxConcurrent={4}
      />,
    );

    expect(screen.getByText('Simulation queue')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Position: 3 — estimated wait ~3 min',
    );
    expect(
      screen.getByText(
        '2/4 GPU slots in use. Your session will start automatically.',
      ),
    ).toBeInTheDocument();
  });

  it('renders in French', async () => {
    await act(() => changeLanguage('fr'));
    render(<SimulationQueueBanner queuePosition={1} estimatedWaitSec={30} />);

    expect(
      screen.getByText('File d’attente de la simulation'),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      // toHaveTextContent collapses the non-breaking space.
      'Position : 1 — attente estimée ~1 min',
    );
    expect(screen.getAllByText('1').map((node) => node.tagName)).toEqual([
      'STRONG',
      'STRONG',
    ]);
  });
});
