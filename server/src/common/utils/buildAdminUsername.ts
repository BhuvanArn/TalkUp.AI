/**
 * Builds a valid admin username (matches CreateUserDto's 3–20 alphanumeric rule)
 * from an arbitrary organization name.
 *
 * Strategy: strip every non-alphanumeric character from the org name, append
 * the literal "admin" suffix, then clamp to the 3–20 length window. If the org
 * name has no alphanumeric characters at all, the result is just "admin".
 *
 * Guarantees the return value satisfies /^[a-zA-Z0-9]+$/ and length 3–20.
 */
export function buildAdminUsername(organizationName: string): string {
  const base = (organizationName ?? "").replace(/[^a-zA-Z0-9]/g, "");
  const suffix = "admin"; // 5 chars, always alphanumeric
  // Reserve room for the suffix so the suffix is never truncated away.
  const maxBase = 20 - suffix.length; // 15
  const trimmedBase = base.slice(0, maxBase);
  const username = `${trimmedBase}${suffix}`;
  // username is now 5–20 chars and alphanumeric; min length is satisfied
  // because the suffix alone is 5 chars (>= 3).
  return username;
}
