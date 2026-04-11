import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Toggle } from './index';

describe('Toggle', () => {
  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(
      <Toggle
        enabled={false}
        onToggle={onToggle}
        aria-label="Test toggle"
      />,
    );

    fireEvent.click(screen.getByRole('switch', { name: 'Test toggle' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('does not call onToggle when disabled', () => {
    const onToggle = vi.fn();
    render(
      <Toggle enabled={false} onToggle={onToggle} disabled aria-label="Off" />,
    );

    fireEvent.click(screen.getByRole('switch'));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('sets aria-checked from enabled', () => {
    render(<Toggle enabled aria-label="On" onToggle={vi.fn()} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });
});
