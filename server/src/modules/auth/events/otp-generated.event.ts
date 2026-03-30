import { OtpPurpose } from "@common/enums/OtpPurpose";

export type RegistrationChannel = "self" | "organization";

export type OtpGeneratedEvent = {
  email: string;
  plainOtp: string;
  purpose: OtpPurpose;
  /** Present when registration was triggered by an organization (trusted register). */
  registrationChannel?: RegistrationChannel;
  organizationName?: string;
  /** Full URL to the web verify-email page (includes email query). */
  verifyUrl?: string;
};
