import { Logger } from "@nestjs/common";

import { OtpPurpose } from "@common/enums/OtpPurpose";

import { OtpGeneratedEvent } from "@src/modules/auth/events/otp-generated.event";

import { MailListener } from "./mail.listener";
import { MailService } from "./mail.service";

describe("MailListener", () => {
  let listener: MailListener;
  let mailService: { sendMail: jest.Mock };

  beforeEach(() => {
    mailService = { sendMail: jest.fn().mockResolvedValue(undefined) };
    listener = new MailListener(mailService as unknown as MailService);
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const payload = (purpose: OtpPurpose): OtpGeneratedEvent => ({
    email: "u@example.com",
    plainOtp: "123456",
    purpose,
  });

  it("onOtpGenerated sends mail for REGISTER", async () => {
    await listener.onOtpGenerated(payload(OtpPurpose.REGISTER));
    expect(mailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "u@example.com",
        subject: "Verify your TalkUp account",
      }),
    );
  });

  it("onPasswordResetRequested sends mail for RESET_PASSWORD", async () => {
    await listener.onPasswordResetRequested(payload(OtpPurpose.RESET_PASSWORD));
    expect(mailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Reset your TalkUp password",
      }),
    );
  });

  it("uses NEW_DEVICE template", async () => {
    await listener.onOtpGenerated(payload(OtpPurpose.NEW_DEVICE));
    expect(mailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Verify your new device",
      }),
    );
  });

  it("uses default template for unknown purpose", async () => {
    await listener.onOtpGenerated({
      email: "u@example.com",
      plainOtp: "123456",
      purpose: "OTHER" as OtpPurpose,
    });
    expect(mailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "TalkUp verification code",
      }),
    );
  });

  it("logs error when sendMail fails", async () => {
    const err = new Error("smtp down");
    mailService.sendMail.mockRejectedValueOnce(err);
    await listener.onOtpGenerated(payload(OtpPurpose.REGISTER));
    expect(Logger.prototype.error).toHaveBeenCalled();
  });

  it("logs non-Error rejections without stack", async () => {
    mailService.sendMail.mockRejectedValueOnce("string failure");
    await listener.onOtpGenerated(payload(OtpPurpose.REGISTER));
    expect(Logger.prototype.error).toHaveBeenCalled();
  });
});
