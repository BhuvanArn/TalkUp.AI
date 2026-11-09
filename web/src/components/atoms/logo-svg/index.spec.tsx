import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LogoSvg from './index';
import { LogoColor } from './types';

/**
 * Test suite for the LogoSvg component.
 * Verifies that the SVG renders correctly with default and custom colors and sizes,
 * and maintains appropriate accessibility attributes.
 */
describe('LogoSvg', () => {
  it('renders with default primary color and size 100', () => {
    render(<LogoSvg label="TalkUp" />);

    const svgElement = screen.getByRole('img', { name: 'TalkUp' });

    expect(svgElement).toBeInTheDocument();
    expect(svgElement).toHaveClass('fill-primary');
    expect(svgElement).toHaveAttribute('width', '100');
    expect(svgElement).toHaveAttribute('height', '100');
  });

  it('renders with a custom accent color', () => {
    const customColor: LogoColor = 'accent';
    render(<LogoSvg color={customColor} label="TalkUp" />);

    const svgElement = screen.getByRole('img', { name: 'TalkUp' });

    expect(svgElement).toBeInTheDocument();
    expect(svgElement).toHaveClass(`fill-${customColor}`);
    expect(svgElement).not.toHaveClass('fill-primary');
  });

  it('renders with a custom size of 50', () => {
    render(<LogoSvg size={50} label="TalkUp" />);

    const svgElement = screen.getByRole('img', { name: 'TalkUp' });

    expect(svgElement).toBeInTheDocument();
    expect(svgElement).toHaveAttribute('width', '50');
    expect(svgElement).toHaveAttribute('height', '50');
  });

  it('renders with both custom color and size', () => {
    const customColor: LogoColor = 'accent';
    const customSize = 75;
    render(<LogoSvg color={customColor} size={customSize} label="TalkUp" />);

    const svgElement = screen.getByRole('img', { name: 'TalkUp' });

    expect(svgElement).toBeInTheDocument();
    expect(svgElement).toHaveClass(`fill-${customColor}`);
    expect(svgElement).toHaveAttribute('width', customSize.toString());
    expect(svgElement).toHaveAttribute('height', customSize.toString());
  });

  it('is a named image when it stands alone (label)', () => {
    render(<LogoSvg label="TalkUp" />);
    expect(screen.getByRole('img', { name: 'TalkUp' })).toBeInTheDocument();
  });

  it('is decorative and hidden from assistive tech without a label', () => {
    const { container } = render(<LogoSvg />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});
