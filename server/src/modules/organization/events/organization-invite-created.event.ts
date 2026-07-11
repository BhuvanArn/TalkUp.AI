export type OrganizationInviteCreatedEvent = {
  email: string;
  code: string;
  organizationName: string;
  role: string;
  expiresAt: Date;
  /** Full URL to the register page with the code prefilled (FRONTEND_URL based). */
  registerUrl?: string;
};
