/**
 * Extracts the pull request number from environment variables.
 *
 * Prioritizes VITE_VERCEL_GIT_PULL_REQUEST_ID (Vercel's official PR ID variable),
 * and falls back to parsing the branch name from VITE_VERCEL_GIT_COMMIT_REF.
 *
 * @param env - Environment variables object
 * @returns The PR number as a string, or null if not found
 *
 * @example
 * // Using Vercel PR ID
 * getPRNumber({ VITE_VERCEL_GIT_PULL_REQUEST_ID: '42' }) // returns '42'
 *
 * @example
 * // Fallback to branch name parsing
 * getPRNumber({ VITE_VERCEL_GIT_COMMIT_REF: '123-feature' }) // returns '123'
 */
const getPRNumber = (env: Record<string, any>): string | null => {
  const prId = env.VITE_VERCEL_GIT_PULL_REQUEST_ID;

  if (prId && /^\d+$/.test(String(prId))) {
    return String(prId);
  }

  const branch = env.VITE_VERCEL_GIT_COMMIT_REF;

  if (!branch) {
    return null;
  }

  const match = String(branch).match(/^(\d+)-/);
  const result = match ? match[1] : null;

  return result;
};

/**
 * Determines the backend API URL based on the current environment.
 *
 * The URL is selected based on the following priority:
 * 1. Development: Returns localhost URL
 * 2. Production: Returns production Railway URL
 * 3. Preview (with PR): Returns PR-specific Railway URL using the PR number
 * 4. Preview (without PR): Falls back to production URL
 * 5. Default: Returns localhost URL
 *
 * @param env - Environment variables object (typically import.meta.env)
 * @returns The backend API base URL
 *
 * @example
 * // Development mode
 * getBackendUrl({ DEV: true }) // returns 'http://localhost:3000'
 *
 * @example
 * // Vercel preview with PR number
 * getBackendUrl({
 *   VITE_VERCEL_ENV: 'preview',
 *   VITE_VERCEL_GIT_PULL_REQUEST_ID: '42'
 * }) // returns 'https://backend-talkupai-pr-42.up.railway.app'
 *
 * @example
 * // Production mode
 * getBackendUrl({ VITE_VERCEL_ENV: 'production' })
 * // returns 'https://api.talkupai.online'
 */
export const getBackendUrl = (env: Record<string, any>): string => {
  if (env.DEV) {
    const url = env.VITE_BASE_URL || 'http://localhost:3000';
    return url;
  }

  const isProduction =
    env.VITE_VERCEL_ENV === 'production' ||
    (env.PROD && env.VITE_VERCEL_ENV !== 'preview');

  if (isProduction) {
    const url = env.VITE_BASE_URL_PRODUCTION || 'https://api.talkupai.online';
    return url;
  }

  if (env.VITE_VERCEL_ENV === 'preview') {
    const prNumber = getPRNumber(env);

    if (prNumber) {
      const url = `https://backend-talkupai-pr-${prNumber}.up.railway.app`;
      return url;
    }

    const fallbackUrl =
      env.VITE_BASE_URL_PRODUCTION || 'https://api.talkupai.online';
    return fallbackUrl;
  }

  const defaultUrl = env.VITE_BASE_URL || 'http://localhost:3000';
  return defaultUrl;
};

export const API_BASE_URL = getBackendUrl(import.meta.env);
