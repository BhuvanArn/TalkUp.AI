import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { FieldErrors } from '@/components/molecules/auth/field-errors';
import { PasswordField } from '@/components/molecules/auth/password-field';
import { InputMolecule } from '@/components/molecules/input-molecule';
import { usePostRegisterOrganization } from '@/hooks/auth/useServices';
import { extractErrorMessage } from '@/utils/error';
import {
  type ValidationKey,
  emailSchema,
  keyedSchema,
  passwordSchema,
  validateWithSchema,
} from '@/utils/validators';
import { useForm } from '@tanstack/react-form';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

const organizationNameSchema = keyedSchema(
  z
    .string()
    .min(2, 'auth:validation.organizationNameMinLength' satisfies ValidationKey)
    .max(
      40,
      'auth:validation.organizationNameMaxLength' satisfies ValidationKey,
    ),
);

/**
 * F12: self-serve organization signup — org name + admin email/password.
 * The backend creates the org and its first admin; login happens after
 * the standard email verification (the endpoint returns no tokens).
 */
export const RegisterOrganizationForm = () => {
  const { t } = useTranslation(['auth', 'common']);
  const postRegisterOrganization = usePostRegisterOrganization();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { organizationName: '', email: '', password: '' },
    onSubmit: ({ value }) => {
      setServerError(null);
      postRegisterOrganization.mutate(
        {
          organizationName: value.organizationName.trim(),
          email: value.email,
          password: value.password,
        },
        {
          onError: (error: unknown) => {
            setServerError(
              extractErrorMessage(
                error,
                t('registerOrganizationForm.errors.failed'),
              ),
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
        <h2 className="text-h3 text-idle">
          {t('registerOrganizationForm.title')}
        </h2>
        <p className="text-body-l text-idle mt-1">
          {t('registerOrganizationForm.subtitle')}
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
          name="organizationName"
          validators={{
            onChange: ({ value }) =>
              validateWithSchema(value, organizationNameSchema),
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-2">
              <InputMolecule
                id="organizationName"
                inputType="base"
                type="text"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t(
                  'registerOrganizationForm.organizationNamePlaceholder',
                )}
              />
              <FieldErrors errors={field.state.meta.errors} />
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
                placeholder={t('registerOrganizationForm.emailPlaceholder')}
              />
              <FieldErrors errors={field.state.meta.errors} />
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
                placeholder={t('registerOrganizationForm.passwordPlaceholder')}
                autoComplete="new-password"
                showStrength
              />
              <FieldErrors errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        {serverError && (
          <div className="text-sm text-error text-center" role="alert">
            {serverError}
          </div>
        )}
        <Button color="accent" type="submit">
          <Icon icon="register" color="white" />
          {t('registerOrganizationForm.submit')}
        </Button>
        <p className="text-idle text-label-m">
          <Trans
            t={t}
            i18nKey="registerOrganizationForm.memberSignup"
            components={{
              member: (
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

export default RegisterOrganizationForm;
