import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Profile from './profile';

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (options: { component: unknown }) =>
    options,
}));

vi.mock('@/components/organisms/profile-settings/GeneralSettings', () => ({
  GeneralSettings: ({
    firstName,
    lastName,
    bio,
    phoneNumber,
    onFirstNameChange,
    onLastNameChange,
    onBioChange,
    onPhoneNumberChange,
  }: {
    firstName: string;
    lastName: string;
    bio: string;
    phoneNumber: string;
    onFirstNameChange: (v: string) => void;
    onLastNameChange: (v: string) => void;
    onBioChange: (v: string) => void;
    onPhoneNumberChange: (v: string) => void;
  }) => (
    <div data-testid="general-settings">
      <input
        data-testid="input-firstname"
        value={firstName}
        onChange={(e) => onFirstNameChange(e.target.value)}
      />
      <input
        data-testid="input-lastname"
        value={lastName}
        onChange={(e) => onLastNameChange(e.target.value)}
      />
      <textarea
        data-testid="input-bio"
        value={bio}
        onChange={(e) => onBioChange(e.target.value)}
      />
      <input
        data-testid="input-phone"
        value={phoneNumber}
        onChange={(e) => onPhoneNumberChange(e.target.value)}
      />
    </div>
  ),
}));

vi.mock('@/components/organisms/profile-settings/AppearanceSettings', () => ({
  AppearanceSettings: ({
    avatarColor,
    bannerGradient,
    initials,
    onColorChange,
    onBannerChange,
  }: {
    avatarColor: string;
    bannerGradient: string;
    initials: string;
    onColorChange: (v: string) => void;
    onBannerChange: (v: string) => void;
  }) => (
    <div data-testid="appearance-settings">
      <span data-testid="avatar-color">{avatarColor}</span>
      <span data-testid="banner-value">{bannerGradient}</span>
      <span data-testid="initials-preview">{initials}</span>
      <button
        onClick={() => onColorChange('#FF0000')}
        data-testid="change-color"
      >
        Change color
      </button>
      <button
        onClick={() =>
          onBannerChange('linear-gradient(135deg, #000 0%, #fff 100%)')
        }
        data-testid="change-banner"
      >
        Change banner
      </button>
    </div>
  ),
}));

