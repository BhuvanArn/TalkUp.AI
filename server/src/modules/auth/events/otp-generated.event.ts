import { OtpPurpose } from "@common/enums/OtpPurpose";

export type RegistrationChannel = "self" | "organization";

export type OtpGeneratedEvent = {
  email: string;
  plainOtp: string;
  purpose: OtpPurpose;
  /** Present when registration was triggered by an organization (trusted register). */
  registrationChannel?: RegistrationChannel;
  organizationName?: string;
  /**
   * Present only for the self-serve organization admin signup (F12). When set,
   * the mail listener sends the org-admin welcome email (org name + this
   * username + code) instead of the member-invite email. Member invites and
   * ops provisioning leave this undefined.
   */
  adminUsername?: string;
  /** Full URL to the web verify-email page (includes email query). */
  verifyUrl?: string;
};
