import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ApparenceSettings } from './ApparenceSettings';

describe('ApparenceSettings Component', () => {
  const defaultProps = {
    avatarColor: '#2B70C9',
    bannerGradient: 'linear-gradient(135deg, #2B70C9 0%, #1D9E75 100%)',
    initials: 'AB',
    onColorChange: vi.fn(),
    onBannerChange: vi.fn(),
  };

  it('renders all sections correctly', () => {
    render(<ApparenceSettings {...defaultProps} />);

    expect(screen.getByText('Couleur du profil')).toBeInTheDocument();
    expect(screen.getByText('Aperçu avatar')).toBeInTheDocument();
    expect(screen.getByText('Bannière du profil')).toBeInTheDocument();
    expect(screen.getByText('Visibilité du profil')).toBeInTheDocument();
  });

  it('calls onColorChange when a preset color is clicked', () => {
    render(<ApparenceSettings {...defaultProps} />);

    const greenBtn = screen.getByLabelText(/Utiliser la couleur Vert/i);
    fireEvent.click(greenBtn);

    expect(defaultProps.onColorChange).toHaveBeenCalledWith('#1D9E75');
  });

  it('calls onColorChange when custom color input is used', () => {
    render(<ApparenceSettings {...defaultProps} />);

    const colorInput = screen.getByLabelText(/Couleur personnalisée/i);
    fireEvent.change(colorInput, { target: { value: '#FF0000' } });

    expect(defaultProps.onColorChange).toHaveBeenCalledWith('#ff0000');
  });

  it('renders avatars with correct initials and color', () => {
    render(<ApparenceSettings {...defaultProps} />);

    const initialsElements = screen.getAllByText(defaultProps.initials);
    expect(initialsElements).toHaveLength(3);
  });

  it('calls onBannerChange when a banner preset is clicked', () => {
    render(<ApparenceSettings {...defaultProps} />);

    const sunsetBtn = screen.getByText('Ocean').closest('button');
    if (sunsetBtn) fireEvent.click(sunsetBtn);

    expect(defaultProps.onBannerChange).toHaveBeenCalledWith(
      'linear-gradient(135deg, #2B70C9 0%, #1D9E75 100%)',
    );
  });

  it('updates visibility radio buttons state', () => {
    render(<ApparenceSettings {...defaultProps} />);

    const privateRadio = screen.getByLabelText('Privé') as HTMLInputElement;
    const publicRadio = screen.getByLabelText('Public') as HTMLInputElement;

    expect(publicRadio.checked).toBe(true);
    expect(privateRadio.checked).toBe(false);

    fireEvent.click(privateRadio);

    expect(privateRadio.checked).toBe(true);
    expect(publicRadio.checked).toBe(false);
  });

  it('highlights the active color preset', () => {
    render(<ApparenceSettings {...defaultProps} />);

    const activeColorBtn = screen.getByLabelText(/Utiliser la couleur Bleu/i);
    expect(activeColorBtn.style.border).toContain('var(--color-text)');
  });
});
