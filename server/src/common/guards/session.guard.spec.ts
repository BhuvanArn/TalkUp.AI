import { UnauthorizedException } from "@nestjs/common";

import { SessionGuard } from "./session.guard";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@common/constants/auth.constants";

describe("SessionGuard (unit)", () => {
  let guard: SessionGuard;
  let mockJwtService: any;
  let mockUserRepo: any;
  let mockTokenStorage: any;

  const makeContext = (reqObj: Record<string, unknown> = {}) => ({
    switchToHttp: () => ({
      getRequest: () => reqObj,
    }),
  });

  const mockUser = { user_id: "u1", tokenVersion: 1 };

  beforeEach(() => {
    jest.clearAllMocks();
    mockJwtService = { verifyAsync: jest.fn() };
    mockUserRepo = { findOne: jest.fn() };
    mockTokenStorage = {
      isJtiBlacklisted: jest.fn().mockResolvedValue(false),
    };
    guard = new SessionGuard(mockJwtService, mockUserRepo, mockTokenStorage);
  });

  it("authenticates via valid access token", async () => {
    const reqObj: any = {
      cookies: { [ACCESS_COOKIE_NAME]: "at-jwt" },
    };
    mockJwtService.verifyAsync.mockResolvedValueOnce({
      userId: "u1",
      tv: 1,
    });
    mockUserRepo.findOne.mockResolvedValueOnce(mockUser);

    const result = await guard.canActivate(makeContext(reqObj) as any);

    expect(result).toBe(true);
    expect(reqObj.userId).toBe("u1");
    expect(reqObj.user).toEqual(mockUser);
    expect(reqObj.refreshJti).toBeUndefined();
  });

  it("falls back to refresh token when AT is expired", async () => {
    const reqObj: any = {
      cookies: {
        [ACCESS_COOKIE_NAME]: "expired-at",
        [REFRESH_COOKIE_NAME]: "rt-jwt",
      },
    };
    mockJwtService.verifyAsync
      .mockRejectedValueOnce(new Error("expired"))
      .mockResolvedValueOnce({
        userId: "u1",
        tv: 1,
        typ: "refresh",
        jti: "rt-jti-1",
      });
    mockUserRepo.findOne.mockResolvedValueOnce(mockUser);

    const result = await guard.canActivate(makeContext(reqObj) as any);

    expect(result).toBe(true);
    expect(reqObj.userId).toBe("u1");
    expect(reqObj.refreshJti).toBe("rt-jti-1");
  });

  it("authenticates via RT when AT cookie is absent", async () => {
    const reqObj: any = {
      cookies: { [REFRESH_COOKIE_NAME]: "rt-jwt" },
    };
    mockJwtService.verifyAsync.mockResolvedValueOnce({
      userId: "u1",
      tv: 1,
      typ: "refresh",
      jti: "rt-jti-2",
    });
    mockUserRepo.findOne.mockResolvedValueOnce(mockUser);

    const result = await guard.canActivate(makeContext(reqObj) as any);

    expect(result).toBe(true);
    expect(reqObj.userId).toBe("u1");
  });

  it("throws when neither AT nor RT is valid", async () => {
    const reqObj: any = { cookies: {} };

    await expect(guard.canActivate(makeContext(reqObj) as any)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("rejects RT with wrong typ", async () => {
    const reqObj: any = {
      cookies: { [REFRESH_COOKIE_NAME]: "rt-jwt" },
    };
    mockJwtService.verifyAsync.mockResolvedValueOnce({
      userId: "u1",
      tv: 1,
      typ: "access",
      jti: "jti-1",
    });

    await expect(guard.canActivate(makeContext(reqObj) as any)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("rejects RT when jti is blacklisted", async () => {
    const reqObj: any = {
      cookies: { [REFRESH_COOKIE_NAME]: "rt-jwt" },
    };
    mockJwtService.verifyAsync.mockResolvedValueOnce({
      userId: "u1",
      tv: 1,
      typ: "refresh",
      jti: "revoked-jti",
    });
    mockTokenStorage.isJtiBlacklisted.mockResolvedValueOnce(true);

    await expect(guard.canActivate(makeContext(reqObj) as any)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("rejects RT when tokenVersion mismatches", async () => {
    const reqObj: any = {
      cookies: { [REFRESH_COOKIE_NAME]: "rt-jwt" },
    };
    mockJwtService.verifyAsync.mockResolvedValueOnce({
      userId: "u1",
      tv: 2,
      typ: "refresh",
      jti: "jti-1",
    });
    mockUserRepo.findOne.mockResolvedValueOnce({
      ...mockUser,
      tokenVersion: 1,
    });

    await expect(guard.canActivate(makeContext(reqObj) as any)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
