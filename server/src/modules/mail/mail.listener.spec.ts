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

  it("onOtpGenerated sends organization invite mail when registrationChannel is organization", async () => {
    await listener.onOtpGenerated({
      email: "u@example.com",
      plainOtp: "123456",
      purpose: OtpPurpose.REGISTER,
      registrationChannel: "organization",
      organizationName: "Acme Inc",
      verifyUrl: "https://talkup.example/verify-email?email=u%40example.com",
    });
    expect(mailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "u@example.com",
        subject: "Your TalkUp account — invited by Acme Inc",
        html: expect.stringContaining("Acme Inc"),
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

  it("logs error when organization invite mail fails", async () => {
    mailService.sendMail.mockRejectedValueOnce(new Error("smtp down"));
    await listener.onOtpGenerated({
      email: "u@example.com",
      plainOtp: "123456",
      purpose: OtpPurpose.REGISTER,
      registrationChannel: "organization",
      organizationName: "Acme Inc",
    });
    expect(Logger.prototype.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to dispatch OTP email"),
      expect.any(String),
    );
  });

  it("REGISTER email html uses the branded shell with code and heading", async () => {
    await listener.onOtpGenerated(payload(OtpPurpose.REGISTER));
    expect(mailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("123456"),
        text: expect.stringContaining("123456"),
      }),
    );
    const call = mailService.sendMail.mock.calls[0][0];
    expect(call.html).toContain("max-width:600px"); // branded shell → forces render
    expect(call.html).toContain("Confirm your email");
    expect(call.html).toContain("expires in 15 minutes");
  });

  it("organization invite uses branded shell with verify link and org name", async () => {
    await listener.onOtpGenerated({
      email: "u@example.com",
      plainOtp: "123456",
      purpose: OtpPurpose.REGISTER,
      registrationChannel: "organization",
      organizationName: "Acme Inc",
      verifyUrl: "https://talkup.example/verify-email?email=u%40example.com",
    });
    const call = mailService.sendMail.mock.calls[0][0];
    expect(call.html).toContain("max-width:600px"); // branded shell → forces render
    expect(call.html).toContain("Acme Inc");
    expect(call.html).toContain(
      "https://talkup.example/verify-email?email=u%40example.com",
    );
    expect(call.html).toContain("123456");
  });

  it("drops a non-http verifyUrl and falls back to the website copy", async () => {
    await listener.onOtpGenerated({
      email: "u@example.com",
      plainOtp: "123456",
      purpose: OtpPurpose.REGISTER,
      registrationChannel: "organization",
      organizationName: "Acme Inc",
      verifyUrl: "javascript:alert(1)",
    });
    const call = mailService.sendMail.mock.calls[0][0];
    expect(call.html).not.toContain("javascript:");
    expect(call.html).toContain("TalkUp sign-in flow");
  });

  it("escapes a malicious organization name", async () => {
    await listener.onOtpGenerated({
      email: "u@example.com",
      plainOtp: "123456",
      purpose: OtpPurpose.REGISTER,
      registrationChannel: "organization",
      organizationName: "<script>x</script>",
      verifyUrl: "https://talkup.example/verify-email",
    });
    const call = mailService.sendMail.mock.calls[0][0];
    expect(call.html).not.toContain("<script>x</script>");
    expect(call.html).toContain("&lt;script&gt;");
  });

  it("escapes an http verifyUrl that carries markup inside the anchor href", async () => {
    // Passes the http(s) scheme guard but smuggles an attribute break; the
    // renderer escapes the href before it lands in the anchor, so it cannot
    // break out. Guards against a regression that drops that escaping.
    await listener.onOtpGenerated({
      email: "u@example.com",
      plainOtp: "123456",
      purpose: OtpPurpose.REGISTER,
      registrationChannel: "organization",
      organizationName: "Acme Inc",
      verifyUrl: 'https://evil.test/"><script>alert(1)</script>',
    });
    const call = mailService.sendMail.mock.calls[0][0];
    expect(call.html).not.toContain("<script>alert(1)</script>");
    expect(call.html).toContain("&lt;script&gt;");
    expect(call.html).toContain("&quot;&gt;");
  });
});
