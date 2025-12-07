import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import CalendarListAddButton from './CalendarListAddButton';

// Mock Icon to keep test focused and deterministic
vi.mock('@/components/atoms/icon', () => ({
  Icon: (props: any) => <span data-testid={`icon-${props.icon}`} />,
}));

describe('CalendarListAddButton', () => {
  it('renders the add button with icon and text, and calls onClick when pressed', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <CalendarListAddButton onClick={handleClick} />,
    );

    // The visible text
    expect(screen.getByText('Add Event')).toBeInTheDocument();

    // Icon is rendered with expected test id
    expect(screen.getByTestId('icon-plus')).toBeInTheDocument();

    // The outer element is a button
    const btn = container.querySelector('button');
    expect(btn).toBeTruthy();

    // Click triggers handler
    fireEvent.click(btn!);
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Ensure inner div has expected class names (basic smoke check)
    const inner = container.querySelector('div');
    expect(inner).toHaveClass('p-3');
    expect(inner).toHaveClass('flex');
  });
});

export {};
