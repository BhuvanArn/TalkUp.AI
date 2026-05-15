import { Logger } from "@nestjs/common";

import { UserStatus } from "@common/enums/UserStatus";

import { AuthCronService } from "./auth.cron";

describe("AuthCronService", () => {
  let service: AuthCronService;
  let userRepo: { delete: jest.Mock };
  let otpRepo: { delete: jest.Mock };
  let revokedRepo: { delete: jest.Mock };

  beforeEach(() => {
    userRepo = { delete: jest.fn().mockResolvedValue({ affected: 2 }) };
    otpRepo = { delete: jest.fn().mockResolvedValue({ affected: 3 }) };
    revokedRepo = { delete: jest.fn().mockResolvedValue({ affected: 1 }) };
    service = new AuthCronService(
      userRepo as any,
      otpRepo as any,
      revokedRepo as any,
    );
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("cleanupStaleAuthData deletes stale users, expired otps, and expired blacklist entries", async () => {
    await service.cleanupStaleAuthData();

    expect(userRepo.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        status: UserStatus.PENDING,
      }),
    );
    expect(otpRepo.delete).toHaveBeenCalled();
    expect(revokedRepo.delete).toHaveBeenCalled();
    expect(Logger.prototype.log).toHaveBeenCalled();
  });

  it("logs 0 affected when delete omits affected count", async () => {
    userRepo.delete.mockResolvedValueOnce({ affected: undefined });
    otpRepo.delete.mockResolvedValueOnce({ affected: undefined });
    revokedRepo.delete.mockResolvedValueOnce({ affected: undefined });
    await service.cleanupStaleAuthData();
    expect(Logger.prototype.log).toHaveBeenCalledWith(
      expect.stringContaining("deleted 0 stale pending users"),
    );
  });

  it("propagates errors from delete", async () => {
    const boom = new Error("db");
    userRepo.delete.mockRejectedValueOnce(boom);
    await expect(service.cleanupStaleAuthData()).rejects.toThrow(boom);
    expect(Logger.prototype.error).toHaveBeenCalled();
  });
});

describe("AuthCronService when REDIS_URL is set", () => {
  const origRedis = process.env.REDIS_URL;

  beforeEach(() => {
    process.env.REDIS_URL = "redis://127.0.0.1:6379";
    jest.resetModules();
  });

  afterEach(() => {
    if (origRedis === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = origRedis;
    }
    jest.resetModules();
  });

  it("skips Postgres revoked delete and logs Redis TTL message", async () => {
    const { AuthCronService } = await import("./auth.cron");
    const userRepo = { delete: jest.fn().mockResolvedValue({ affected: 0 }) };
    const otpRepo = { delete: jest.fn().mockResolvedValue({ affected: 0 }) };
    const revokedRepo = { delete: jest.fn() };
    const service = new AuthCronService(
      userRepo as never,
      otpRepo as never,
      revokedRepo as never,
    );
    const logSpy = jest.spyOn(
      (service as unknown as { logger: Logger }).logger,
      "log",
    );

    await service.cleanupStaleAuthData();

    expect(revokedRepo.delete).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("blacklist managed by Redis TTL"),
    );
  });
});
