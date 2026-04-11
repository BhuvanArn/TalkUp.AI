import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NotifSettings } from './NotifSettings';

vi.mock('../../atoms/profile-custom/Toggle', () => ({
  Toggle: ({ enabled, onToggle, accentColor }: any) => (
    <button
      data-testid="toggle-button"
      onClick={onToggle}
      style={{ backgroundColor: enabled ? accentColor : 'grey' }}
    >
      {enabled ? 'ON' : 'OFF'}
    </button>
  ),
}));

describe('NotifSettings Component', () => {
  const mockNotifs = [
    {
      id: 'training',
      label: 'Training reminders',
      desc: 'Receive notifications for your planned sessions.',
      enabled: true,
    },
    {
      id: 'updates',
      label: 'Product updates',
      desc: 'Discover new features early.',
      enabled: false,
    },
  ];

  const mockOnToggle = vi.fn();

  it('renders all notification items correctly', () => {
    render(<NotifSettings notifs={mockNotifs} onToggle={mockOnToggle} />);

    mockNotifs.forEach((n) => {
      expect(screen.getByText(n.label)).toBeInTheDocument();
      expect(screen.getByText(n.desc)).toBeInTheDocument();
    });
  });

  it('renders the correct number of toggles with their initial states', () => {
    render(<NotifSettings notifs={mockNotifs} onToggle={mockOnToggle} />);

    const toggles = screen.getAllByTestId('toggle-button');
    expect(toggles).toHaveLength(2);

    expect(toggles[0].textContent).toBe('ON');
    expect(toggles[1].textContent).toBe('OFF');
  });

  it('calls onToggle with the correct ID when a toggle is clicked', () => {
    render(<NotifSettings notifs={mockNotifs} onToggle={mockOnToggle} />);

    const toggles = screen.getAllByTestId('toggle-button');

    fireEvent.click(toggles[1]);

    expect(mockOnToggle).toHaveBeenCalledWith('updates');
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('applies the custom accentColor to the toggles', () => {
    const customColor = '#FF5733';
    render(
      <NotifSettings
        notifs={mockNotifs}
        onToggle={mockOnToggle}
        accentColor={customColor}
      />,
    );

    const toggles = screen.getAllByTestId('toggle-button');

    expect(toggles[0]).toHaveStyle({ backgroundColor: customColor });
  });

  it('does not render a bottom border on the last item', () => {
    const { container } = render(
      <NotifSettings notifs={mockNotifs} onToggle={mockOnToggle} />,
    );

    const items = container.querySelectorAll(
      'div[style*="display: flex"] > div[style*="justify-content: space-between"]',
    );

    if (items.length > 0) {
      const lastItem = items[items.length - 1];
      expect(lastItem).toHaveStyle({ borderBottom: 'none' });
    }
  });
});
