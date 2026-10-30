import { BaseInput } from '@/components/atoms/base-input';
import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { usePostResendOtp, usePostVerifyEmail } from '@/hooks/auth/useServices';
import { extractErrorMessage } from '@/utils/error';
import {
  type ValidationKey,
  emailSchema,
  otpCodeSchema,
  validateWithSchema,
} from '@/utils/validators';
import { useForm } from '@tanstack/react-form';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

const RESEND_COOLDOWN_SEC = 60;

type VerifyEmailFormProps = {
  initialEmail: string;
  redirectTo: string;
};

export const VerifyEmailForm = ({
  initialEmail,
  redirectTo,
}: VerifyEmailFormProps) => {
  const { t } = useTranslation(['auth', 'common']);
  const verifyEmail = usePostVerifyEmail();
  const resendOtp = usePostResendOtp();
  const [serverError, setServerError] = useState<string | null>(null);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  const emailTrimmed = initialEmail.trim();
  const emailMissingOrInvalid =
    validateWithSchema(emailTrimmed, emailSchema) !== undefined;

  useEffect(() => {
    if (resendSecondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setResendSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
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
        setServerError(t('verifyEmailForm.errors.missingEmail'));
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
              extractErrorMessage(error, t('verifyEmailForm.errors.failed')),
            );
          },
        },
      );
    },
  });

  return (
    <div className="flex flex-col w-full gap-3 max-w-96">
      <header className="flex flex-col gap-1 items-start">
        <h2 className="text-h3 text-idle">{t('verifyEmailForm.title')}</h2>
        {emailTrimmed && !emailMissingOrInvalid ? (
          <p className="text-body-l text-idle">
            <Trans
              t={t}
              i18nKey="verifyEmailForm.description"
              values={{ email: emailTrimmed }}
              components={{
                email: <span className="font-medium text-active" />,
              }}
            />
          </p>
        ) : (
          <p className="text-body-l text-idle">
            <Trans
              t={t}
              i18nKey="verifyEmailForm.missingEmailDescription"
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
                {t('otpCode.label')}
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
        <Button
          color="accent"
          type="submit"
          disabled={verifyEmail.isPending || emailMissingOrInvalid}
        >
          <Icon icon="register" color="white" />
          {t('verifyEmailForm.submit')}
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
              setServerError(t('verifyEmailForm.errors.missingEmail'));
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
                    t('otpCode.errors.resendFailed'),
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
            ? t('otpCode.resendCountdown', { seconds: resendSecondsLeft })
            : t('otpCode.resend')}
        </Button>
      </div>

      <p className="text-idle text-label-m">
        <Link
          to="/login"
          className="underline hover:text-active cursor-pointer"
        >
          {t('verifyEmailForm.backToLogin')}
        </Link>
      </p>
    </div>
  );
};

export default VerifyEmailForm;
