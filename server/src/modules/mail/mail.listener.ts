import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { OtpPurpose } from "@common/enums/OtpPurpose";

import { OtpGeneratedEvent } from "@src/modules/auth/events/otp-generated.event";
import { MailService } from "./mail.service";
import { escapeHtml, renderOtpEmail } from "./templates/email-layout";

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

    // Scheme guard: only http(s) links are rendered. A misconfigured FRONTEND_URL
    // (e.g. "javascript:"/"data:") must not become a clickable link. When the URL
    // is absent or non-http, fall back to the website copy.
    const safeVerifyUrl =
      payload.verifyUrl && /^https?:\/\//i.test(payload.verifyUrl)
        ? payload.verifyUrl
        : undefined;

    const ctaBlock = safeVerifyUrl
      ? {
          html: `<a href="${escapeHtml(
            safeVerifyUrl,
          )}" style="display:inline-block;padding:12px 24px;background:#2b70c9;color:#ffffff;border-radius:8px;font-family:'Saira','Segoe UI',Arial,sans-serif;font-size:14px;font-weight:700;line-height:1;text-decoration:none;">Verify your account</a><p style="margin:12px 0 0;font-family:'Inter','Segoe UI',Arial,sans-serif;font-size:12px;font-weight:400;line-height:1.5;color:#57585e;">Or copy this link: ${escapeHtml(
            safeVerifyUrl,
          )}</p>`,
          text: `Verify your account: ${safeVerifyUrl}`,
        }
      : {
          html: `<p style="margin:0;font-family:'Inter','Segoe UI',Arial,sans-serif;font-size:15px;font-weight:400;line-height:1.6;color:#5f5f77;">Verify your email using the TalkUp sign-in flow on the website.</p>`,
          text: "Use the TalkUp website to verify your email.",
        };

    const subject = `Your TalkUp account — invited by ${orgName}`;

    // preHeading is escaped by renderOtpEmail, so pass the RAW org name here.
    // ctaBlock.html is injected raw, so verifyUrl is escaped at the call site above.
    const { html, text } = renderOtpEmail({
      heading: "Confirm your email",
      preHeading: `The organization ${orgName} has created an account for you on TalkUp. If this is unexpected, you can ignore this email.`,
      intro:
        "Otherwise, verify your account and use the code below to get started:",
      code: payload.plainOtp,
      expiryMinutes: OTP_EXPIRY_MINUTES,
      ctaBlock,
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
