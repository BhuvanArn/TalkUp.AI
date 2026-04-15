import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { InputMolecule } from '@/components/molecules/input-molecule';
import { usePostPasswordResetRequest } from '@/hooks/auth/useServices';
import { extractErrorMessage } from '@/utils/error';
import { emailSchema, validateWithSchema } from '@/utils/validators';
import { useForm } from '@tanstack/react-form';
import { Link, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import toast from 'react-hot-toast';

/**
 * Step 1 of password reset: request OTP; then navigate to /reset-password.
 */
type ForgotPasswordFormProps = {
  initialEmail?: string;
};

export const ForgotPasswordForm = ({ initialEmail = '' }: ForgotPasswordFormProps) => {
  const router = useRouter();
  const passwordResetRequest = usePostPasswordResetRequest();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: initialEmail,
    },
    onSubmit: ({ value }) => {
      setServerError(null);
      const email = value.email.trim();
      passwordResetRequest.mutate(
        { email },
        {
          onSuccess: () => {
            toast.success(
              'If an account exists for this email, check your inbox for a 6-digit code.',
            );
            router.navigate({
              to: '/reset-password',
              search: { email },
            });
          },
          onError: (error: unknown) => {
            setServerError(
              extractErrorMessage(
                error,
                'Could not send reset instructions. Please try again.',
              ),
            );
          },
        },
      );
    },
  });

  return (
    <div className="flex flex-col w-full gap-3 max-w-96">
      <header className="flex flex-col gap-1 items-start">
        <h2 className="text-h3 text-idle">Forgot password?</h2>
        <p className="text-body-l text-idle">
          Enter your email and we&apos;ll send you a 6-digit code to reset your
          password.
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
          name="email"
          validators={{
            onChange: ({ value }) => validateWithSchema(value, emailSchema),
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-2">
              <InputMolecule
                id="forgot-password-email"
                inputType="base"
                type="email"
                value={field.state.value}
                onChange={(e) => {
                  field.handleChange(e.target.value);
                  setServerError(null);
                }}
                onBlur={field.handleBlur}
                placeholder="What email did you use?"
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

        <Button
          color="accent"
          type="submit"
          disabled={passwordResetRequest.isPending}
        >
          <Icon icon="arrow-right" color="white" />
          Continue
        </Button>

        <p className="text-idle text-label-m">
          <Link
            to="/login"
            className="underline hover:text-active cursor-pointer"
          >
            Back to login.
          </Link>
        </p>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;
