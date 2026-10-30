import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { FieldErrors } from '@/components/molecules/auth/field-errors';
import { PasswordField } from '@/components/molecules/auth/password-field';
import { InputMolecule } from '@/components/molecules/input-molecule';
import { usePostLogin } from '@/hooks/auth/useServices';
import { extractErrorMessage } from '@/utils/error';
import {
  emailSchema,
  loginPasswordSchema,
  validateWithSchema,
} from '@/utils/validators';
import { useForm } from '@tanstack/react-form';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

/**
 * A component that renders a login form with username and password fields.
 *
 * This form uses a custom form hook that handles validation and submission.
 * It performs both client-side validation (checking for empty fields) and
 * potentially asynchronous validation through the validateLogin function.
 *
 * The form includes:
 * - Email input field with validation
 * - Password input field with validation
 * - Loading indicators during validation
 * - Submit button
 *
 * Visual styling is done with Tailwind CSS, creating a clean, shadowed card
 * with consistent spacing and typography.
 *
 * @returns A login form component with validation and styling
 */
export const LoginForm = () => {
  const { t } = useTranslation(['auth', 'common']);
  const postLogin = usePostLogin();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: ({ value }) => {
      setServerError(null);
      postLogin.mutate(
        {
          email: value.email,
          password: value.password,
        },
        {
          onError: (error: unknown) => {
            setServerError(
              extractErrorMessage(error, t('loginForm.errors.failed')),
            );
          },
          onSuccess: () => setServerError(null),
        },
      );
    },
  });

  return (
    <div className="flex flex-col w-full gap-3 max-w-96">
      <header className="flex items-center justify-start gap-4">
        <h2 className="text-h3 text-idle">{t('loginForm.title')}</h2>
        <p className="text-body-l text-idle mt-1">{t('loginForm.subtitle')}</p>
      </header>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) => validateWithSchema(value, emailSchema),
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-2">
              <InputMolecule
                id="email"
                inputType="base"
                type="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t('loginForm.emailPlaceholder')}
              />
              <FieldErrors errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
        <form.Field
          name="password"
          validators={{
            onChange: ({ value }) =>
              validateWithSchema(value, loginPasswordSchema),
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-2">
              <PasswordField
                id="password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t('loginForm.passwordPlaceholder')}
                autoComplete="current-password"
              />
              <FieldErrors errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
        {serverError && (
          <div className="text-sm text-red-600 text-center" role="alert">
            {serverError}
          </div>
        )}
        <Link
          to="/forgot-password"
          className="text-idle text-label-m underline hover:text-active cursor-pointer"
        >
          {t('loginForm.forgotPassword')}
        </Link>
        <Button color="accent" type="submit">
          <Icon icon="login" color="white" />
          {t('loginForm.submit')}
        </Button>
        <p className="text-idle text-label-m">
          <Trans
            t={t}
            i18nKey="loginForm.noAccount"
            components={{
              signup: (
                <Link
                  to="/register"
                  className="underline hover:text-active cursor-pointer"
                />
              ),
            }}
          />
        </p>
      </form>
    </div>
  );
};

export default LoginForm;
