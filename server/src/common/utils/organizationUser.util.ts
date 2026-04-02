import { Organization } from "@entities/organization.entity";
import { user } from "@entities/user.entity";

/**
 * Resolves the organization UUID for a user row (handles TypeORM relation shape).
 */
export function getUserOrganizationId(u: user): string | null {
  const org = u.organization_id as Organization | string | null | undefined;

  if (org == null) return null;
  if (typeof org === "string") return org;

  return org.organization_id ?? null;
}
