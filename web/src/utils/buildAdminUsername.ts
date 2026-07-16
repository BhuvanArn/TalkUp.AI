/**
 * Derives the admin username the backend generates for a self-serve
 * organization signup (F12). This MUST mirror the server's
 * `buildAdminUsername` (server/src/common/utils/buildAdminUsername.ts) exactly,
 * because the signup endpoint returns no body (202 + verification mail only) —
 * so the acknowledgement page has to reproduce the derivation to show the real,
 * loginable username rather than a lookalike.
 *
 * Server algorithm: strip every non-alphanumeric character from the org name,
 * append the literal "admin" suffix, then clamp the base so the result never
 * exceeds 20 chars (matching CreateUserDto's 3-20 alphanumeric rule). An org
 * name with no alphanumeric characters yields just "admin".
 *
 * Guarantees the return value satisfies /^[a-zA-Z0-9]+$/ and length 5-20.
 */
export function buildAdminUsername(organizationName: string): string {
  const base = (organizationName ?? '').replace(/[^a-zA-Z0-9]/g, '');
  const suffix = 'admin'; // 5 chars, always alphanumeric
  // Reserve room for the suffix so it is never truncated away.
  const maxBase = 20 - suffix.length; // 15
  return `${base.slice(0, maxBase)}${suffix}`;
}
