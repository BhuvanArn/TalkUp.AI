import { EVENT_COLORS } from '@/utils/eventColors';
import { render, screen } from '@testing-library/react';

import CalendarTableEventItem from './CalendarTableEventItem';

describe('CalendarTableEventItem', () => {
  it('renders title and applies color styles when color is a name', () => {
    const { container } = render(
      <CalendarTableEventItem title="Interview" subtitle={''} color="blue" />,
    );

    expect(screen.getByText('Interview')).toBeInTheDocument();

    const root = container.firstChild as HTMLElement;
    // Inline background and borderTop styles should match the color data
    expect(root).toHaveStyle(`background: ${EVENT_COLORS.blue.background}`);
    expect(root).toHaveStyle(
      `border-top: 2px solid ${EVENT_COLORS.blue.border}`,
    );
  });

  it('renders subtitle when provided', () => {
    render(
      <CalendarTableEventItem
        title="Interview"
        subtitle={'Amazon Web'}
        color="green"
      />,
    );

    expect(screen.getByText('Interview')).toBeInTheDocument();
    expect(screen.getByText('Amazon Web')).toBeInTheDocument();
  });

  it('renders time range when start and end times are provided', () => {
    render(
      <CalendarTableEventItem
        title="Interview"
        subtitle={''}
        color="purple"
        startHour={9}
        startMinute={5}
        endHour={10}
        endMinute={15}
      />,
    );

    // Format used in component: 'H:mm'
    expect(screen.getByText('9:05 to 10:15')).toBeInTheDocument();
  });

  it('accepts a hex color and uses matching color data', () => {
    const hex = EVENT_COLORS.blue.hex;
    const { container } = render(
      <CalendarTableEventItem title="Interview" subtitle={''} color={hex} />,
    );

    const root = container.firstChild as HTMLElement;
    // Should map the hex to the blue color entry
    expect(root).toHaveStyle(`background: ${EVENT_COLORS.blue.background}`);
    expect(root).toHaveStyle(
      `border-top: 2px solid ${EVENT_COLORS.blue.border}`,
    );
  });
});

export {};
