import { QueryFailedError } from "typeorm";

import { PostgresTokenStorage } from "./postgres-token-storage.service";

describe("PostgresTokenStorage", () => {
  let storage: PostgresTokenStorage;
  let mockRevokedRepo: any;
  let mockUserRepo: any;

  beforeEach(() => {
    mockRevokedRepo = {
      upsert: jest.fn().mockResolvedValue(undefined),
      insert: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn(),
    };
    mockUserRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      }),
    };
    storage = new PostgresTokenStorage(mockRevokedRepo, mockUserRepo);
  });

  describe("consumeRefreshJti", () => {
    it("returns true on first insert", async () => {
      mockRevokedRepo.insert.mockResolvedValueOnce(undefined);

      expect(await storage.consumeRefreshJti("jti-1", 3600)).toBe(true);
      expect(mockRevokedRepo.insert).toHaveBeenCalledWith(
        expect.objectContaining({ jti: "jti-1" }),
      );
    });

    it("returns false on unique violation (23505)", async () => {
      const err = new QueryFailedError("", [], {
        code: "23505",
      } as unknown as Error);
      mockRevokedRepo.insert.mockRejectedValueOnce(err);

      expect(await storage.consumeRefreshJti("jti-dup", 60)).toBe(false);
    });

    it("rethrows non-unique errors", async () => {
      mockRevokedRepo.insert.mockRejectedValueOnce(new Error("db down"));

      await expect(storage.consumeRefreshJti("jti-x", 60)).rejects.toThrow(
        "db down",
      );
    });
  });

  describe("blacklistToken", () => {
    it("upserts a revoked token row with computed expires_at", async () => {
      const before = Date.now();
      await storage.blacklistToken("jti-1", 3600);

      expect(mockRevokedRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ jti: "jti-1" }),
        ["jti"],
      );

      const call = mockRevokedRepo.upsert.mock.calls[0][0];
      const expiresAt = call.expires_at as Date;
      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + 3600 * 1000);
    });
  });

  describe("isJtiBlacklisted", () => {
    it("returns true when jti exists", async () => {
      mockRevokedRepo.findOne.mockResolvedValueOnce({ jti: "jti-1" });
      expect(await storage.isJtiBlacklisted("jti-1")).toBe(true);
    });

    it("returns false when jti not found", async () => {
      mockRevokedRepo.findOne.mockResolvedValueOnce(null);
      expect(await storage.isJtiBlacklisted("jti-2")).toBe(false);
    });
  });

  describe("getTokenVersion", () => {
    it("returns user tokenVersion", async () => {
      mockUserRepo.findOne.mockResolvedValueOnce({ tokenVersion: 5 });
      expect(await storage.getTokenVersion("u1")).toBe(5);
    });

    it("defaults to 1 when user not found", async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(null);
      expect(await storage.getTokenVersion("u1")).toBe(1);
    });
  });

  describe("incrementTokenVersion", () => {
    it("executes update query", async () => {
      await storage.incrementTokenVersion("u1");
      expect(mockUserRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });
});
