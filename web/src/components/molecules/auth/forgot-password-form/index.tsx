import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { InputMolecule } from '@/components/molecules/input-molecule';
import { emailSchema, validateWithSchema } from '@/utils/validators';
import { useForm } from '@tanstack/react-form';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

/**
 * Forgot-password form: same layout and tokens as Login / Register.
 * Submit is client-side only until the reset API exists.
 */
export const ForgotPasswordForm = () => {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm({
    defaultValues: {
      email: '',
    },
    onSubmit: () => {
      setSubmitted(true);
    },
  });

  return (
    <div className="flex flex-col w-full gap-3 max-w-96">
      <header className="flex flex-col gap-1 items-start">
        <h2 className="text-h3 text-idle">Forgot password?</h2>
        <p className="text-body-l text-idle">
          Enter your email and we&apos;ll send you a link to reset your
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
                  setSubmitted(false);
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

        <Button color="accent" type="submit">
          <Icon icon="arrow-right" color="white" />
          Send reset link
        </Button>

        {submitted && (
          <p className="text-body-sm text-success text-center" role="status">
            If an account exists for this email, you will receive reset
            instructions shortly.
          </p>
        )}
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
