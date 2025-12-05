import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { InputMolecule } from '@/components/molecules/input-molecule';
import { usePostRegister } from '@/hooks/auth/useServices';
import { extractErrorMessage } from '@/utils/error';
import {
  emailSchema,
  passwordSchema,
  usernameSchema,
  validateWithSchema,
} from '@/utils/validators';
import { useForm } from '@tanstack/react-form';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

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
 * @returns A register form component with validation and styling
 */
export const RegisterForm = () => {
  const postRegister = usePostRegister();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
    onSubmit: ({ value }) => {
      setServerError(null);
      postRegister.mutate(
        {
          username: value.username,
          email: value.email,
          password: value.password,
        },
        {
          onError: (error: any) => {
            setServerError(
              extractErrorMessage(
                error,
                'Registration failed. Please try again.',
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
        <h2 className="text-h3 text-idle">Register</h2>
        <p className="text-body-l text-idle mt-1">Create your account</p>
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
                placeholder="Choose a username"
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
                placeholder="Your email address"
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
        <form.Subscribe selector={(state) => state.errors}>
          {(errors) =>
            errors.length > 0 && (
              <span className="text-sm text-red-500 text-center">{errors}</span>
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
          Learn about our Terms of Service
        </Link>
        <Button color="accent" type="submit">
          <Icon icon="register" color="white" />
          Register
        </Button>
        <p className="text-idle text-label-m">
          Already have an account?{' '}
          <Link
            to="/login"
            className="underline hover:text-active cursor-pointer"
          >
            Let's get you back in!
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterForm;
