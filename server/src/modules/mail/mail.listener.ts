import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { OtpPurpose } from "@common/enums/OtpPurpose";

import { OtpGeneratedEvent } from "@src/modules/auth/events/otp-generated.event";
import { MailService } from "./mail.service";
import { renderOtpEmail } from "./templates/email-layout";

const OTP_EXPIRY_MINUTES = 15;

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

    const { subject, heading } = this.resolveTemplate(payload.purpose);

    const { html, text } = renderOtpEmail({
      heading,
      intro: "Your one-time verification code is:",
      code: payload.plainOtp,
      expiryMinutes: OTP_EXPIRY_MINUTES,
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

  private resolveTemplate(purpose: OtpPurpose): {
    subject: string;
    heading: string;
  } {
    switch (purpose) {
      case OtpPurpose.REGISTER:
        return {
          subject: "Verify your TalkUp account",
          heading: "Confirm your email",
        };
      case OtpPurpose.RESET_PASSWORD:
        return {
          subject: "Reset your TalkUp password",
          heading: "Password reset request",
        };
      case OtpPurpose.NEW_DEVICE:
        return {
          subject: "Verify your new device",
          heading: "New device verification",
        };
      default:
        return {
          subject: "TalkUp verification code",
          heading: "Verification required",
        };
    }
  }
}
