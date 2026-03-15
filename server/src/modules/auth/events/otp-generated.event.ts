import { OtpPurpose } from "@common/enums/OtpPurpose";

export type OtpGeneratedEvent = {
  email: string;
  plainOtp: string;
  purpose: OtpPurpose;
};
