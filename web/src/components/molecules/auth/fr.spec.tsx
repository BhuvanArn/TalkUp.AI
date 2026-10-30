import AuthPageShell from '@/components/molecules/auth-page-shell';
import ConvincingBanner from '@/components/molecules/convincing-banner';
import * as services from '@/hooks/auth/useServices';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import i18next from 'i18next';
import toast from 'react-hot-toast';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ForgotPasswordForm } from './forgot-password-form';
import { LoginForm } from './login-form';
import { OrganizationCreated } from './organization-created';
import { PasswordField } from './password-field';
import PhoneNumber from './phone-number/phonenumber';
import { RegisterForm } from './register-form';
import { RegisterOrganizationForm } from './register-organization-form';
import { ResetPasswordForm } from './reset-password-form';
import { VerifyEmailForm } from './verify-email-form';

/**
 * French typography puts a non-breaking space before `? ! : ;`. Testing
 * Library normalizes it to a plain space in text queries, so matchers use
 * `SP`; raw attributes and accessible names keep `NBSP`.
 */
const NBSP = ' ';
const SP = ' ';

const mutation = () => ({ mutate: vi.fn(), isPending: false });

type MutateOptions = {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

/**
 * Make `hook` return a mutation whose `mutate` settles at once through
 * `settle`. The `afterEach` below restores the inert default.
 */
const settleWith = (
  hook: (typeof services)[keyof typeof services],
  settle: (options: MutateOptions) => void,
) => {
  vi.mocked(hook as () => unknown).mockReturnValue({
    mutate: vi.fn((_variables: unknown, options?: MutateOptions) =>
      settle(options ?? {}),
    ),
    isPending: false,
  });
};

vi.mock('@/hooks/auth/useServices', () => ({
  usePostLogin: vi.fn(() => mutation()),
  usePostRegister: vi.fn(() => mutation()),
  usePostRegisterOrganization: vi.fn(() => mutation()),
  usePostVerifyEmail: vi.fn(() => mutation()),
  usePostResendOtp: vi.fn(() => mutation()),
  usePostPasswordResetRequest: vi.fn(() => mutation()),
  usePasswordResetComplete: vi.fn(() => mutation()),
}));

vi.mock('@tanstack/react-router', () => ({
  useRouter: vi.fn(() => ({ navigate: vi.fn() })),
  useNavigate: vi.fn(() => vi.fn()),
  Link: ({
    children,
    to,
    ...rest
  }: {
    children?: React.ReactNode;
    to: string;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

/** Type a value then clear it, so the field's onChange validator runs. */
const typeThenClear = (input: HTMLElement) => {
  fireEvent.change(input, { target: { value: 'x' } });
  fireEvent.change(input, { target: { value: '' } });
};

describe('auth flows in French', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await act(() => i18next.changeLanguage('fr'));
  });

  afterEach(async () => {
    for (const hook of Object.values(services)) {
      vi.mocked(hook as () => unknown).mockImplementation(mutation);
    }
    // setupTests pins English for every other test.
    await act(() => i18next.changeLanguage('en'));
  });

  describe('LoginForm', () => {
    it('renders the form and its sign-up link in French', () => {
      render(<LoginForm />);

      expect(
        screen.getByRole('heading', { name: 'Connexion' }),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(
          `Quelle adresse e-mail avez-vous utilisée${SP}?`,
        ),
      ).toHaveAttribute(
        'placeholder',
        `Quelle adresse e-mail avez-vous utilisée${NBSP}?`,
      );
      expect(
        screen.getByRole('button', { name: 'Se connecter' }),
      ).toBeInTheDocument();
      const link = screen.getByRole('link', { name: 'Créez-en un' });
      expect(link).toHaveAttribute('href', '/register');
      expect(link.parentElement).toHaveTextContent(
        `Vous n’avez pas de compte${SP}? Créez-en un`,
      );
    });

    it('shows validation errors in French', () => {
      render(<LoginForm />);

      fireEvent.change(
        screen.getByPlaceholderText(
          `Quelle adresse e-mail avez-vous utilisée${SP}?`,
        ),
        { target: { value: 'not-an-email' } },
      );
      typeThenClear(
        screen.getByPlaceholderText('Saisissez votre mot de passe'),
      );

      expect(screen.getByText('Adresse e-mail invalide')).toBeInTheDocument();
      expect(
        screen.getByText('Le mot de passe est obligatoire'),
      ).toBeInTheDocument();
    });

    it('falls back to the French server error', async () => {
      settleWith(services.usePostLogin, ({ onError }) =>
        onError?.(new Error('Network Error')),
      );
      render(<LoginForm />);

      fireEvent.change(
        screen.getByPlaceholderText(
          `Quelle adresse e-mail avez-vous utilisée${SP}?`,
        ),
        { target: { value: 'user@example.com' } },
      );
      fireEvent.change(
        screen.getByPlaceholderText('Saisissez votre mot de passe'),
        { target: { value: 'secret' } },
      );
      fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'La connexion a échoué. Veuillez réessayer.',
      );
    });
  });

  describe('RegisterForm', () => {
    it('renders in French and translates validation and strength', () => {
      render(<RegisterForm />);

      expect(
        screen.getByRole('heading', { name: 'Inscription' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: `Connectez-vous${NBSP}!` }),
      ).toHaveAttribute('href', '/login');

      fireEvent.change(
        screen.getByPlaceholderText('Choisissez un nom d’utilisateur'),
        { target: { value: 'ab' } },
      );
      expect(
        screen.getByText(
          `Le nom d’utilisateur doit contenir au moins 3${SP}caractères`,
        ),
      ).toBeInTheDocument();

      fireEvent.change(
        screen.getByPlaceholderText('Créez un mot de passe sécurisé'),
        { target: { value: 'abcdef1' } },
      );
      expect(screen.getByRole('status')).toHaveTextContent(
        `Robustesse${SP}: Faible`,
      );
    });

    it('shows the organization code length error in French', () => {
      render(<RegisterForm />);

      fireEvent.change(
        screen.getByPlaceholderText('Code d’organisation (facultatif)'),
        { target: { value: 'x'.repeat(33) } },
      );
      expect(
        screen.getByText('Le code d’organisation est trop long'),
      ).toBeInTheDocument();
    });
  });

  describe('RegisterOrganizationForm', () => {
    it('renders in French and shows the org name error', () => {
      render(<RegisterOrganizationForm />);

      expect(
        screen.getByRole('heading', { name: 'Créez votre organisation' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(`Commencez votre essai de 30${SP}jours`),
      ).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText('Nom de l’organisation'), {
        target: { value: 'a' },
      });
      expect(
        screen.getByText(
          `Le nom de l’organisation doit contenir au moins 2${SP}caractères`,
        ),
      ).toBeInTheDocument();
    });
  });

  describe('ForgotPasswordForm', () => {
    it('renders in French and shows the required email error', () => {
      render(<ForgotPasswordForm />);

      expect(
        screen.getByRole('heading', { name: `Mot de passe oublié${NBSP}?` }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Retour à la connexion.' }),
      ).toBeInTheDocument();

      typeThenClear(
        screen.getByPlaceholderText(
          `Quelle adresse e-mail avez-vous utilisée${SP}?`,
        ),
      );
      expect(
        screen.getByText('L’adresse e-mail est obligatoire'),
      ).toBeInTheDocument();
    });

    it('confirms the code was sent with a French toast', async () => {
      settleWith(services.usePostPasswordResetRequest, ({ onSuccess }) =>
        onSuccess?.(),
      );
      render(<ForgotPasswordForm initialEmail="user@example.com" />);

      fireEvent.click(screen.getByRole('button', { name: 'Continuer' }));

      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          `Si un compte est associé à cette adresse, vous allez recevoir un code à 6${NBSP}chiffres par e-mail.`,
        ),
      );
    });
  });

  describe('ResetPasswordForm', () => {
    it('renders the code prompt with the email in French', () => {
      render(<ResetPasswordForm initialEmail="user@example.com" />);

      expect(
        screen.getByRole('heading', {
          name: 'Réinitialisez votre mot de passe',
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('user@example.com').parentElement,
      ).toHaveTextContent(
        `Saisissez le code à 6${SP}chiffres envoyé à user@example.com, puis choisissez un nouveau mot de passe.`,
      );
      expect(screen.getByLabelText('Code de vérification')).toBeInTheDocument();
    });

    it('shows the code error in French', () => {
      render(<ResetPasswordForm initialEmail="user@example.com" />);

      fireEvent.change(screen.getByLabelText('Code de vérification'), {
        target: { value: '123' },
      });
      expect(
        screen.getByText(`Le code doit comporter 6${SP}chiffres`),
      ).toBeInTheDocument();
    });

    /** Fill a valid code and password, with `confirm` as the confirmation. */
    const fillReset = (confirm: string) => {
      fireEvent.change(screen.getByLabelText('Code de vérification'), {
        target: { value: '123456' },
      });
      fireEvent.change(screen.getByPlaceholderText('Nouveau mot de passe'), {
        target: { value: 'Abcdefg1!' },
      });
      fireEvent.change(
        screen.getByPlaceholderText('Confirmez le nouveau mot de passe'),
        { target: { value: confirm } },
      );
    };

    it('reports mismatched passwords in French, then in English after a switch', async () => {
      render(<ResetPasswordForm initialEmail="user@example.com" />);

      fillReset('Abcdefg1?');
      fireEvent.click(
        screen.getByRole('button', { name: 'Mettre à jour le mot de passe' }),
      );

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Les mots de passe ne correspondent pas',
      );
      // The error is stored as a key, so it follows the language.
      await act(() => i18next.changeLanguage('en'));
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Passwords do not match',
      );
    });

    it('reports the missing email on submit in French', async () => {
      const { container } = render(<ResetPasswordForm initialEmail="" />);

      fillReset('Abcdefg1!');
      // The submit button is disabled without an email; submit the form.
      fireEvent.submit(container.querySelector('form') as HTMLFormElement);

      expect(await screen.findByRole('alert')).toHaveTextContent(
        `Adresse e-mail manquante. Recommencez depuis «${SP}Mot de passe oublié${SP}» et saisissez votre adresse.`,
      );
    });

    it('falls back to the French reset error, and shows server text as is', async () => {
      settleWith(services.usePasswordResetComplete, ({ onError }) =>
        onError?.(new Error('Network Error')),
      );
      const { unmount } = render(
        <ResetPasswordForm initialEmail="user@example.com" />,
      );

      fillReset('Abcdefg1!');
      fireEvent.click(
        screen.getByRole('button', { name: 'Mettre à jour le mot de passe' }),
      );
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Impossible de réinitialiser le mot de passe. Vérifiez le code et réessayez.',
      );
      unmount();

      settleWith(services.usePasswordResetComplete, ({ onError }) =>
        onError?.({ response: { data: { message: 'Code expired' } } }),
      );
      render(<ResetPasswordForm initialEmail="user@example.com" />);

      fillReset('Abcdefg1!');
      fireEvent.click(
        screen.getByRole('button', { name: 'Mettre à jour le mot de passe' }),
      );
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Code expired',
      );
    });

    it('explains the missing email in French', () => {
      render(<ResetPasswordForm initialEmail="" />);

      expect(
        screen.getByRole('link', { name: 'Revenez en arrière' }),
      ).toHaveAttribute('href', '/forgot-password');
    });
  });

  describe('VerifyEmailForm', () => {
    it('renders in French', () => {
      render(<VerifyEmailForm initialEmail="" redirectTo="/" />);

      expect(
        screen.getByRole('heading', { name: 'Vérifiez votre adresse e-mail' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'inscrivez-vous' }),
      ).toHaveAttribute('href', '/register');
      expect(
        screen.getByRole('button', { name: 'Renvoyer le code' }),
      ).toBeInTheDocument();
    });

    it('shows the required code error in French', () => {
      render(
        <VerifyEmailForm initialEmail="user@example.com" redirectTo="/" />,
      );

      typeThenClear(screen.getByLabelText('Code de vérification'));
      expect(screen.getByText('Le code est obligatoire')).toBeInTheDocument();
    });

    it('counts down the resend in French', () => {
      settleWith(services.usePostResendOtp, ({ onSuccess }) => onSuccess?.());
      render(
        <VerifyEmailForm initialEmail="user@example.com" redirectTo="/" />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Renvoyer le code' }));

      expect(
        screen.getByRole('button', { name: `Renvoyer le code (60${NBSP}s)` }),
      ).toBeDisabled();
    });
  });

  describe('OrganizationCreated', () => {
    it('renders the confirmation in French', () => {
      render(
        <OrganizationCreated organizationName="Acme" email="admin@acme.test" />,
      );

      expect(
        screen.getByRole('heading', { name: 'Organisation créée' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Nom d’utilisateur de l’administrateur'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: 'Vérifier l’adresse e-mail et continuer',
        }),
      ).toBeInTheDocument();
    });

    it('fills the org name and email into the French sentences', () => {
      render(
        <OrganizationCreated organizationName="Acme" email="admin@acme.test" />,
      );

      expect(screen.getByText(/est prête/)).toHaveTextContent(
        'L’organisation Acme est prête. Nous lui avons créé un compte administrateur.',
      );
      expect(screen.getByText(/Pour gérer/)).toHaveTextContent(
        'Pour gérer Acme, vérifiez l’adresse e-mail de l’administrateur, puis connectez-vous avec ce compte. Un code de vérification a été envoyé à admin@acme.test.',
      );
    });

    it('renders markup in the org name and email as text', () => {
      const organizationName = '<strong>Evil</strong> & <br/>Co';
      const email = '<i>admin</i>@evil.test';
      const { container } = render(
        <OrganizationCreated
          organizationName={organizationName}
          email={email}
        />,
      );

      expect(container.querySelector('strong, br, i')).toBeNull();
      expect(screen.getByText(/est prête/).textContent).toBe(
        `L’organisation ${organizationName} est prête. Nous lui avons créé un compte administrateur.`,
      );
      expect(screen.getByText(/Pour gérer/).textContent).toBe(
        `Pour gérer ${organizationName}, vérifiez l’adresse e-mail de l’administrateur, puis connectez-vous avec ce compte. Un code de vérification a été envoyé à ${email}.`,
      );
    });
  });

  describe('PasswordField', () => {
    it('labels the visibility toggle in French', () => {
      render(<PasswordField value="secret" onChange={() => {}} />);

      const toggle = screen.getByRole('button', {
        name: 'Afficher le mot de passe',
      });
      fireEvent.click(toggle);
      expect(toggle).toHaveAccessibleName('Masquer le mot de passe');
    });
  });

  describe('PhoneNumber', () => {
    it('labels the field and names countries in French', () => {
      render(<PhoneNumber />);

      expect(screen.getByLabelText('Numéro de téléphone')).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: /États-Unis/ }),
      ).toBeInTheDocument();
    });
  });

  describe('AuthPageShell and ConvincingBanner', () => {
    it('render in French', () => {
      render(
        <AuthPageShell>
          <ConvincingBanner />
        </AuthPageShell>,
      );

      expect(
        screen.getByRole('link', { name: 'Retour à l’accueil' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Nos utilisateurs nous adorent' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(`Florent a récemment laissé cet avis 5${SP}étoiles`),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Afficher l’avis 3' }),
      ).toBeInTheDocument();
    });

    it('formats the rating with French decimals', () => {
      render(<ConvincingBanner />);

      fireEvent.click(
        screen.getByRole('button', { name: 'Afficher l’avis 3' }),
      );
      expect(
        screen.getByText(`Agathe a récemment laissé cet avis 4,5${SP}étoiles`),
      ).toBeInTheDocument();
    });
  });
});
