import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as nodemailer from "nodemailer";

import { MailService } from "./mail.service";

jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  existsSync: jest.fn().mockReturnValue(true),
}));

describe("MailService", () => {
  const mockedCreateTransport = nodemailer.createTransport as jest.Mock;
  let lastSendMail: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    lastSendMail = jest.fn().mockResolvedValue(undefined);
    mockedCreateTransport.mockReturnValue({ sendMail: lastSendMail });
  });

  it("builds transporter with SMTP_SERVICE when set", async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === "SMTP_SERVICE") return "gmail";
        if (key === "SMTP_USER") return "u";
        if (key === "SMTP_PASS") return "p";
        return undefined;
      }),
    } as unknown as ConfigService;

    const service = new MailService(config);

    expect(mockedCreateTransport).toHaveBeenCalledWith({
      service: "gmail",
      auth: { user: "u", pass: "p" },
      family: 4,
    });

    await service.sendMail({
      to: "a@b.com",
      subject: "s",
      html: "<p/>",
    });
    expect(lastSendMail).toHaveBeenCalled();
  });

  it("builds transporter with host/port when SMTP_SERVICE is unset", async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === "SMTP_SERVICE") return undefined;
        if (key === "SMTP_HOST") return "smtp.example.com";
        if (key === "SMTP_PORT") return "465";
        if (key === "SMTP_SECURE") return "true";
        if (key === "SMTP_USER") return "u";
        if (key === "SMTP_PASS") return "p";
        if (key === "SMTP_FROM") return "from@x.com";
        return undefined;
      }),
    } as unknown as ConfigService;

    const service = new MailService(config);

    expect(mockedCreateTransport).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 465,
      secure: true,
      auth: { user: "u", pass: "p" },
      family: 4,
    });

    await service.sendMail({
      to: "a@b.com",
      subject: "s",
      html: "<p/>",
      text: "t",
    });

    expect(lastSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "from@x.com",
        to: "a@b.com",
        subject: "s",
        html: "<p/>",
        text: "t",
      }),
    );
  });

  it("defaults SMTP_PORT to 587 and uses SMTP_USER as from when SMTP_FROM missing", async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === "SMTP_SERVICE") return undefined;
        if (key === "SMTP_HOST") return "h";
        if (key === "SMTP_PORT") return undefined;
        if (key === "SMTP_SECURE") return "false";
        if (key === "SMTP_USER") return "u@example.com";
        if (key === "SMTP_PASS") return "p";
        return undefined;
      }),
    } as unknown as ConfigService;

    const service = new MailService(config);

    expect(mockedCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 587,
        secure: false,
      }),
    );

    await service.sendMail({
      to: "a@b.com",
      subject: "s",
      html: "<p/>",
    });

    expect(lastSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "u@example.com",
      }),
    );
  });

  it("attaches the cid logo when file exists and html is sent", async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    const config = {
      get: jest.fn((key: string) => (key === "SMTP_SERVICE" ? "gmail" : "x")),
    } as unknown as ConfigService;

    const service = new MailService(config);
    await service.sendMail({ to: "a@b.com", subject: "s", html: "<p/>" });

    expect(lastSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: expect.arrayContaining([
          expect.objectContaining({ cid: "talkup-logo" }),
        ]),
      }),
    );
  });

  it("omits attachments when the logo file is missing", async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    const config = {
      get: jest.fn((key: string) => (key === "SMTP_SERVICE" ? "gmail" : "x")),
    } as unknown as ConfigService;

    const service = new MailService(config);
    await service.sendMail({ to: "a@b.com", subject: "s", html: "<p/>" });

    const call = lastSendMail.mock.calls[0][0];
    expect(call.attachments).toBeUndefined();
  });

  it("passes through explicit attachments unchanged", async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    const config = {
      get: jest.fn((key: string) => (key === "SMTP_SERVICE" ? "gmail" : "x")),
    } as unknown as ConfigService;

    const service = new MailService(config);
    const custom = [{ filename: "x.txt", content: "hi" }];
    await service.sendMail({
      to: "a@b.com",
      subject: "s",
      html: "<p/>",
      attachments: custom,
    });

    expect(lastSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ attachments: custom }),
    );
  });
});
