import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { GeneralSettings } from './GeneralSettings';

const defaultProps = {
  accountUsername: 'adam.bouffy',
  firstName: 'Adam',
  lastName: 'Bouffy',
  bio: 'Passionate about languages and management.',
  phoneNumber: '+33 6 00 00 00 00',
  linkedinUrl: '',
  jobTitle: 'Product Manager Candidate',
  onFirstNameChange: vi.fn(),
  onLastNameChange: vi.fn(),
  onBioChange: vi.fn(),
  onPhoneNumberChange: vi.fn(),
  onLinkedinUrlChange: vi.fn(),
  onJobTitleChange: vi.fn(),
};

describe('GeneralSettings', () => {
  describe('Initial render', () => {
    it('renders without crashing', () => {
      render(<GeneralSettings {...defaultProps} />);
      expect(screen.getByLabelText('First name')).toBeInTheDocument();
    });

    it('renders the Identity section title', () => {
      render(<GeneralSettings {...defaultProps} />);
      expect(screen.getByText('Identity')).toBeInTheDocument();
    });

    it('renders the About & Contact section title', () => {
      render(<GeneralSettings {...defaultProps} />);
      expect(screen.getByText('About & Contact')).toBeInTheDocument();
    });
  });

  describe('First name input', () => {
    it('renders the first name input with correct value', () => {
      render(<GeneralSettings {...defaultProps} />);
      expect(screen.getByLabelText('First name')).toHaveValue('Adam');
    });

    it('calls onFirstNameChange when value changes', () => {
      const onFirstNameChange = vi.fn();
      render(
        <GeneralSettings
          {...defaultProps}
          onFirstNameChange={onFirstNameChange}
        />,
      );
      fireEvent.change(screen.getByLabelText('First name'), {
        target: { value: 'Marie' },
      });
      expect(onFirstNameChange).toHaveBeenCalledWith('Marie');
    });

    it('calls onFirstNameChange once per change event', () => {
      const onFirstNameChange = vi.fn();
      render(
        <GeneralSettings
          {...defaultProps}
          onFirstNameChange={onFirstNameChange}
        />,
      );
      fireEvent.change(screen.getByLabelText('First name'), {
        target: { value: 'Marie' },
      });
      expect(onFirstNameChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Last name input', () => {
    it('renders the last name input with correct value', () => {
      render(<GeneralSettings {...defaultProps} />);
      expect(screen.getByLabelText('Last name')).toHaveValue('Bouffy');
    });

    it('calls onLastNameChange when value changes', () => {
      const onLastNameChange = vi.fn();
      render(
        <GeneralSettings
          {...defaultProps}
          onLastNameChange={onLastNameChange}
        />,
      );
      fireEvent.change(screen.getByLabelText('Last name'), {
        target: { value: 'Dupont' },
      });
      expect(onLastNameChange).toHaveBeenCalledWith('Dupont');
    });

    it('calls onLastNameChange once per change event', () => {
      const onLastNameChange = vi.fn();
      render(
        <GeneralSettings
          {...defaultProps}
          onLastNameChange={onLastNameChange}
        />,
      );
      fireEvent.change(screen.getByLabelText('Last name'), {
        target: { value: 'Dupont' },
      });
      expect(onLastNameChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Username field', () => {
    it('renders the username input as readonly', () => {
      render(<GeneralSettings {...defaultProps} />);
      expect(screen.getByLabelText('Username')).toHaveAttribute(
        'readOnly',
      );
    });

    it('shows the account username from the server', () => {
      render(<GeneralSettings {...defaultProps} />);
      expect(screen.getByLabelText('Username')).toHaveValue(
        'adam.bouffy',
      );
    });

    it('keeps account username when display name fields change', () => {
      render(
        <GeneralSettings
          {...defaultProps}
          firstName="Marie"
          lastName="Dupont"
        />,
      );
      expect(screen.getByLabelText('Username')).toHaveValue('adam.bouffy');
    });

    it('renders the @ prefix', () => {
      render(<GeneralSettings {...defaultProps} />);
      expect(screen.getByText('@')).toBeInTheDocument();
    });
  });

  describe('Bio textarea', () => {
    it('renders the bio textarea with correct value', () => {
      render(<GeneralSettings {...defaultProps} />);
      expect(screen.getByLabelText('Bio')).toHaveValue(defaultProps.bio);
    });

    it('calls onBioChange when value changes', () => {
      const onBioChange = vi.fn();
      render(<GeneralSettings {...defaultProps} onBioChange={onBioChange} />);
      fireEvent.change(screen.getByLabelText('Bio'), {
        target: { value: 'Updated bio' },
      });
      expect(onBioChange).toHaveBeenCalledWith('Updated bio');
    });

    it('has a maxLength of 300', () => {
      render(<GeneralSettings {...defaultProps} />);
      expect(screen.getByLabelText('Bio')).toHaveAttribute('maxLength', '300');
    });

    it('displays the bio character count', () => {
      render(<GeneralSettings {...defaultProps} />);
      expect(
        screen.getByText(`${defaultProps.bio.length} / 300`),
      ).toBeInTheDocument();
    });

    it('updates the character count when bio changes', () => {
      const shortBio = 'Short bio';
      render(<GeneralSettings {...defaultProps} bio={shortBio} />);
      expect(screen.getByText(`${shortBio.length} / 300`)).toBeInTheDocument();
    });

    it('shows 0 / 300 when bio is empty', () => {
      render(<GeneralSettings {...defaultProps} bio="" />);
      expect(screen.getByText('0 / 300')).toBeInTheDocument();
    });
  });

  describe('Phone number input', () => {
    it('renders the phone input with correct value', () => {
      render(<GeneralSettings {...defaultProps} />);
      expect(screen.getByLabelText('Phone number')).toHaveValue(
        defaultProps.phoneNumber,
      );
    });

    it('has type tel', () => {
      render(<GeneralSettings {...defaultProps} />);
      expect(screen.getByLabelText('Phone number')).toHaveAttribute('type', 'tel');
    });

    it('calls onPhoneNumberChange when value changes', () => {
      const onPhoneNumberChange = vi.fn();
      render(
        <GeneralSettings
          {...defaultProps}
          onPhoneNumberChange={onPhoneNumberChange}
        />,
      );
      fireEvent.change(screen.getByLabelText('Phone number'), {
        target: { value: '+33 7 11 22 33 44' },
      });
      expect(onPhoneNumberChange).toHaveBeenCalledWith('+33 7 11 22 33 44');
    });

    it('calls onPhoneNumberChange once per change event', () => {
      const onPhoneNumberChange = vi.fn();
      render(
        <GeneralSettings
          {...defaultProps}
          onPhoneNumberChange={onPhoneNumberChange}
        />,
      );
      fireEvent.change(screen.getByLabelText('Phone number'), {
        target: { value: '+33 7 00 00 00 00' },
      });
      expect(onPhoneNumberChange).toHaveBeenCalledTimes(1);
    });

    it('renders the placeholder text', () => {
      render(<GeneralSettings {...defaultProps} />);
      expect(screen.getByLabelText('Phone number')).toHaveAttribute(
        'placeholder',
        '+33 6 00 00 00 00',
      );
    });
  });

  describe('LinkedIn field', () => {
    it('renders the LinkedIn input', () => {
      render(<GeneralSettings {...defaultProps} />);
      expect(screen.getByLabelText('LinkedIn URL')).toBeInTheDocument();
    });

    it('renders the LinkedIn placeholder', () => {
      render(<GeneralSettings {...defaultProps} />);
      expect(screen.getByLabelText('LinkedIn URL')).toHaveAttribute(
        'placeholder',
        'https://linkedin.com/in/...',
      );
    });
  });

  describe('Job title select', () => {
    it('renders the job title select', () => {
      render(<GeneralSettings {...defaultProps} />);
      expect(screen.getByLabelText('Job title')).toBeInTheDocument();
    });

    it('renders all job title options', () => {
      render(<GeneralSettings {...defaultProps} />);
      expect(
        screen.getByRole('option', { name: 'Product Manager Candidate' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Product Designer' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Software Engineer' }),
      ).toBeInTheDocument();
    });

    it('has Product Manager Candidate as default option', () => {
      render(<GeneralSettings {...defaultProps} />);
      expect(screen.getByLabelText('Job title')).toHaveValue(
        'Product Manager Candidate',
      );
    });
  });
});
