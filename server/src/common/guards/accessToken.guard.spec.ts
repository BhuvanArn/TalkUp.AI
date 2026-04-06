import { UnauthorizedException } from "@nestjs/common";

import { AccessTokenGuard } from "./accessToken.guard";

import { ACCESS_COOKIE_NAME } from "@common/constants/auth.constants";

describe("AccessTokenGuard (unit)", () => {
  let guard: any;
  let mockJwtService: any;
  let mockUserRepo: any;

  const makeCookies = (token?: unknown) =>
    token !== undefined ? { [ACCESS_COOKIE_NAME]: token } : {};

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

  it("throws when cookie missing", async () => {
    await expect(guard.canActivate(makeContext({}))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("throws when cookie malformed", async () => {
    await expect(
      guard.canActivate(makeContext({}, { cookies: makeCookies(123) })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("throws when jwt verify fails", async () => {
    mockJwtService.verifyAsync.mockRejectedValueOnce(
      new UnauthorizedException(),
    );
    await expect(
      guard.canActivate(
        makeContext({}, { cookies: makeCookies("token") }),
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("returns true and sets req.userId and req.user when ok", async () => {
    const mockUser = { user_id: "u1", username: "test" };
    const reqObj: any = {
      cookies: makeCookies("token"),
      userId: null,
      user: undefined,
    };

    const localJwt = {
      verifyAsync: jest
        .fn()
        .mockResolvedValue({ userId: "u1", tv: 1, purpose: "ACCESS" }),
    };
    const localUserRepo = {
      findOne: jest.fn().mockResolvedValue(mockUser),
    };

    const localGuard = new AccessTokenGuard(
      localJwt as any,
      localUserRepo as any,
    );

    const ctx = { switchToHttp: () => ({ getRequest: () => reqObj }) };

    const res = await localGuard.canActivate(ctx as any);

    expect(res).toBe(true);
    expect(reqObj.userId).toBe("u1");
    expect(reqObj.user).toEqual(mockUser);
  });

  it("throws when token version mismatches", async () => {
    mockJwtService.verifyAsync.mockResolvedValueOnce({ userId: "u1", tv: 2 });
    mockUserRepo.findOne.mockResolvedValueOnce({
      user_id: "u1",
      tokenVersion: 1,
    });

    await expect(
      guard.canActivate(
        makeContext({}, { cookies: makeCookies("token") }),
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("resolves userId from sub when userId missing", async () => {
    const reqObj: any = { cookies: makeCookies("token") };
    mockJwtService.verifyAsync.mockResolvedValueOnce({
      sub: "u-sub",
      tv: 1,
    });
    mockUserRepo.findOne.mockResolvedValueOnce({
      user_id: "u-sub",
      tokenVersion: 1,
    });

    const res = await guard.canActivate({
      switchToHttp: () => ({ getRequest: () => reqObj }),
    } as any);

    expect(res).toBe(true);
    expect(reqObj.userId).toBe("u-sub");
  });

  it("accepts tv as numeric string", async () => {
    const reqObj: any = { cookies: makeCookies("token") };
    mockJwtService.verifyAsync.mockResolvedValueOnce({
      userId: "u1",
      tv: "2",
    });
    mockUserRepo.findOne.mockResolvedValueOnce({
      user_id: "u1",
      tokenVersion: 2,
    });

    await guard.canActivate({
      switchToHttp: () => ({ getRequest: () => reqObj }),
    } as any);

    expect(reqObj.userId).toBe("u1");
  });

  it("throws when userId cannot be resolved", async () => {
    mockJwtService.verifyAsync.mockResolvedValueOnce({ tv: 1 });
    await expect(
      guard.canActivate(
        makeContext({}, { cookies: makeCookies("token") }),
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("throws when tv is NaN", async () => {
    mockJwtService.verifyAsync.mockResolvedValueOnce({
      userId: "u1",
      tv: "bad",
    });
    await expect(
      guard.canActivate(
        makeContext({}, { cookies: makeCookies("token") }),
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("throws when user not found", async () => {
    mockJwtService.verifyAsync.mockResolvedValueOnce({ userId: "u1", tv: 1 });
    mockUserRepo.findOne.mockResolvedValueOnce(null);
    await expect(
      guard.canActivate(
        makeContext({}, { cookies: makeCookies("token") }),
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("uses tokenVersion 1 when user has undefined tokenVersion", async () => {
    const reqObj: any = { cookies: makeCookies("token") };
    mockJwtService.verifyAsync.mockResolvedValueOnce({ userId: "u1", tv: 1 });
    mockUserRepo.findOne.mockResolvedValueOnce({
      user_id: "u1",
      tokenVersion: undefined,
    });

    await guard.canActivate({
      switchToHttp: () => ({ getRequest: () => reqObj }),
    } as any);

    expect(reqObj.userId).toBe("u1");
  });
});
