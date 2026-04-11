import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppearanceSettings } from './AppearanceSettings';

describe('AppearanceSettings Component', () => {
  const defaultProps = {
    avatarColor: '#2B70C9',
    bannerGradient: 'linear-gradient(135deg, #2B70C9 0%, #1D9E75 100%)',
    initials: 'AB',
    onColorChange: vi.fn(),
    onBannerChange: vi.fn(),
  };

  it('renders all sections correctly', () => {
    render(<AppearanceSettings {...defaultProps} />);

    expect(screen.getByText('Profile color')).toBeInTheDocument();
    expect(screen.getByText('Avatar preview')).toBeInTheDocument();
    expect(screen.getByText('Profile banner')).toBeInTheDocument();
    expect(screen.getByText('Profile visibility')).toBeInTheDocument();
  });

  it('calls onColorChange when a preset color is clicked', () => {
    render(<AppearanceSettings {...defaultProps} />);

    const greenBtn = screen.getByLabelText(/Use color Green/i);
    fireEvent.click(greenBtn);

    expect(defaultProps.onColorChange).toHaveBeenCalledWith('#1D9E75');
  });

  it('calls onColorChange when custom color input is used', () => {
    render(<AppearanceSettings {...defaultProps} />);

    const colorInput = screen.getByLabelText(/Custom color/i);
    fireEvent.change(colorInput, { target: { value: '#FF0000' } });

    expect(defaultProps.onColorChange).toHaveBeenCalledWith('#ff0000');
  });

  it('renders avatars with correct initials and color', () => {
    render(<AppearanceSettings {...defaultProps} />);

    const initialsElements = screen.getAllByText(defaultProps.initials);
    expect(initialsElements).toHaveLength(3);
  });

  it('calls onBannerChange when a banner preset is clicked', () => {
    render(<AppearanceSettings {...defaultProps} />);

    const sunsetBtn = screen.getByText('Ocean').closest('button');
    if (sunsetBtn) fireEvent.click(sunsetBtn);

    expect(defaultProps.onBannerChange).toHaveBeenCalledWith(
      'linear-gradient(135deg, #2B70C9 0%, #1D9E75 100%)',
    );
  });

  it('updates visibility radio buttons state', () => {
    render(<AppearanceSettings {...defaultProps} />);

    const privateRadio = screen.getByLabelText('Private') as HTMLInputElement;
    const publicRadio = screen.getByLabelText('Public') as HTMLInputElement;

    expect(publicRadio.checked).toBe(true);
    expect(privateRadio.checked).toBe(false);

    fireEvent.click(privateRadio);

    expect(privateRadio.checked).toBe(true);
    expect(publicRadio.checked).toBe(false);
  });

  it('highlights the active color preset', () => {
    render(<AppearanceSettings {...defaultProps} />);

    const activeColorBtn = screen.getByLabelText(/Use color Blue/i);
    expect(activeColorBtn.style.border).toContain('var(--color-text)');
  });
});
