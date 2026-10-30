import AuthPageShell from '@/components/molecules/auth-page-shell';
import ConvincingBanner from '@/components/molecules/convincing-banner';
import { act, fireEvent, render, screen } from '@testing-library/react';
import i18next from 'i18next';
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

/** Type a value then clear it, so the field's onChange validator runs. */
const typeThenClear = (input: HTMLElement) => {
  fireEvent.change(input, { target: { value: 'x' } });
  fireEvent.change(input, { target: { value: '' } });
};

describe('auth flows in French', () => {
  beforeEach(async () => {
    await act(() => i18next.changeLanguage('fr'));
  });

  afterEach(async () => {
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
