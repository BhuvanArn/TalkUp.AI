import { BaseInput } from '@/components/atoms/base-input';
import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { usePostResendOtp, usePostVerifyEmail } from '@/hooks/auth/useServices';
import { extractErrorMessage } from '@/utils/error';
import {
  emailSchema,
  otpCodeSchema,
  validateWithSchema,
} from '@/utils/validators';
import { useForm } from '@tanstack/react-form';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

const RESEND_COOLDOWN_SEC = 60;

type VerifyEmailFormProps = {
  initialEmail: string;
  redirectTo: string;
};

export const VerifyEmailForm = ({
  initialEmail,
  redirectTo,
}: VerifyEmailFormProps) => {
  const verifyEmail = usePostVerifyEmail();
  const resendOtp = usePostResendOtp();
  const [serverError, setServerError] = useState<string | null>(null);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  const emailTrimmed = initialEmail.trim();
  const emailMissingOrInvalid =
    validateWithSchema(emailTrimmed, emailSchema) !== undefined;

  useEffect(() => {
    if (resendSecondsLeft <= 0) return;
    const t = window.setInterval(() => {
      setResendSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [resendSecondsLeft]);

  const startCooldown = () => {
    setResendSecondsLeft(RESEND_COOLDOWN_SEC);
  };

  const form = useForm({
    defaultValues: {
      otpCode: '',
    },
    onSubmit: ({ value }) => {
      setServerError(null);
      if (emailMissingOrInvalid) {
        setServerError(
          'Missing email. Open this page from the link after registering.',
        );
        return;
      }
      verifyEmail.mutate(
        {
          email: emailTrimmed,
          otpCode: value.otpCode.trim(),
          redirectTo,
        },
        {
          onError: (error: unknown) => {
            setServerError(
              extractErrorMessage(
                error,
                'Verification failed. Please try again.',
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
        <h2 className="text-h3 text-idle">Verify your email</h2>
        {emailTrimmed && !emailMissingOrInvalid ? (
          <p className="text-body-l text-idle">
            Enter the 6-digit code we sent to{' '}
            <span className="font-medium text-active">{emailTrimmed}</span>. If
            you don&apos;t see it, check spam or request a new code.
          </p>
        ) : (
          <p className="text-body-l text-idle">
            Enter the 6-digit code from your email. If you landed here without
            registering first,{' '}
            <Link
              to="/register"
              className="underline hover:text-active cursor-pointer"
            >
              create an account
            </Link>
            .
          </p>
        )}
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
          name="otpCode"
          validators={{
            onChange: ({ value }) => validateWithSchema(value, otpCodeSchema),
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-2 items-stretch">
              <label
                htmlFor="verify-otp"
                className="text-label-m text-idle sr-only"
              >
                Verification code
              </label>
              <BaseInput
                id="verify-otp"
                name="otpCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={field.state.value}
                onChange={(e) =>
                  field.handleChange(
                    e.target.value.replace(/\D/g, '').slice(0, 6),
                  )
                }
                onBlur={field.handleBlur}
                placeholder="000000"
                aria-invalid={field.state.meta.errors.length > 0}
                className="text-center font-mono text-h3 tabular-nums tracking-[0.35em] placeholder:tracking-[0.35em] py-3"
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
          disabled={verifyEmail.isPending || emailMissingOrInvalid}
        >
          <Icon icon="register" color="white" />
          Verify and continue
        </Button>
      </form>

      <div className="flex flex-col gap-2 items-center">
        <Button
          color="neutral"
          type="button"
          disabled={
            resendOtp.isPending ||
            resendSecondsLeft > 0 ||
            emailMissingOrInvalid
          }
          onClick={() => {
            setServerError(null);
            if (emailMissingOrInvalid) {
              setServerError(
                'Missing email. Open this page from the link after registering.',
              );
              return;
            }
            resendOtp.mutate(
              { email: emailTrimmed, purpose: 'REGISTER' },
              {
                onSuccess: () => {
                  startCooldown();
                },
                onError: (error: unknown) => {
                  const msg = extractErrorMessage(
                    error,
                    'Could not resend code. Please try again.',
                  );
                  setServerError(msg);
                  if (
                    typeof error === 'object' &&
                    error !== null &&
                    'response' in error &&
                    typeof (error as { response?: { status?: number } })
                      .response?.status === 'number' &&
                    (error as { response: { status: number } }).response
                      .status === 429
                  ) {
                    startCooldown();
                  }
                },
              },
            );
          }}
        >
          <Icon icon="arrow-right" color="white" />
          {resendSecondsLeft > 0
            ? `Resend code (${resendSecondsLeft}s)`
            : 'Resend code'}
        </Button>
      </div>

      <p className="text-idle text-label-m">
        <Link
          to="/login"
          className="underline hover:text-active cursor-pointer"
        >
          Back to login
        </Link>
      </p>
    </div>
  );
};

export default VerifyEmailForm;
