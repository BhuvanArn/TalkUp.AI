import { UnauthorizedException } from "@nestjs/common";

import { ResetTokenGuard } from "./resetToken.guard";

describe("ResetTokenGuard (unit)", () => {
  let guard: ResetTokenGuard;
  let mockJwtService: { verifyAsync: jest.Mock };
  let mockUserRepo: { findOne: jest.Mock };

  const makeContext = (req: Record<string, unknown>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    }) as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJwtService = { verifyAsync: jest.fn() };
    mockUserRepo = { findOne: jest.fn() };
    guard = new ResetTokenGuard(mockJwtService as any, mockUserRepo as any);
  });

  it("throws when reset token cookie is missing", async () => {
    await expect(guard.canActivate(makeContext({}))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("throws when reset token is not a string", async () => {
    await expect(
      guard.canActivate(makeContext({ cookies: { resetToken: 123 } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("throws when jwt verify fails", async () => {
    mockJwtService.verifyAsync.mockRejectedValueOnce(new Error("bad token"));
    await expect(
      guard.canActivate(makeContext({ cookies: { resetToken: "token" } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("throws when purpose is not PASSWORD_RESET_AUTHORIZED", async () => {
    mockJwtService.verifyAsync.mockResolvedValueOnce({
      purpose: "OTHER",
      sub: "u1",
      tv: 1,
    });
    mockUserRepo.findOne.mockResolvedValueOnce({
      user_id: "u1",
      tokenVersion: 1,
    });
    await expect(
      guard.canActivate(makeContext({ cookies: { resetToken: "token" } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("throws when userId cannot be resolved from payload", async () => {
    mockJwtService.verifyAsync.mockResolvedValueOnce({
      purpose: "PASSWORD_RESET_AUTHORIZED",
      tv: 1,
    });
    await expect(
      guard.canActivate(makeContext({ cookies: { resetToken: "token" } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("resolves userId from sub", async () => {
    const req: Record<string, unknown> = {
      cookies: { resetToken: "token" },
    };
    mockJwtService.verifyAsync.mockResolvedValueOnce({
      purpose: "PASSWORD_RESET_AUTHORIZED",
      sub: "u1",
      tv: 1,
    });
    mockUserRepo.findOne.mockResolvedValueOnce({
      user_id: "u1",
      tokenVersion: 1,
    });

    const ok = await guard.canActivate(makeContext(req));
    expect(ok).toBe(true);
    expect(req.userId).toBe("u1");
  });

  it("resolves userId from userId field when sub missing", async () => {
    const req: Record<string, unknown> = {
      cookies: { resetToken: "token" },
    };
    mockJwtService.verifyAsync.mockResolvedValueOnce({
      purpose: "PASSWORD_RESET_AUTHORIZED",
      userId: "u2",
      tv: 1,
    });
    mockUserRepo.findOne.mockResolvedValueOnce({
      user_id: "u2",
      tokenVersion: 1,
    });

    await guard.canActivate(makeContext(req));
    expect(req.userId).toBe("u2");
  });

  it("accepts tv as string", async () => {
    const req: Record<string, unknown> = {
      cookies: { resetToken: "token" },
    };
    mockJwtService.verifyAsync.mockResolvedValueOnce({
      purpose: "PASSWORD_RESET_AUTHORIZED",
      sub: "u1",
      tv: "1",
    });
    mockUserRepo.findOne.mockResolvedValueOnce({
      user_id: "u1",
      tokenVersion: 1,
    });

    await guard.canActivate(makeContext(req));
    expect(req.userId).toBe("u1");
  });

  it("throws when tokenVersion is NaN", async () => {
    mockJwtService.verifyAsync.mockResolvedValueOnce({
      purpose: "PASSWORD_RESET_AUTHORIZED",
      sub: "u1",
      tv: "x",
    });
    await expect(
      guard.canActivate(makeContext({ cookies: { resetToken: "token" } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("throws when user not found", async () => {
    mockJwtService.verifyAsync.mockResolvedValueOnce({
      purpose: "PASSWORD_RESET_AUTHORIZED",
      sub: "u1",
      tv: 1,
    });
    mockUserRepo.findOne.mockResolvedValueOnce(null);
    await expect(
      guard.canActivate(makeContext({ cookies: { resetToken: "token" } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("throws when token version mismatches", async () => {
    mockJwtService.verifyAsync.mockResolvedValueOnce({
      purpose: "PASSWORD_RESET_AUTHORIZED",
      sub: "u1",
      tv: 2,
    });
    mockUserRepo.findOne.mockResolvedValueOnce({
      user_id: "u1",
      tokenVersion: 1,
    });
    await expect(
      guard.canActivate(makeContext({ cookies: { resetToken: "token" } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("uses tokenVersion 1 when user has undefined tokenVersion", async () => {
    const req: Record<string, unknown> = {
      cookies: { resetToken: "token" },
    };
    mockJwtService.verifyAsync.mockResolvedValueOnce({
      purpose: "PASSWORD_RESET_AUTHORIZED",
      sub: "u1",
      tv: 1,
    });
    mockUserRepo.findOne.mockResolvedValueOnce({
      user_id: "u1",
      tokenVersion: undefined,
    });

    await guard.canActivate(makeContext(req));
    expect(req.userId).toBe("u1");
  });
});
