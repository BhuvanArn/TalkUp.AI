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

    render(<ListEventBlock {...props} />);

    // times
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();

    // title & subtitle
    const title = screen.getByText('Team Sync');
    expect(title).toBeInTheDocument();
    expect(
      screen.getByText('Discuss roadmap and blockers'),
    ).toBeInTheDocument();

    // colored container is the parent of the title element
    const colored = title.parentElement as HTMLElement;
    expect(colored).toBeTruthy();
    // style attributes should match the event color data
    // normalize alpha formatting differences (e.g. 0.20 -> 0.2) and whitespace
    const normalizedExpectedBg = colors.background
      .replace(/0\.20/g, '0.2')
      .replace(/\s/g, '');
    expect(colored.style.backgroundColor.replace(/\s/g, '')).toBe(
      normalizedExpectedBg,
    );
    // normalize hex border color to rgb used by the DOM
    const hexToRgb = (hex: string) => {
      const h = hex.replace('#', '');
      const num = parseInt(h, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgb(${r}, ${g}, ${b})`;
    };

    expect(colored.style.borderLeftColor).toBe(hexToRgb(colors.border));
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
    expect(screen.queryByText('12:00')).toBeInTheDocument();
    expect(screen.queryByText('13:00')).toBeInTheDocument();

    // ensure subtitle not present
    expect(screen.queryByText(/./, { selector: 'p' })).toBeNull();
  });
});

export {};
