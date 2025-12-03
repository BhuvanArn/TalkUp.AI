import { UnauthorizedException } from "@nestjs/common";

import { AccessTokenGuard } from "./accessToken.guard";

describe("AccessTokenGuard (unit)", () => {
  let guard: any;
  let mockAuthService: any;

  const makeContext = (headers: any, reqObj = {}) => ({
    switchToHttp: () => ({
      getRequest: () => ({ headers, ...reqObj }),
    }),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService = { verifyAccessToken: jest.fn() };

    guard = new AccessTokenGuard(mockAuthService);
  });

  it("throws when header missing", async () => {
    guard = new AccessTokenGuard(mockAuthService);
    await expect(guard.canActivate(makeContext({}))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("throws when header malformed", async () => {
    guard = new AccessTokenGuard(mockAuthService);
    await expect(
      guard.canActivate(makeContext({}, { cookies: { accessToken: 123 } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("throws when jwt verify fails", async () => {
    mockAuthService.verifyAccessToken.mockRejectedValueOnce(
      new UnauthorizedException(),
    );
    guard = new AccessTokenGuard(mockAuthService);
    await expect(
      guard.canActivate(makeContext({}, { cookies: { accessToken: "token" } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("returns true and sets req.userId when ok", async () => {
    const reqObj: any = { cookies: { accessToken: "token" }, userId: null };

    const localAuth = {
      verifyAccessToken: jest.fn().mockResolvedValue({ user_id: "u1" }),
    };

    const localGuard = new AccessTokenGuard(localAuth as any);

    const ctx = { switchToHttp: () => ({ getRequest: () => reqObj }) };

    const res = await localGuard.canActivate(ctx as any);

    expect(res).toBe(true);
    expect(reqObj.userId).toBe("u1");
  });
});
