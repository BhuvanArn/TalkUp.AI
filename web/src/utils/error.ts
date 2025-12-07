/**
 * Type representing various error shapes we might encounter
 */
type ErrorWithResponse = {
  response?: {
    data?: unknown;
  };
};

type ErrorWithMessage = {
  message?: string;
};

type ErrorInput =
  | string
  | Error
  | ErrorWithResponse
  | ErrorWithMessage
  | unknown;

/**
 * Type guard to check if error has a response property (Axios-like error)
 */
const hasResponse = (error: unknown): error is ErrorWithResponse => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as ErrorWithResponse).response === 'object'
  );
};

/**
 * Type guard to check if error has a message property
 */
const hasMessage = (error: unknown): error is ErrorWithMessage => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as ErrorWithMessage).message === 'string'
  );
};

/**
 * Extract a human-friendly error message from various error shapes.
 *
 * This helper understands common patterns returned by HTTP clients and servers
 * (for example Axios' `error.response.data.message` or a plain `{ message }`)
 * and falls back to a safe fallback message without exposing internal details.
 *
 * Security: This function explicitly avoids exposing internal error details,
 * stack traces, or sensitive data structures to prevent information leakage.
 *
 * @param error - The thrown error or server response object.
 * @param fallback - Message to use when no suitable message can be extracted.
 * @returns A readable error message string safe for UI display.
 */
export const extractErrorMessage = (
  error: ErrorInput,
  fallback = 'An error occurred. Please try again.',
): string => {
  if (!error) return fallback;

  if (typeof error === 'string') return error;

  // Handle HTTP response errors (e.g., Axios, fetch)
  if (hasResponse(error) && error.response?.data) {
    const data = error.response.data;

    if (typeof data === 'string') return data;

    if (typeof data === 'object' && data !== null) {
      const dataObj = data as Record<string, unknown>;

      const formatMessage = (value: unknown): string | null => {
        if (!value && value !== 0) return null;
        if (typeof value === 'string') return value;
        if (Array.isArray(value)) {
          const parts = value.filter((v) => typeof v === 'string') as string[];
          if (parts.length) return parts.join(', ');
          return null;
        }
        if (typeof value === 'object' && value !== null) {
          // try to extract nested message
          const inner = (value as Record<string, unknown>).message;
          if (typeof inner === 'string') return inner;
          if (Array.isArray(inner)) {
            const parts = inner.filter(
              (v) => typeof v === 'string',
            ) as string[];
            if (parts.length) return parts.join(', ');
          }
        }

        return null;
      };

      // Prefer `message` (even when it's an array) over `error`.
      const prioritized =
        formatMessage(dataObj.message) ?? formatMessage(dataObj.error);
      if (prioritized) return prioritized;
    }

    // Don't expose raw data structures - use fallback instead
    return fallback;
  }

  // Only use error.message if it looks like a user-friendly message
  if (hasMessage(error) && error.message) {
    const message = error.message;
    const technicalPrefixes = [
      'Network Error',
      'Failed to fetch',
      'TypeError:',
      'ReferenceError:',
      'SyntaxError:',
      'Internal Server Error',
    ];

    const isTechnicalError = technicalPrefixes.some((prefix) =>
      message.startsWith(prefix),
    );

    if (isTechnicalError) {
      return fallback;
    }

    return message;
  }

  // Default to fallback
  return fallback;
};
