import type { ValidationKey } from '@/utils/validators';
import { useTranslation } from 'react-i18next';

type FieldErrorsProps = {
  /** A field's `state.meta.errors`: i18n keys from its validators. */
  errors: readonly (ValidationKey | undefined)[];
};

/**
 * Translated validation errors under an auth form field. Typing `errors` as
 * keys means a validator that returns plain text fails to type-check.
 */
export const FieldErrors = ({ errors }: FieldErrorsProps) => {
  const { t } = useTranslation(['auth', 'common']);
  const keys = errors.filter((error) => error !== undefined);

  if (keys.length === 0) return null;

  return (
    <span className="text-label-m text-error font-medium ml-1">
      {keys.map((key) => t(key))}
    </span>
  );
};

export default FieldErrors;
