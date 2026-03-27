import { UnauthorizedException } from "@nestjs/common";

import { AccessTokenGuard } from "./accessToken.guard";

describe("AccessTokenGuard (unit)", () => {
  let guard: any;
  let mockJwtService: any;
  let mockUserRepo: any;

  const makeContext = (headers: any, reqObj = {}) => ({
    switchToHttp: () => ({
      getRequest: () => ({ headers, ...reqObj }),
    }),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockJwtService = { verifyAsync: jest.fn() };
    mockUserRepo = { findOne: jest.fn() };

    guard = new AccessTokenGuard(mockJwtService, mockUserRepo);
  });

  it("throws when header missing", async () => {
    guard = new AccessTokenGuard(mockJwtService, mockUserRepo);
    await expect(guard.canActivate(makeContext({}))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("throws when header malformed", async () => {
    guard = new AccessTokenGuard(mockJwtService, mockUserRepo);
    await expect(
      guard.canActivate(makeContext({}, { cookies: { accessToken: 123 } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("throws when jwt verify fails", async () => {
    mockJwtService.verifyAsync.mockRejectedValueOnce(
      new UnauthorizedException(),
    );
    guard = new AccessTokenGuard(mockJwtService, mockUserRepo);
    await expect(
      guard.canActivate(makeContext({}, { cookies: { accessToken: "token" } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("returns true and sets req.userId when ok", async () => {
    const reqObj: any = { cookies: { accessToken: "token" }, userId: null };

    const localJwt = {
      verifyAsync: jest
        .fn()
        .mockResolvedValue({ userId: "u1", tv: 1, purpose: "ACCESS" }),
    };
    const localUserRepo = {
      findOne: jest.fn().mockResolvedValue({ user_id: "u1", tokenVersion: 1 }),
    };

    const localGuard = new AccessTokenGuard(
      localJwt as any,
      localUserRepo as any,
    );

    const ctx = { switchToHttp: () => ({ getRequest: () => reqObj }) };

    const res = await localGuard.canActivate(ctx as any);

    expect(res).toBe(true);
    expect(reqObj.userId).toBe("u1");
  });

  it("throws when token version mismatches", async () => {
    mockJwtService.verifyAsync.mockResolvedValueOnce({ userId: "u1", tv: 2 });
    mockUserRepo.findOne.mockResolvedValueOnce({
      user_id: "u1",
      tokenVersion: 1,
    });

    await expect(
      guard.canActivate(makeContext({}, { cookies: { accessToken: "token" } })),
    ).rejects.toThrow(UnauthorizedException);
  });
});
