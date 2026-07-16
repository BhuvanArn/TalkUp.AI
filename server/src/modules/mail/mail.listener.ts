import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { OtpPurpose } from "@common/enums/OtpPurpose";

import { OtpGeneratedEvent } from "@src/modules/auth/events/otp-generated.event";
import { OrganizationInviteCreatedEvent } from "@src/modules/organization/events/organization-invite-created.event";
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

  @OnEvent("organization.invite_created", { async: true })
  async onOrganizationInviteCreated(payload: OrganizationInviteCreatedEvent) {
    const subject = `You're invited to join ${payload.organizationName} on TalkUp`;

    const { html, text } = renderOtpEmail({
      heading: `Join ${payload.organizationName}`,
      preHeading: `${payload.organizationName} invited you to TalkUp as ${payload.role}. If this is unexpected, you can ignore this email.`,
      intro: "Use this organization code when creating your account:",
      code: payload.code,
      cta: payload.registerUrl
        ? {
            href: payload.registerUrl,
            label: "Create your account",
            helperText: `Or copy this link: ${payload.registerUrl}`,
          }
        : undefined,
      note: "Enter the code in the Organization code field of the TalkUp register page.",
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
        `Failed to dispatch invite email to ${payload.email}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async sendOtpMail(payload: OtpGeneratedEvent) {
    if (
      payload.purpose === OtpPurpose.REGISTER &&
      payload?.registrationChannel === "organization" &&
      payload?.organizationName
    ) {
      // The self-serve org admin (F12) carries a username; invited members do
      // not. The admin gets a welcome email spelling out what was created and
      // the next steps; members get the "you've been invited" email.
      if (payload.adminUsername) {
        await this.sendOrganizationAdminSignupMail(payload);
      } else {
        await this.sendOrganizationInviteRegisterMail(payload);
      }
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

  /**
   * F12: welcome email for the person who self-serves a new organization and
   * becomes its admin. Unlike the member-invite email, this states what was
   * created (the org + their admin account), names the admin username, gives
   * the verification code, and lays out the next steps to manage the org.
   */
  private async sendOrganizationAdminSignupMail(payload: OtpGeneratedEvent) {
    const orgName = payload.organizationName ?? "";
    const adminUsername = payload.adminUsername ?? "";
    const subject = `${orgName} is ready on TalkUp — verify your admin email`;

    // The renderer owns all HTML/escaping and scheme-guards the CTA href to
    // http(s); we pass only raw data strings — never markup. The `note` renders
    // only when there is no valid CTA, so the next-steps also live in `intro`
    // (always rendered) to stay visible whether or not the verify link is set.
    const nextSteps = `Next steps: 1) Enter the code above on the TalkUp verify-email page to confirm ${payload.email}. 2) Sign in as ${adminUsername} to manage ${orgName} — invite members, manage roles, and review activity.`;

    const { html, text } = renderOtpEmail({
      heading: "Your organization is ready",
      preHeading: `Your organization ${orgName} has been created on TalkUp, along with its administrator account (username: ${adminUsername}). If you did not do this, you can ignore this email.`,
      intro: `Verify this admin email address with the code below to finish setting up. ${nextSteps}`,
      code: payload.plainOtp,
      expiryMinutes: OTP_EXPIRY_MINUTES,
      cta: payload.verifyUrl
        ? {
            href: payload.verifyUrl,
            label: "Verify admin email & continue",
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
        `Failed to dispatch org admin signup email to ${payload.email}`,
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
