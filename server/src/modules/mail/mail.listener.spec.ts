import { Logger } from "@nestjs/common";

import { OtpPurpose } from "@common/enums/OtpPurpose";

import { OtpGeneratedEvent } from "@src/modules/auth/events/otp-generated.event";
import { OrganizationInviteCreatedEvent } from "@src/modules/organization/events/organization-invite-created.event";

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
        subject: "123456 is your TalkUp verification code",
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
        subject: "123456 is your TalkUp password reset code",
      }),
    );
  });

  it("uses NEW_DEVICE template", async () => {
    await listener.onOtpGenerated(payload(OtpPurpose.NEW_DEVICE));
    expect(mailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "123456 is your TalkUp device verification code",
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
        subject: "123456 is your TalkUp verification code",
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

  it("REGISTER email carries the anti-phishing note and sign-off in html and text", async () => {
    await listener.onOtpGenerated(payload(OtpPurpose.REGISTER));
    const call = mailService.sendMail.mock.calls[0][0];
    // Lead clause emphasised; full sentence present in the plaintext part.
    expect(call.html).toContain("<strong");
    expect(call.html).toContain("Do NOT share this code");
    expect(call.html).toContain("could be a scam");
    expect(call.html).toContain("The TalkUp Team");
    expect(call.text).toContain("Do NOT share this code");
    expect(call.text).toContain("The TalkUp Team");
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

  describe("organization admin signup mail", () => {
    const adminPayload = (
      overrides: Partial<OtpGeneratedEvent> = {},
    ): OtpGeneratedEvent => ({
      email: "boss@acme.com",
      plainOtp: "654321",
      purpose: OtpPurpose.REGISTER,
      registrationChannel: "organization",
      organizationName: "Acme Inc",
      adminUsername: "Acme Inc_admin",
      verifyUrl: "https://talkup.example/verify-email?email=boss%40acme.com",
      ...overrides,
    });

    it("sends the admin welcome mail (not the invite mail) when adminUsername is set", async () => {
      await listener.onOtpGenerated(adminPayload());

      expect(mailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "boss@acme.com",
          subject: "Acme Inc is ready on TalkUp — verify your admin email",
        }),
      );
      // Must not be the member-invite subject.
      expect(mailService.sendMail).not.toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "Your TalkUp account — invited by Acme Inc",
        }),
      );
    });

    it("carries the org name, admin username, code, and next steps", async () => {
      await listener.onOtpGenerated(adminPayload());
      const call = mailService.sendMail.mock.calls[0][0];
      expect(call.html).toContain("max-width:600px"); // branded shell
      expect(call.html).toContain("Acme Inc");
      expect(call.html).toContain("Acme Inc_admin");
      expect(call.html).toContain("654321");
      expect(call.html).toContain("Next steps");
      expect(call.html).toContain(
        "https://talkup.example/verify-email?email=boss%40acme.com",
      );
      expect(call.text).toContain("654321");
      expect(call.text).toContain("Acme Inc_admin");
    });

    it("escapes a malicious admin username", async () => {
      await listener.onOtpGenerated(
        adminPayload({ adminUsername: "<script>x</script>_admin" }),
      );
      const call = mailService.sendMail.mock.calls[0][0];
      expect(call.html).not.toContain("<script>x</script>");
      expect(call.html).toContain("&lt;script&gt;");
    });

    it("falls back to next-steps copy when verifyUrl is missing", async () => {
      await listener.onOtpGenerated(adminPayload({ verifyUrl: undefined }));
      const call = mailService.sendMail.mock.calls[0][0];
      expect(call.html).toContain("Next steps");
      expect(call.html).toContain("654321");
    });

    it("logs an org-admin-specific error when the admin mail fails", async () => {
      mailService.sendMail.mockRejectedValueOnce(new Error("smtp down"));
      await listener.onOtpGenerated(adminPayload());
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to dispatch org admin signup email"),
        expect.any(String),
      );
    });
  });

  describe("onOrganizationInviteCreated", () => {
    const invitePayload = (
      overrides: Partial<OrganizationInviteCreatedEvent> = {},
    ): OrganizationInviteCreatedEvent => ({
      email: "candidate@example.com",
      code: "ABCDEFGH2345",
      organizationName: "Acme Inc",
      role: "user",
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      registerUrl: "https://talkup.example/register?code=ABCDEFGH2345",
      ...overrides,
    });

    it("sends the invite mail with the org name and code when registerUrl is set", async () => {
      await listener.onOrganizationInviteCreated(invitePayload());

      expect(mailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "candidate@example.com",
          subject: "You're invited to join Acme Inc on TalkUp",
          html: expect.stringContaining("Acme Inc"),
        }),
      );
      const call = mailService.sendMail.mock.calls[0][0];
      expect(call.html).toContain("ABCDEFGH2345");
      expect(call.html).toContain(
        "https://talkup.example/register?code=ABCDEFGH2345",
      );
      expect(call.text).toContain("ABCDEFGH2345");
    });

    it("still sends without a CTA when registerUrl is undefined", async () => {
      await listener.onOrganizationInviteCreated(
        invitePayload({ registerUrl: undefined }),
      );

      expect(mailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "candidate@example.com",
          subject: "You're invited to join Acme Inc on TalkUp",
        }),
      );
      const call = mailService.sendMail.mock.calls[0][0];
      expect(call.html).toContain("ABCDEFGH2345");
      expect(call.html).toContain("Acme Inc");
    });

    it("swallows a sendMail rejection and logs the error", async () => {
      mailService.sendMail.mockRejectedValueOnce(new Error("smtp down"));

      await expect(
        listener.onOrganizationInviteCreated(invitePayload()),
      ).resolves.toBeUndefined();

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to dispatch invite email"),
        expect.any(String),
      );
    });
  });
});
