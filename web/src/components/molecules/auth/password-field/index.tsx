import { BaseInput } from '@/components/atoms/base-input';
import { Icon } from '@/components/atoms/icon';
import { cn } from '@/utils/cn';
import { type StrengthScore, scorePassword } from '@/utils/password-strength';
import React, { useId, useState } from 'react';

import type { PasswordFieldProps } from './types';

/** Semantic Tailwind fill per segment index, keyed by score. */
const SEGMENT_FILL: Record<Exclude<StrengthScore, 0>, string> = {
  1: 'bg-error',
  2: 'bg-warning',
  3: 'bg-accent',
  4: 'bg-success',
};

const LABEL_TEXT: Record<Exclude<StrengthScore, 0>, string> = {
  1: 'text-error',
  2: 'text-warning',
  3: 'text-accent',
  4: 'text-success',
};

/**
 * Password input with an optional show/hide toggle and an advisory strength
 * meter. Wraps BaseInput directly and owns the relative positioning context
 * for the toggle. The meter is advisory only — validation stays with the form.
 */
export const PasswordField: React.FC<PasswordFieldProps> = ({
  id,
  label,
  showToggle = true,
  showStrength = false,
  value,
  className,
  ...rest
}) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [revealed, setRevealed] = useState(false);

  const strengthId = showStrength ? `${inputId}-strength` : undefined;
  const strValue = typeof value === 'string' ? value : '';
  const { score, label: strengthLabel } = scorePassword(strValue);

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-label-m text-idle">
          {label}
        </label>
      )}

      <div className="relative">
        <BaseInput
          {...rest}
          id={inputId}
          value={strValue}
          type={revealed ? 'text' : 'password'}
          aria-describedby={strengthId}
          className={cn('w-full', showToggle && 'pr-10', className)}
        />

        {showToggle && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            aria-pressed={revealed}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-text-weaker hover:text-text focus:outline-none focus:ring-2 focus:ring-accent rounded-sm"
          >
            <Icon
              icon={revealed ? 'eye-slash' : 'eye'}
              size="md"
              color="inherit"
            />
          </button>
        )}
      </div>

      {showStrength && (
        <div className="flex flex-col gap-1">
          <div className="flex gap-1" aria-hidden="true">
            {[1, 2, 3, 4].map((seg) => (
              <div
                key={seg}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  seg <= score && score > 0
                    ? SEGMENT_FILL[score as Exclude<StrengthScore, 0>]
                    : 'bg-border',
                )}
              />
            ))}
          </div>
          <p
            id={strengthId}
            role="status"
            aria-live="polite"
            className={cn(
              'text-label-s',
              score > 0
                ? LABEL_TEXT[score as Exclude<StrengthScore, 0>]
                : 'text-idle',
            )}
          >
            {strValue.length > 0 ? `Strength: ${strengthLabel}` : ''}
          </p>
        </div>
      )}
    </div>
  );
};
