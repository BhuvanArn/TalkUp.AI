import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TimeComboBox } from './index';

describe('TimeComboBox', () => {
  it('opens dropdown and selects a time option', () => {
    const onChange = vi.fn();
    render(<TimeComboBox value="09:00" onChange={onChange} />);

    fireEvent.click(screen.getByRole('textbox'));

    const selectedOption = screen.getByText('09:00');
    expect(selectedOption).toBeInTheDocument();

    fireEvent.click(screen.getByText('09:15'));

    expect(onChange).toHaveBeenCalledWith('09:15');
    expect(screen.queryByText('23:45')).not.toBeInTheDocument();
  });

  it('parses compact typed time on blur and snaps to nearest quarter', () => {
    const onChange = vi.fn();
    render(<TimeComboBox value="08:00" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '930' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith('09:30');
  });

  it('parses hour-only input on blur', () => {
    const onChange = vi.fn();
    render(<TimeComboBox value="08:00" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '9' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith('09:00');
  });

  it('accepts colon format and snaps to closest option', () => {
    const onChange = vi.fn();
    render(<TimeComboBox value="08:00" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '14:07' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith('14:00');
  });
});