vi.mock('@/components/organisms/profile-settings/NotifSettings', () => ({
  NotifSettings: ({
    notifs,
    onToggle,
  }: {
    notifs: { id: string; label: string; desc: string; enabled: boolean }[];
    onToggle: (id: string) => void;
  }) => (
    <div data-testid="notif-settings">
      {notifs.map((n) => (
        <div key={n.id}>
          <span data-testid={`notif-label-${n.id}`}>{n.label}</span>
          <span data-testid={`notif-state-${n.id}`}>
            {n.enabled ? 'enabled' : 'disabled'}
          </span>
          <button
            data-testid={`notif-toggle-${n.id}`}
            onClick={() => onToggle(n.id)}
          >
            Toggle
          </button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/organisms/profile-settings/SecuritySettings', () => ({
  SecuritySettings: () => (
    <div data-testid="security-settings">Security</div>
  ),
}));

describe('Profile page', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial render', () => {
    it('renders the profile page without crashing', () => {
      render(<Profile />);
      expect(screen.getByTestId('user-avatar-initials')).toBeInTheDocument();
    });

    it('displays default initials AB', () => {
      render(<Profile />);
      expect(screen.getByTestId('user-avatar-initials')).toHaveTextContent(
        'AB',
      );
    });

    it('displays full name Adam Bouffy', () => {
      render(<Profile />);
      expect(screen.getByText('Adam Bouffy')).toBeInTheDocument();
    });

    it('displays the subtitle with role and plan', () => {
      render(<Profile />);
      expect(
        screen.getByText('Product Manager Candidate · TalkUp Pro'),
      ).toBeInTheDocument();
    });

    it('renders the General tab as active by default', () => {
      render(<Profile />);
      expect(screen.getByTestId('general-settings')).toBeInTheDocument();
    });

    it('renders all profile setting tabs', () => {
      render(<Profile />);
      expect(screen.getByTestId('tab-general')).toBeInTheDocument();
      expect(screen.getByTestId('tab-appearance')).toBeInTheDocument();
      expect(screen.getByTestId('tab-notifications')).toBeInTheDocument();
      expect(screen.getByTestId('tab-security')).toBeInTheDocument();
    });

    it('shows the bio in the introduction card', () => {
      render(<Profile />);
      const matches = screen.getAllByText(/Passionate about languages/);
      expect(matches.length).toBeGreaterThanOrEqual(1);
      expect(matches[0]).toBeInTheDocument();
    });

    it('shows the 78% objective progress', () => {
      render(<Profile />);
      expect(screen.getByText('78%')).toBeInTheDocument();
    });

    it('shows the banner style button', () => {
      render(<Profile />);
      expect(screen.getByTestId('banner-style-button')).toBeInTheDocument();
    });
  });

  describe('Tab navigation', () => {
    it('switches to Appearance tab when clicked', () => {
      render(<Profile />);
      fireEvent.click(screen.getByTestId('tab-appearance'));
      expect(screen.getByTestId('appearance-settings')).toBeInTheDocument();
      expect(screen.queryByTestId('general-settings')).not.toBeInTheDocument();
    });

    it('switches to Notifications tab when clicked', () => {
      render(<Profile />);
      fireEvent.click(screen.getByTestId('tab-notifications'));
      expect(screen.getByTestId('notif-settings')).toBeInTheDocument();
      expect(screen.queryByTestId('general-settings')).not.toBeInTheDocument();
    });

    it('switches to Security tab when clicked', () => {
      render(<Profile />);
      fireEvent.click(screen.getByTestId('tab-security'));
      expect(screen.getByTestId('security-settings')).toBeInTheDocument();
      expect(screen.queryByTestId('general-settings')).not.toBeInTheDocument();
    });

    it('switches back to General tab after visiting another tab', () => {
      render(<Profile />);
      fireEvent.click(screen.getByTestId('tab-appearance'));
      fireEvent.click(screen.getByTestId('tab-general'));
      expect(screen.getByTestId('general-settings')).toBeInTheDocument();
    });

    it('active tab has aria-selected=true', () => {
      render(<Profile />);
      expect(screen.getByTestId('tab-general')).toHaveAttribute(
        'aria-selected',
        'true',
      );
      expect(screen.getByTestId('tab-appearance')).toHaveAttribute(
        'aria-selected',
        'false',
      );
    });

    it('updates aria-selected when switching tabs', () => {
      render(<Profile />);
      fireEvent.click(screen.getByTestId('tab-appearance'));
      expect(screen.getByTestId('tab-appearance')).toHaveAttribute(
        'aria-selected',
        'true',
      );
      expect(screen.getByTestId('tab-general')).toHaveAttribute(
        'aria-selected',
        'false',
      );
    });
  });

  describe('General settings', () => {
    it('passes correct initial values to GeneralSettings', () => {
      render(<Profile />);
      expect(screen.getByTestId('input-firstname')).toHaveValue('Adam');
      expect(screen.getByTestId('input-lastname')).toHaveValue('Bouffy');
      expect(screen.getByTestId('input-phone')).toHaveValue(
        '+33 6 00 00 00 00',
      );
    });

    it('updates the first name when changed', () => {
      render(<Profile />);
      fireEvent.change(screen.getByTestId('input-firstname'), {
        target: { value: 'Marie' },
      });
      expect(screen.getByTestId('input-firstname')).toHaveValue('Marie');
    });

    it('updates the last name when changed', () => {
      render(<Profile />);
      fireEvent.change(screen.getByTestId('input-lastname'), {
        target: { value: 'Dupont' },
      });
      expect(screen.getByTestId('input-lastname')).toHaveValue('Dupont');
    });

    it('updates the bio when changed', () => {
      render(<Profile />);
      fireEvent.change(screen.getByTestId('input-bio'), {
        target: { value: 'Updated bio' },
      });
      expect(screen.getByTestId('input-bio')).toHaveValue('Updated bio');
    });

    it('updates the phone number when changed', () => {
      render(<Profile />);
      fireEvent.change(screen.getByTestId('input-phone'), {
        target: { value: '+33 7 11 22 33 44' },
      });
      expect(screen.getByTestId('input-phone')).toHaveValue(
        '+33 7 11 22 33 44',
      );
    });

    it('updates avatar initials when first name changes', () => {
      render(<Profile />);
      fireEvent.change(screen.getByTestId('input-firstname'), {
        target: { value: 'Marie' },
      });
      expect(screen.getByTestId('user-avatar-initials')).toHaveTextContent(
        'MB',
      );
    });

    it('updates avatar initials when last name changes', () => {
      render(<Profile />);
      fireEvent.change(screen.getByTestId('input-lastname'), {
        target: { value: 'Dupont' },
      });
      expect(screen.getByTestId('user-avatar-initials')).toHaveTextContent(
        'AD',
      );
    });
  });

  describe('Appearance settings', () => {
    beforeEach(() => {
      render(<Profile />);
      fireEvent.click(screen.getByTestId('tab-appearance'));
    });

    it('passes the initial avatar color to AppearanceSettings', () => {
      expect(screen.getByTestId('avatar-color')).toHaveTextContent('#2B70C9');
    });

    it('passes the correct initials to AppearanceSettings', () => {
      expect(screen.getByTestId('initials-preview')).toHaveTextContent('AB');
    });

    it('updates avatar color when changed', () => {
      fireEvent.click(screen.getByTestId('change-color'));
      expect(screen.getByTestId('avatar-color')).toHaveTextContent('#FF0000');
    });

    it('updates banner gradient when changed', () => {
      fireEvent.click(screen.getByTestId('change-banner'));
      expect(screen.getByTestId('banner-value')).toHaveTextContent(
        'linear-gradient(135deg, #000 0%, #fff 100%)',
      );
    });

    it('cycles banner preset on banner button click', () => {
      fireEvent.click(screen.getByTestId('banner-style-button'));
      const bannerValue = screen.getByTestId('banner-value').textContent;
      expect(bannerValue).not.toBe('#FFFFFF');
    });
  });

  describe('Banner cycling', () => {
    it('cycles through all banner presets', () => {
      render(<Profile />);
      const btn = screen.getByTestId('banner-style-button');
      fireEvent.click(btn); // preset 1 -> Ocean
      fireEvent.click(btn); // preset 2 -> Night
      fireEvent.click(btn); // preset 3 → back to Minimal (#FFFFFF)
      fireEvent.click(screen.getByTestId('tab-appearance'));
      expect(screen.getByTestId('banner-value')).toHaveTextContent('#FFFFFF');
    });
  });

  describe('Avatar dropdown menu', () => {
    it('opens the dropdown on camera button click', () => {
      render(<Profile />);
      fireEvent.click(screen.getByTestId('avatar-camera-button'));
      expect(screen.getByTestId('avatar-dropdown-menu')).toBeInTheDocument();
    });

    it('closes the dropdown when clicking outside', async () => {
      vi.useRealTimers();
      render(<Profile />);
      fireEvent.click(screen.getByTestId('avatar-camera-button'));
      expect(screen.getByTestId('avatar-dropdown-menu')).toBeInTheDocument();
      fireEvent.mouseDown(document.body);
      await waitFor(() => {
        expect(
          screen.queryByTestId('avatar-dropdown-menu'),
        ).not.toBeInTheDocument();
      });
      vi.useFakeTimers();
    });

    it('closes the dropdown when choosing a photo', () => {
      render(<Profile />);
      fireEvent.click(screen.getByTestId('avatar-camera-button'));
      fireEvent.click(screen.getByText('Choose photo'));
      expect(
        screen.queryByTestId('avatar-dropdown-menu'),
      ).not.toBeInTheDocument();
    });

    it('closes the dropdown when taking a photo', () => {
      render(<Profile />);
      fireEvent.click(screen.getByTestId('avatar-camera-button'));
      fireEvent.click(screen.getByText('Take photo'));
      expect(
        screen.queryByTestId('avatar-dropdown-menu'),
      ).not.toBeInTheDocument();
    });

    it('closes the dropdown on delete', () => {
      render(<Profile />);
      fireEvent.click(screen.getByTestId('avatar-camera-button'));
      fireEvent.click(screen.getByText('Remove'));
      expect(
        screen.queryByTestId('avatar-dropdown-menu'),
      ).not.toBeInTheDocument();
    });

    it('toggles dropdown closed when camera button clicked again', () => {
      render(<Profile />);
      fireEvent.click(screen.getByTestId('avatar-camera-button'));
      fireEvent.click(screen.getByTestId('avatar-camera-button'));
      expect(
        screen.queryByTestId('avatar-dropdown-menu'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Notification settings', () => {
    beforeEach(() => {
      render(<Profile />);
      fireEvent.click(screen.getByTestId('tab-notifications'));
    });

    it('renders the NotifSettings component', () => {
      expect(screen.getByTestId('notif-settings')).toBeInTheDocument();
    });

    it('shows training reminder as enabled by default', () => {
      expect(screen.getByTestId('notif-state-training')).toHaveTextContent(
        'enabled',
      );
    });

    it('shows updates notif as disabled by default', () => {
      expect(screen.getByTestId('notif-state-updates')).toHaveTextContent(
        'disabled',
      );
    });

    it('toggles a notification on click', () => {
      fireEvent.click(screen.getByTestId('notif-toggle-training'));
      expect(screen.getByTestId('notif-state-training')).toHaveTextContent(
        'disabled',
      );
    });

    it('toggles a disabled notification to enabled', () => {
      fireEvent.click(screen.getByTestId('notif-toggle-updates'));
      expect(screen.getByTestId('notif-state-updates')).toHaveTextContent(
        'enabled',
      );
    });

    it('renders all 5 default notifications', () => {
      const ids = [
        'training',
        'recruiters',
        'simulations',
        'updates',
        'weekly',
      ];
      ids.forEach((id) => {
        expect(screen.getByTestId(`notif-toggle-${id}`)).toBeInTheDocument();
      });
    });
  });

  describe('Floating save menu', () => {
    it('is visually hidden initially', () => {
      render(<Profile />);
      expect(screen.getByTestId('floating-save-menu')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
    });

    it('appears after profile change', () => {
      render(<Profile />);
      fireEvent.change(screen.getByTestId('input-firstname'), {
        target: { value: 'Marie' },
      });
      expect(screen.getByTestId('floating-save-menu')).toHaveAttribute(
        'aria-hidden',
        'false',
      );
    });

    it('hides after saving changes', async () => {
      render(<Profile />);
      fireEvent.change(screen.getByTestId('input-firstname'), {
        target: { value: 'Marie' },
      });
      fireEvent.click(screen.getByTestId('save-button'));
      expect(screen.getByTestId('floating-save-menu')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
    });

    it('reset reverts unsaved form value', () => {
      render(<Profile />);
      fireEvent.change(screen.getByTestId('input-firstname'), {
        target: { value: 'Marie' },
      });
      fireEvent.click(screen.getByTestId('reset-changes-button'));
      expect(screen.getByTestId('input-firstname')).toHaveValue('Adam');
    });

    it('locks tab switching when General has unsaved changes', () => {
      render(<Profile />);
      fireEvent.change(screen.getByTestId('input-firstname'), {
        target: { value: 'Marie' },
      });
      fireEvent.click(screen.getByTestId('tab-appearance'));
      expect(screen.getByTestId('general-settings')).toBeInTheDocument();
      expect(screen.queryByTestId('appearance-settings')).not.toBeInTheDocument();
    });

    it('triggers CTA attention when tab switch is blocked', () => {
      render(<Profile />);
      fireEvent.change(screen.getByTestId('input-firstname'), {
        target: { value: 'Marie' },
      });

      const cta = screen.getByTestId('floating-save-menu');
      expect(cta).toHaveAttribute('data-attention', 'false');

      fireEvent.click(screen.getByTestId('tab-appearance'));
      expect(cta).toHaveAttribute('data-attention', 'true');

      act(() => {
        vi.advanceTimersByTime(800);
      });
      expect(cta).toHaveAttribute('data-attention', 'false');
    });
  });
});
