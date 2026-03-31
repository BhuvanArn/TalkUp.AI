import { Logger } from "@nestjs/common";

import { UserStatus } from "@common/enums/UserStatus";

import { AuthCronService } from "./auth.cron";

describe("AuthCronService", () => {
  let service: AuthCronService;
  let userRepo: { delete: jest.Mock };
  let otpRepo: { delete: jest.Mock };

  beforeEach(() => {
    userRepo = { delete: jest.fn().mockResolvedValue({ affected: 2 }) };
    otpRepo = { delete: jest.fn().mockResolvedValue({ affected: 3 }) };
    service = new AuthCronService(userRepo as any, otpRepo as any);
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("cleanupStaleAuthData deletes stale users and expired otps", async () => {
    await service.cleanupStaleAuthData();

    expect(userRepo.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        status: UserStatus.PENDING,
      }),
    );
    expect(otpRepo.delete).toHaveBeenCalled();
    expect(Logger.prototype.log).toHaveBeenCalled();
  });

  it("logs 0 affected when delete omits affected count", async () => {
    userRepo.delete.mockResolvedValueOnce({ affected: undefined });
    otpRepo.delete.mockResolvedValueOnce({ affected: undefined });
    await service.cleanupStaleAuthData();
    expect(Logger.prototype.log).toHaveBeenCalledWith(
      expect.stringContaining(
        "deleted 0 stale pending users and 0 expired OTP",
      ),
    );
  });

  it("propagates errors from delete", async () => {
    const boom = new Error("db");
    userRepo.delete.mockRejectedValueOnce(boom);
    await expect(service.cleanupStaleAuthData()).rejects.toThrow(boom);
    expect(Logger.prototype.error).toHaveBeenCalled();
  });
});
