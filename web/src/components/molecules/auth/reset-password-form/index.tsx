import { BaseInput } from '@/components/atoms/base-input';
import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { PasswordField } from '@/components/molecules/auth/password-field';
import {
  usePasswordResetComplete,
  usePostResendOtp,
} from '@/hooks/auth/useServices';
import { extractErrorMessage } from '@/utils/error';
import {
  type ValidationKey,
  emailSchema,
  otpCodeSchema,
  passwordSchema,
  validateWithSchema,
} from '@/utils/validators';
import { useForm } from '@tanstack/react-form';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

const RESEND_COOLDOWN_SEC = 60;

type ResetPasswordFormProps = {
  initialEmail: string;
};

export const ResetPasswordForm = ({ initialEmail }: ResetPasswordFormProps) => {
  const { t } = useTranslation(['auth', 'common']);
  const completeReset = usePasswordResetComplete();
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
      newPassword: '',
      confirmPassword: '',
    },
    onSubmit: ({ value }) => {
      setServerError(null);
      if (emailMissingOrInvalid) {
        setServerError(t('resetPasswordForm.errors.missingEmail'));
        return;
      }
      const pwdErr = validateWithSchema(value.newPassword, passwordSchema);
      if (pwdErr) {
        setServerError(t(pwdErr as ValidationKey));
        return;
      }
      if (value.newPassword !== value.confirmPassword) {
        setServerError(t('resetPasswordForm.errors.passwordMismatch'));
        return;
      }
      completeReset.mutate(
        {
          email: emailTrimmed,
          otpCode: value.otpCode.trim(),
          newPassword: value.newPassword,
        },
        {
          onError: (error: unknown) => {
            setServerError(
              extractErrorMessage(error, t('resetPasswordForm.errors.failed')),
            );
          },
        },
      );
    },
  });

  return (
    <div className="flex flex-col w-full gap-3 max-w-96">
      <header className="flex flex-col gap-1 items-start">
        <h2 className="text-h3 text-idle">{t('resetPasswordForm.title')}</h2>
        {emailTrimmed && !emailMissingOrInvalid ? (
          <p className="text-body-l text-idle">
            <Trans
              t={t}
              i18nKey="resetPasswordForm.description"
              components={{
                email: (
                  <span className="font-medium text-active">
                    {emailTrimmed}
                  </span>
                ),
              }}
            />
          </p>
        ) : (
          <p className="text-body-l text-idle">
            <Trans
              t={t}
              i18nKey="resetPasswordForm.missingEmailDescription"
              components={{
                back: (
                  <Link
                    to="/forgot-password"
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
                htmlFor="reset-otp"
                className="text-label-m text-idle sr-only"
              >
                {t('otpCode.label')}
              </label>
              <BaseInput
                id="reset-otp"
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

        <form.Field
          name="newPassword"
          validators={{
            onChange: ({ value }) => validateWithSchema(value, passwordSchema),
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-2">
              <PasswordField
                id="reset-new-password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t('resetPasswordForm.newPasswordPlaceholder')}
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

        <form.Field name="confirmPassword">
          {(field) => (
            <div className="flex flex-col gap-2">
              <PasswordField
                id="reset-confirm-password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t('resetPasswordForm.confirmPasswordPlaceholder')}
                autoComplete="new-password"
              />
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
          disabled={completeReset.isPending || emailMissingOrInvalid}
        >
          <Icon icon="register" color="white" />
          {t('resetPasswordForm.submit')}
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
              setServerError(t('resetPasswordForm.errors.missingEmail'));
              return;
            }
            resendOtp.mutate(
              { email: emailTrimmed, purpose: 'RESET_PASSWORD' },
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
          {t('resetPasswordForm.backToLogin')}
        </Link>
      </p>
    </div>
  );
};

export default ResetPasswordForm;
