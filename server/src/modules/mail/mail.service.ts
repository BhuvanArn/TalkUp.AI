import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

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

  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    const from =
      this.configService.get<string>("SMTP_FROM") ??
      this.configService.get<string>("SMTP_USER");

    await this.transporter.sendMail({
      from,
      ...options,
    });
  }
}
