import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { OtpPurpose } from "@common/enums/OtpPurpose";

import { OtpGeneratedEvent } from "@src/modules/auth/events/otp-generated.event";
import { MailService } from "./mail.service";

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
    const { subject, heading } = this.resolveTemplate(payload.purpose);

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1a1a1a;">
        <h2>${heading}</h2>
        <p>Your one-time verification code is:</p>
        <p style="font-size: 28px; letter-spacing: 4px; font-weight: 700;">${payload.plainOtp}</p>
        <p>This code expires in 15 minutes.</p>
      </div>
    `;

    try {
      await this.mailService.sendMail({
        to: payload.email,
        subject,
        text: `Your OTP code is ${payload.plainOtp}. It expires in 15 minutes.`,
        html,
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
