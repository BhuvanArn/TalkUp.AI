import { DEFAULT_PERSONA, PERSONAS } from '@/config/personas';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PersonaPickerModal } from './index';

function renderModal(
  overrides: Partial<Parameters<typeof PersonaPickerModal>[0]> = {},
) {
  const onSelect = vi.fn();
  const onDismiss = vi.fn();
  render(
    <PersonaPickerModal
      isOpen
      onSelect={onSelect}
      onDismiss={onDismiss}
      {...overrides}
    />,
  );
  return { onSelect, onDismiss };
}

describe('PersonaPickerModal', () => {
  it('renders nothing when closed', () => {
    render(
      <PersonaPickerModal
        isOpen={false}
        onSelect={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders every persona with its name and role', () => {
    renderModal();
    for (const persona of PERSONAS) {
      expect(screen.getByText(persona.name)).toBeInTheDocument();
      expect(screen.getByText(persona.role)).toBeInTheDocument();
    }
  });

  it('states the difficulty as a word, not colour alone', () => {
    renderModal();
    expect(screen.getByText('EASY')).toBeInTheDocument();
    expect(screen.getAllByText('MEDIUM')).toHaveLength(2);
    expect(screen.getByText('HARD')).toBeInTheDocument();
  });

  it('states the turn-taking guarantee in the subtitle', () => {
    renderModal();
    expect(
      screen.getByText(/you always get to finish your answer/i),
    ).toBeInTheDocument();
  });

  it('is a labelled modal dialog', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Choose your interviewer');
  });

  it('selects a persona on click', () => {
    const { onSelect } = renderModal();
    fireEvent.click(screen.getByText('Marc Bernard'));
    fireEvent.click(
      screen.getByRole('button', { name: /start with marc bernard/i }),
    );
    expect(onSelect).toHaveBeenCalledWith(
      PERSONAS.find((persona) => persona.id === 'marc-bernard'),
    );
  });

  it('dismisses on Escape', () => {
    const { onDismiss } = renderModal();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalled();
  });

  it('dismisses when the skip button is used', () => {
    const { onDismiss } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(onDismiss).toHaveBeenCalled();
  });

  // Roving tabindex: only the checked radio is reachable by Tab, so focus it
  // first and dispatch from there. Keying a node the user cannot reach would
  // assert the handler wiring rather than the keyboard path.
  it('exposes only the checked radio to Tab', () => {
    renderModal();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(4);
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    expect(radios[0]).toHaveAttribute('tabindex', '0');
    expect(radios[1]).toHaveAttribute('tabindex', '-1');
  });

  it('moves the radio highlight with arrow keys', () => {
    renderModal();
    const radios = screen.getAllByRole('radio');
    radios[0].focus();
    expect(radios[0]).toHaveFocus();

    fireEvent.keyDown(radios[0], { key: 'ArrowRight' });
    expect(screen.getAllByRole('radio')[1]).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('commits the highlighted radio with Enter', () => {
    const { onSelect } = renderModal();
    const radios = screen.getAllByRole('radio');
    radios[0].focus();
    fireEvent.keyDown(radios[0], { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(DEFAULT_PERSONA);
  });

  it('locks body scroll while open', () => {
    renderModal();
    expect(document.body.style.overflow).toBe('hidden');
  });

  // #195 regression: on /applications/:id/simulations the modal's scrim
  // covers the route's own "Back to roadmap" link, so the modal must offer
  // its own back control instead when the caller provides one.
  it('renders no back control when backTo is omitted', () => {
    renderModal();
    expect(
      screen.queryByRole('link', { name: /back/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /back/i }),
    ).not.toBeInTheDocument();
  });

  it('renders the back control and fires onNavigate when backTo is given', () => {
    const onNavigate = vi.fn();
    renderModal({ backTo: { label: 'Back to roadmap', onNavigate } });
    const back = screen.getByRole('button', { name: /back to roadmap/i });
    fireEvent.click(back);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
