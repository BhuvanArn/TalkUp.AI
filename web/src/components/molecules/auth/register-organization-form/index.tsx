import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { InputMolecule } from '@/components/molecules/input-molecule';
import { usePostRegisterOrganization } from '@/hooks/auth/useServices';
import { extractErrorMessage } from '@/utils/error';
import {
  emailSchema,
  passwordSchema,
  validateWithSchema,
} from '@/utils/validators';
import { useForm } from '@tanstack/react-form';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { z } from 'zod';

const organizationNameSchema = z
  .string()
  .min(2, 'Organization name must be at least 2 characters')
  .max(40, 'Organization name must be at most 40 characters');

/**
 * F12: self-serve organization signup — org name + admin email/password.
 * The backend creates the org and its first admin; login happens after
 * the standard email verification (the endpoint returns no tokens).
 */
export const RegisterOrganizationForm = () => {
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
                'Organization signup failed. Please try again.',
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
        <h2 className="text-h3 text-idle">Create your organization</h2>
        <p className="text-body-l text-idle mt-1">Start your 30-day trial</p>
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
                placeholder="Organization name"
              />
              {field.state.meta.errors.length > 0 && (
                <span className="text-label-m text-error font-medium ml-1">
                  {field.state.meta.errors}
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
                placeholder="Admin email address"
              />
              {field.state.meta.errors.length > 0 && (
                <span className="text-label-m text-error font-medium ml-1">
                  {field.state.meta.errors}
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
              <InputMolecule
                id="password"
                inputType="base"
                type="password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Create a secure password"
              />
              {field.state.meta.errors.length > 0 && (
                <span className="text-label-m text-error font-medium ml-1">
                  {field.state.meta.errors}
                </span>
              )}
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
          Create organization
        </Button>
        <p className="text-idle text-label-m">
          Joining with an invite code?{' '}
          <Link
            to="/register"
            className="underline hover:text-active cursor-pointer"
          >
            Register as a member instead.
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterOrganizationForm;
