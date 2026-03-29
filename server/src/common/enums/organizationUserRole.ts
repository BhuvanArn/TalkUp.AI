/**
 * Canonical org-related roles stored on `user.user_role`.
 * `none` = signed up without org affiliation.
 */
export const OrganizationUserRole = {
  ADMIN: "admin",
  EMPLOYEE: "employee",
  USER: "user",
  NONE: "none",
} as const;

export type OrganizationUserRoleValue =
  (typeof OrganizationUserRole)[keyof typeof OrganizationUserRole];

export const ORGANIZATION_MEMBER_ROLES: OrganizationUserRoleValue[] = [
  OrganizationUserRole.ADMIN,
  OrganizationUserRole.EMPLOYEE,
  OrganizationUserRole.USER,
];
