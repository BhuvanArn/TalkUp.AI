import { getEventColorData } from '@/utils/eventColors';
import { render, screen } from '@testing-library/react';

import ListEventBlock from './ListEventBlock';

describe('ListEventBlock', () => {
  it('renders times, title, subtitle and applies correct colors', () => {
    const props = {
      title: 'Team Sync',
      subtitle: 'Discuss roadmap and blockers',
      color: 'red',
      startTime: '09:00',
      endTime: '10:00',
    } as const;

    const colors = getEventColorData(props.color);

    const { container } = render(<ListEventBlock {...props} />);

    // times are rendered as a single range string
    expect(screen.getByText(/09:00 to 10:00/)).toBeInTheDocument();

    // title & subtitle
    const title = screen.getByText('Team Sync');
    expect(title).toBeInTheDocument();
    expect(
      screen.getByText('Discuss roadmap and blockers'),
    ).toBeInTheDocument();

    // left accent bar uses the event border color
    const hexToRgb = (hex: string) => {
      const h = hex.replace('#', '');
      const num = parseInt(h, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgb(${r}, ${g}, ${b})`;
    };

    const bar = container.querySelector('span[aria-hidden="true"]');
    expect(bar).toBeTruthy();
    expect(bar).toHaveStyle({ backgroundColor: hexToRgb(colors.border) });
  });

  it('does not render subtitle when not provided', () => {
    render(
      <ListEventBlock
        title="Solo Event"
        subtitle=""
        color="blue"
        startTime="12:00"
        endTime="13:00"
      />,
    );

    expect(screen.getByText('Solo Event')).toBeInTheDocument();
    expect(screen.getByText(/12:00 to 13:00/)).toBeInTheDocument();

    // only the time range paragraph; no subtitle line
    expect(screen.getAllByRole('paragraph')).toHaveLength(1);
  });
});

export {};
