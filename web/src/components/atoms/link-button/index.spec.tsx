import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LinkButton } from './index';

/**
 * Test suite for the LinkButton component.
 * Verifies that the LinkButton component correctly renders with different variants and icon support.
 */
describe('LinkButton Component', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  /**
   * Test Group: Basic Rendering
   * Ensures the LinkButton component renders correctly with default and custom props.
   */
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<LinkButton>Click Me</LinkButton>);
      const buttonElement = screen.getByRole('button', { name: 'Click Me' });
      expect(buttonElement).toBeInTheDocument();
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('renders with custom text content', () => {
      const buttonText = 'Learn more';
      render(<LinkButton>{buttonText}</LinkButton>);
      expect(screen.getByText(buttonText)).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<LinkButton className="my-custom-class">Custom</LinkButton>);
      const buttonElement = screen.getByRole('button', { name: 'Custom' });
      expect(buttonElement).toHaveClass('my-custom-class');
    });
  });

  /**
   * Test Group: Variant Rendering
   * Tests different button variants.
   */
  describe('Variant Rendering', () => {
    it('renders idle variant by default', () => {
      render(<LinkButton>Idle</LinkButton>);
      const buttonElement = screen.getByRole('button', { name: 'Idle' });
      expect(buttonElement).toBeInTheDocument();
    });

    it('renders hover variant', () => {
      render(<LinkButton variant="hover">Hover</LinkButton>);
      const buttonElement = screen.getByRole('button', { name: 'Hover' });
      expect(buttonElement).toBeInTheDocument();
    });

    it('renders light variant', () => {
      render(<LinkButton variant="light">Light</LinkButton>);
      const buttonElement = screen.getByRole('button', { name: 'Light' });
      expect(buttonElement).toBeInTheDocument();
    });

    it('renders lighter variant', () => {
      render(<LinkButton variant="lighter">Lighter</LinkButton>);
      const buttonElement = screen.getByRole('button', { name: 'Lighter' });
      expect(buttonElement).toBeInTheDocument();
    });
  });

  /**
   * Test Group: Icon Support
   * Tests rendering with icons.
   */
  describe('Icon Support', () => {
    it('renders without icon', () => {
      render(<LinkButton>No Icon</LinkButton>);
      const buttonElement = screen.getByRole('button', { name: 'No Icon' });
      expect(buttonElement).toBeInTheDocument();
    });

    it('renders with icon', () => {
      render(<LinkButton icon="arrow-right">With Icon</LinkButton>);
      const buttonElement = screen.getByRole('button', { name: 'With Icon' });
      expect(buttonElement).toBeInTheDocument();
    });

    it('renders with arrow-right-up icon', () => {
      render(<LinkButton icon="arrow-right-up">External Link</LinkButton>);
      const buttonElement = screen.getByRole('button', {
        name: 'External Link',
      });
      expect(buttonElement).toBeInTheDocument();
    });
  });

  /**
   * Test Group: Event Handling
   * Tests click event handling.
   */
  describe('Event Handling', () => {
    it('calls onClick when button is clicked', () => {
      const handleClick = vi.fn();
      render(<LinkButton onClick={handleClick}>Click Me</LinkButton>);
      const buttonElement = screen.getByRole('button', { name: 'Click Me' });
      fireEvent.click(buttonElement);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not throw when onClick is not provided', () => {
      render(<LinkButton>No Handler</LinkButton>);
      const buttonElement = screen.getByRole('button', { name: 'No Handler' });
      expect(() => {
        fireEvent.click(buttonElement);
      }).not.toThrow();
    });

    it('calls onClick with icon present', () => {
      const handleClick = vi.fn();
      render(
        <LinkButton onClick={handleClick} icon="arrow-right">
          Click with Icon
        </LinkButton>,
      );
      const buttonElement = screen.getByRole('button', {
        name: 'Click with Icon',
      });
      fireEvent.click(buttonElement);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Test Group: Forward Ref
   * Tests that the component properly forwards refs.
   */
  describe('Forward Ref', () => {
    it('forwards ref to button element', () => {
      const ref = vi.fn();
      render(<LinkButton ref={ref}>Ref Test</LinkButton>);
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
    });
  });

  /**
   * Test Group: HTML Attributes
   * Tests that additional HTML attributes are properly forwarded.
   */
  describe('HTML Attributes', () => {
    it('forwards additional HTML attributes', () => {
      render(
        <LinkButton
          id="test-link-button"
          data-testid="link-button-test"
          aria-label="test-button"
        >
          Test Button
        </LinkButton>,
      );
      const buttonElement = screen.getByRole('button', {
        name: 'test-button',
      });
      expect(buttonElement).toHaveAttribute('id', 'test-link-button');
      expect(buttonElement).toHaveAttribute('data-testid', 'link-button-test');
      expect(buttonElement).toHaveAttribute('aria-label', 'test-button');
    });

    it('supports disabled state', () => {
      render(<LinkButton disabled>Disabled</LinkButton>);
      const buttonElement = screen.getByRole('button', { name: 'Disabled' });
      expect(buttonElement).toBeDisabled();
    });

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(
        <LinkButton disabled onClick={handleClick}>
          Disabled Click
        </LinkButton>,
      );
      const buttonElement = screen.getByRole('button', {
        name: 'Disabled Click',
      });
      fireEvent.click(buttonElement);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  /**
   * Test Group: Accessibility
   * Tests accessibility attributes and ARIA compliance.
   */
  describe('Accessibility', () => {
    it('has proper role attribute', () => {
      render(<LinkButton>Accessible Button</LinkButton>);
      const buttonElement = screen.getByRole('button');
      expect(buttonElement).toBeInTheDocument();
    });
  });
});
