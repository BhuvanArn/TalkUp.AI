import { render, screen } from '@testing-library/react';

import CalendarTableDayHeader from './CalendarTableDayHeader';

describe('CalendarTableDayHeader', () => {
  it('renders day name and date with default styling (not today)', () => {
    render(<CalendarTableDayHeader dayName="Mon" date={5} />);

    expect(screen.getByText('Mon')).toBeInTheDocument();

    const dateEl = screen.getByText('5');
    expect(dateEl).toBeInTheDocument();
    // When not today, it should include the text-idle class
    expect(dateEl).toHaveClass('text-idle');
    // Should not have the today styles
    expect(dateEl).not.toHaveClass('bg-accent');
    expect(dateEl).not.toHaveClass('text-white');
  });

  it('applies today styling when isToday is true', () => {
    render(<CalendarTableDayHeader dayName="Thu" date={10} isToday />);

    expect(screen.getByText('Thu')).toBeInTheDocument();

    const dateEl = screen.getByText('10');
    expect(dateEl).toBeInTheDocument();
    // Today should use accent background and white text
    expect(dateEl).toHaveClass('bg-accent');
    expect(dateEl).toHaveClass('text-white');
    // Should not have idle text class
    expect(dateEl).not.toHaveClass('text-idle');
  });

  it('renders correctly in day view', () => {
    const { container } = render(
      <CalendarTableDayHeader dayName="Fri" date={12} view="day" />,
    );
    // Check for the specific class used in day view (horizontal layout)
    expect(container.firstChild).toHaveClass(
      'pl-2 grid grid-cols-[100px_100px_1fr] items-center justify-center pt-3 pb-6',
    );
  });
});

export {};
