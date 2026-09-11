import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SimulationEndModal from './index';

describe('SimulationEndModal', () => {
  it('asks for confirmation before hanging up', () => {
    const onConfirm = vi.fn();
    render(
      <SimulationEndModal
        isOpen
        mode="confirm"
        progressSaved
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText(/end the simulation/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^end$/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
  it('warns that nothing is kept when no analysis was produced', () => {
    render(
      <SimulationEndModal
        isOpen
        mode="confirm"
        progressSaved={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText(/nothing will be saved/i)).toBeInTheDocument();
  });

  it('confirms the progression is kept when an analysis exists', () => {
    render(
      <SimulationEndModal
        isOpen
        mode="confirm"
        progressSaved
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText(/your progress is saved/i)).toBeInTheDocument();
  });

  it('keeps the interview running when the user cancels', () => {
    const onCancel = vi.fn();
    render(
      <SimulationEndModal
        isOpen
        mode="confirm"
        progressSaved
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: /continue the interview/i }),
    );

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('offers only an acknowledgement once the interview ended on its own', () => {
    render(
      <SimulationEndModal
        isOpen
        mode="summary"
        progressSaved
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText(/simulation complete/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^close$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /continue the interview/i }),
    ).not.toBeInTheDocument();
  });

  it('renders nothing while closed', () => {
    const { container } = render(
      <SimulationEndModal
        isOpen={false}
        mode="confirm"
        progressSaved
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
