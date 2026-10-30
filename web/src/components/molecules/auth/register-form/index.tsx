import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { PasswordField } from '@/components/molecules/auth/password-field';
import { InputMolecule } from '@/components/molecules/input-molecule';
import { usePostRegister } from '@/hooks/auth/useServices';
import { extractErrorMessage } from '@/utils/error';
import {
  type ValidationKey,
  emailSchema,
  passwordSchema,
  usernameSchema,
  validateWithSchema,
} from '@/utils/validators';
import { useForm } from '@tanstack/react-form';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

/**
 * A component that renders a registration form with username, email, and password fields.
 *
 * This form uses a custom form hook that handles validation and submission.
 * It performs both client-side validation and potentially asynchronous validation.
 *
 * The form includes:
 * - Username input field with validation
 * - Email input field with validation
 * - Password input field with validation
 * - Form-level error messages
 * - Loading indicators during validation
 * - Submit button
 *
 * Visual styling is done with Tailwind CSS, creating a clean interface
 * with consistent spacing and typography matching the login form.
 *
 * @param initialCode - Optional organization code to prefill (F2), e.g. from `?code=`.
 * @returns A register form component with validation and styling
 */
export const RegisterForm = ({
  initialCode,
}: { initialCode?: string } = {}) => {
  const { t } = useTranslation(['auth', 'common']);
  const postRegister = usePostRegister();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      organizationCode: initialCode ?? '',
    },
    onSubmit: ({ value }) => {
      setServerError(null);
      postRegister.mutate(
        {
          username: value.username,
          email: value.email,
          password: value.password,
          organizationCode: value.organizationCode.trim() || undefined,
        },
        {
          onError: (error: unknown) => {
            setServerError(
              extractErrorMessage(error, t('registerForm.errors.failed')),
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
        <h2 className="text-h3 text-idle">{t('registerForm.title')}</h2>
        <p className="text-body-l text-idle mt-1">
          {t('registerForm.subtitle')}
        </p>
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
          name="username"
          validators={{
            onChange: ({ value }) => validateWithSchema(value, usernameSchema),
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-2">
              <InputMolecule
                id="username"
                inputType="base"
                type="text"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t('registerForm.usernamePlaceholder')}
              />
              {field.state.meta.errors.length > 0 && (
                <span className="text-label-m text-error font-medium ml-1">
                  {field.state.meta.errors.map((error) =>
                    t(error as ValidationKey),
                  )}
                </span>
              )}
            </div>
          )}
        </form.Field>
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
                placeholder={t('registerForm.emailPlaceholder')}
              />
              {field.state.meta.errors.length > 0 && (
                <span className="text-label-m text-error font-medium ml-1">
                  {field.state.meta.errors.map((error) =>
                    t(error as ValidationKey),
                  )}
                </span>
              )}
            </div>
          )}
        </form.Field>
        <form.Field
          name="password"
          validators={{
            onChange: ({ value }) => validateWithSchema(value, passwordSchema),
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-2">
              <PasswordField
                id="password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t('registerForm.passwordPlaceholder')}
                autoComplete="new-password"
                showStrength
              />
              {field.state.meta.errors.length > 0 && (
                <span className="text-label-m text-error font-medium ml-1">
                  {field.state.meta.errors.map((error) =>
                    t(error as ValidationKey),
                  )}
                </span>
              )}
            </div>
          )}
        </form.Field>
        <form.Field
          name="organizationCode"
          validators={{
            onChange: ({ value }) =>
              value && value.trim().length > 32
                ? ('auth:validation.organizationCodeTooLong' satisfies ValidationKey)
                : undefined,
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-2">
              <InputMolecule
                id="organizationCode"
                inputType="base"
                type="text"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t('registerForm.organizationCodePlaceholder')}
              />
              {field.state.meta.errors.length > 0 && (
                <span className="text-label-m text-error font-medium ml-1">
                  {field.state.meta.errors.map((error) =>
                    t(error as ValidationKey),
                  )}
                </span>
              )}
            </div>
          )}
        </form.Field>
        <form.Subscribe selector={(state) => state.errors}>
          {(errors) =>
            errors.length > 0 && (
              <span className="text-sm text-red-500 text-center">
                {errors.map((error) => t(String(error) as ValidationKey))}
              </span>
            )
          }
        </form.Subscribe>

        {serverError && (
          <div className="text-sm text-red-600 text-center" role="alert">
            {serverError}
          </div>
        )}
        <Link
          to="/about"
          className="text-idle text-label-m underline hover:text-active cursor-pointer"
        >
          {t('registerForm.terms')}
        </Link>
        <Button color="accent" type="submit">
          <Icon icon="register" color="white" />
          {t('registerForm.submit')}
        </Button>
        <p className="text-idle text-label-m">
          <Trans
            t={t}
            i18nKey="registerForm.hasAccount"
            components={{
              signin: (
                <Link
                  to="/login"
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

export default RegisterForm;
