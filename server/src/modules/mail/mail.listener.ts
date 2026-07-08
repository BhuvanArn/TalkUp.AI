import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { OtpPurpose } from "@common/enums/OtpPurpose";

import { OtpGeneratedEvent } from "@src/modules/auth/events/otp-generated.event";
import { MailService } from "./mail.service";
import { renderOtpEmail } from "./templates/email-layout";

const OTP_EXPIRY_MINUTES = 15;

// Anti-phishing warning. Lead clause (up to first period) is emphasised by the
// renderer. TalkUp never asks for this code by phone, email, or chat.
const SECURITY_NOTE =
  "Do NOT share this code with anyone. Only enter it on the official TalkUp website. If someone asks you for it, it could be a scam.";
const SIGNOFF = "— The TalkUp Team";

@Injectable()
export class MailListener {
  private readonly logger = new Logger(MailListener.name);

  constructor(private readonly mailService: MailService) {}

  @OnEvent("auth.otp_generated", { async: true })
  async onOtpGenerated(payload: OtpGeneratedEvent) {
    await this.sendOtpMail(payload);
  }

  @OnEvent("auth.reset_password_requested", { async: true })
  async onPasswordResetRequested(payload: OtpGeneratedEvent) {
    await this.sendOtpMail(payload);
  }

  private async sendOtpMail(payload: OtpGeneratedEvent) {
    if (
      payload.purpose === OtpPurpose.REGISTER &&
      payload?.registrationChannel === "organization" &&
      payload?.organizationName
    ) {
      await this.sendOrganizationInviteRegisterMail(payload);
      return;
    }

    const { subject, heading } = this.resolveTemplate(
      payload.purpose,
      payload.plainOtp,
    );

    const { html, text } = renderOtpEmail({
      heading,
      intro: "Your one-time verification code is:",
      code: payload.plainOtp,
      expiryMinutes: OTP_EXPIRY_MINUTES,
      securityNote: SECURITY_NOTE,
      signoff: SIGNOFF,
    });

    try {
      await this.mailService.sendMail({
        to: payload.email,
        subject,
        html,
        text,
      });
    } catch (error) {
      this.logger.error(
        `Failed to dispatch OTP email to ${payload.email}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async sendOrganizationInviteRegisterMail(payload: OtpGeneratedEvent) {
    const orgName = payload.organizationName ?? "";
    const subject = `Your TalkUp account — invited by ${orgName}`;

    // The renderer owns all HTML/escaping and scheme-guards the CTA href to
    // http(s); we pass only data. A missing/non-http verifyUrl falls back to
    // the `note` copy automatically. All strings here are raw — never markup.
    const { html, text } = renderOtpEmail({
      heading: "Confirm your email",
      preHeading: `The organization ${orgName} has created an account for you on TalkUp. If this is unexpected, you can ignore this email.`,
      intro:
        "Otherwise, verify your account and use the code below to get started:",
      code: payload.plainOtp,
      expiryMinutes: OTP_EXPIRY_MINUTES,
      cta: payload.verifyUrl
        ? {
            href: payload.verifyUrl,
            label: "Verify your account",
            helperText: `Or copy this link: ${payload.verifyUrl}`,
          }
        : undefined,
      note: "Verify your email using the TalkUp sign-in flow on the website.",
      securityNote: SECURITY_NOTE,
      signoff: SIGNOFF,
    });

    try {
      await this.mailService.sendMail({
        to: payload.email,
        subject,
        html,
        text,
      });
    } catch (error) {
      this.logger.error(
        `Failed to dispatch OTP email to ${payload.email}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private resolveTemplate(
    purpose: OtpPurpose,
    code: string,
  ): {
    subject: string;
    heading: string;
  } {
    // Lead the subject with the code so it is visible in the inbox list and
    // notification preview (Railway-style), which lets the recipient read it
    // without opening the mail. The code is single-use and short-lived.
    switch (purpose) {
      case OtpPurpose.REGISTER:
        return {
          subject: `${code} is your TalkUp verification code`,
          heading: "Confirm your email",
        };
      case OtpPurpose.RESET_PASSWORD:
        return {
          subject: `${code} is your TalkUp password reset code`,
          heading: "Password reset request",
        };
      case OtpPurpose.NEW_DEVICE:
        return {
          subject: `${code} is your TalkUp device verification code`,
          heading: "New device verification",
        };
      default:
        return {
          subject: `${code} is your TalkUp verification code`,
          heading: "Verification required",
        };
    }
  }
}
