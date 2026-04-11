import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NotifSettings } from './NotifSettings';

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

  it('renders checkboxes with the correct initial checked state', () => {
    render(<NotifSettings notifs={mockNotifs} onToggle={mockOnToggle} />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it('calls onToggle with the correct ID when a checkbox is toggled', () => {
    render(<NotifSettings notifs={mockNotifs} onToggle={mockOnToggle} />);

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);

    expect(mockOnToggle).toHaveBeenCalledWith('updates');
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('does not render a bottom border on the last item', () => {
    const { container } = render(
      <NotifSettings notifs={mockNotifs} onToggle={mockOnToggle} />,
    );

    const rows = container.querySelectorAll('[data-testid^="notif-row-"]');
    const last = rows[rows.length - 1] as HTMLElement;
    expect(last.className).not.toMatch(/border-b/);
  });
});
