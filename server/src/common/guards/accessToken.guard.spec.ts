import {
  UnauthorizedException,
  InternalServerErrorException,
} from "@nestjs/common";

import { AccessTokenGuard } from "./accessToken.guard";

describe("AccessTokenGuard (unit)", () => {
  let guard: any;
  let mockJwt: any;
  let mockRepo: any;

  const makeContext = (headers: any, reqObj = {}) => ({
    switchToHttp: () => ({
      getRequest: () => ({ headers, ...reqObj }),
    }),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockJwt = { verifyAsync: jest.fn() };
    mockRepo = { findOne: jest.fn() };

    guard = new AccessTokenGuard(mockJwt, mockRepo);
  });

  it("throws when header missing", async () => {
    guard = new AccessTokenGuard(mockJwt, mockRepo);
    await expect(guard.canActivate(makeContext({}))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("throws when header malformed", async () => {
    guard = new AccessTokenGuard(mockJwt, mockRepo);
    await expect(
      guard.canActivate(makeContext({}, { cookies: { accessToken: 123 } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("throws when jwt verify fails", async () => {
    mockJwt.verifyAsync.mockRejectedValueOnce(new Error("nope"));
    guard = new AccessTokenGuard(mockJwt, mockRepo);
    await expect(
      guard.canActivate(makeContext({}, { cookies: { accessToken: "token" } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("throws when payload missing userId", async () => {
    mockJwt.verifyAsync.mockResolvedValueOnce({});
    guard = new AccessTokenGuard(mockJwt, mockRepo);
    await expect(
      guard.canActivate(makeContext({}, { cookies: { accessToken: "token" } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("throws InternalServerError when repo throws", async () => {
    mockJwt.verifyAsync.mockResolvedValueOnce({ userId: "u1" });
    mockRepo.findOne.mockRejectedValueOnce(new Error("repo error"));
    guard = new AccessTokenGuard(mockJwt, mockRepo);
    await expect(
      guard.canActivate(makeContext({}, { cookies: { accessToken: "token" } })),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it("throws when user not found", async () => {
    mockJwt.verifyAsync.mockResolvedValueOnce({ userId: "u1" });
    mockRepo.findOne.mockResolvedValueOnce(null);
    guard = new AccessTokenGuard(mockJwt, mockRepo);
    await expect(
      guard.canActivate(makeContext({}, { cookies: { accessToken: "token" } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("returns true and sets req.userId when ok", async () => {
    const reqObj: any = { cookies: { accessToken: "token" }, userId: null };

    const localJwt = {
      verifyAsync: jest.fn().mockResolvedValue({ userId: "u1" }),
    };
    const localRepo = {
      findOne: jest.fn().mockResolvedValue({ user_id: "u1" }),
    };

    const localGuard = new AccessTokenGuard(localJwt as any, localRepo as any);

    const ctx = { switchToHttp: () => ({ getRequest: () => reqObj }) };

    const res = await localGuard.canActivate(ctx as any);

    expect(res).toBe(true);
    expect(reqObj.userId).toBe("u1");
  });
});
