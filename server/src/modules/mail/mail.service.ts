import { existsSync } from "fs";
import { join } from "path";

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";

import { LOGO_CID } from "./templates/email-layout";

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logoPath = join(__dirname, "assets", "talkup-logo.png");

  constructor(private readonly configService: ConfigService) {
    let options = {};
    let service = this.configService.get<string>("SMTP_SERVICE");

    if (service) {
      options = {
        service,
        auth: {
          user: this.configService.get<string>("SMTP_USER"),
          pass: this.configService.get<string>("SMTP_PASS"),
        },
        family: 4, // Use IPv4 to avoid issues with IPv6 (ENETUNREACH errors)
      };
    } else {
      options = {
        host: this.configService.get<string>("SMTP_HOST"),
        port: parseInt(
          this.configService.get<string>("SMTP_PORT") ?? "587",
          10,
        ),
        secure: this.configService.get<string>("SMTP_SECURE") === "true",
        auth: {
          user: this.configService.get<string>("SMTP_USER"),
          pass: this.configService.get<string>("SMTP_PASS"),
        },
        family: 4, // Use IPv4 to avoid issues with IPv6 (ENETUNREACH errors)
      };
    }

    this.transporter = nodemailer.createTransport(options);
  }

  private getLogoAttachment(): Mail.Attachment | undefined {
    if (!existsSync(this.logoPath)) {
      return undefined;
    }
    return {
      filename: "talkup-logo.png",
      path: this.logoPath,
      cid: LOGO_CID,
    };
  }

  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    attachments?: Mail.Attachment[];
  }): Promise<void> {
    const from =
      this.configService.get<string>("SMTP_FROM") ??
      this.configService.get<string>("SMTP_USER");

    let attachments = options.attachments;
    // Only auto-attach the inline logo when the HTML actually references it,
    // so a caller sending non-branded HTML doesn't get an orphan attachment
    // (some clients surface an "attachment" badge for unreferenced parts).
    if (!attachments && options.html.includes(`cid:${LOGO_CID}`)) {
      const logo = this.getLogoAttachment();
      if (logo) {
        attachments = [logo];
      }
    }

    await this.transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      ...(attachments ? { attachments } : {}),
    });
  }
}
