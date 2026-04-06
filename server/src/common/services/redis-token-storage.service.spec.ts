const mockRedis = {
  set: jest.fn().mockResolvedValue("OK"),
  setex: jest.fn().mockResolvedValue("OK"),
  exists: jest.fn().mockResolvedValue(0),
  ping: jest.fn().mockResolvedValue("PONG"),
  quit: jest.fn().mockResolvedValue("OK"),
  disconnect: jest.fn(),
  on: jest.fn(),
};

jest.mock("ioredis", () => {
  const MockRedis = jest.fn().mockImplementation(() => mockRedis);
  return { __esModule: true, default: MockRedis };
});

import IoRedis from "ioredis";

import { RedisTokenStorage } from "./redis-token-storage.service";

const mockedRedisCtor = IoRedis as unknown as jest.Mock;

describe("RedisTokenStorage", () => {
  let storage: RedisTokenStorage;
  let mockUserRepo: any;

  const origEnv = process.env.REDIS_URL;

  beforeAll(() => {
    process.env.REDIS_URL = "redis://localhost:6379";
  });

  afterAll(() => {
    if (origEnv === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = origEnv;
    }
  });

  it("throws when REDIS_URL is missing", () => {
    const prev = process.env.REDIS_URL;
    delete process.env.REDIS_URL;
    expect(() => new RedisTokenStorage(mockUserRepo as any)).toThrow(
      /REDIS_URL is required/,
    );
    process.env.REDIS_URL = prev;
  });

  it("registers Redis error/connect handlers and retryStrategy branches", () => {
    const lastCall = mockedRedisCtor.mock.calls.at(-1);
    expect(lastCall).toBeDefined();
    const opts = lastCall![1] as {
      retryStrategy: (n: number) => number | null;
    };
    expect(opts.retryStrategy(6)).toBeNull();
    expect(opts.retryStrategy(2)).toBe(400);

    const errorHandler = mockRedis.on.mock.calls.find(
      (c) => c[0] === "error",
    )?.[1] as (e: Error) => void;
    const connectHandler = mockRedis.on.mock.calls.find(
      (c) => c[0] === "connect",
    )?.[1] as () => void;

    expect(() => errorHandler(new Error("econnreset"))).not.toThrow();
    expect(() => connectHandler()).not.toThrow();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      }),
    };
    storage = new RedisTokenStorage(mockUserRepo as any);
  });

  afterEach(async () => {
    await storage?.onModuleDestroy();
  });

  describe("consumeRefreshJti", () => {
    it("returns true when SET NX succeeds", async () => {
      mockRedis.set.mockResolvedValueOnce("OK");
      expect(await storage.consumeRefreshJti("jti-new", 120)).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith(
        "rt:bl:jti-new",
        "1",
        "EX",
        120,
        "NX",
      );
    });

    it("returns false when key already exists", async () => {
      mockRedis.set.mockResolvedValueOnce(null);
      expect(await storage.consumeRefreshJti("jti-dup", 60)).toBe(false);
    });

    it("throws on Redis failure (fail closed)", async () => {
      mockRedis.set.mockRejectedValueOnce(new Error("ECONNREFUSED"));

      await expect(storage.consumeRefreshJti("jti-fail", 100)).rejects.toThrow(
        "ECONNREFUSED",
      );
    });
  });

  describe("blacklistToken", () => {
    it("calls SETEX with prefixed key and TTL", async () => {
      await storage.blacklistToken("jti-abc", 3600);

      expect(mockRedis.setex).toHaveBeenCalledWith("rt:bl:jti-abc", 3600, "1");
    });

    it("throws on Redis failure (fail closed)", async () => {
      mockRedis.setex.mockRejectedValueOnce(new Error("ECONNREFUSED"));

      await expect(storage.blacklistToken("jti-fail", 100)).rejects.toThrow(
        "ECONNREFUSED",
      );
    });
  });

  describe("isJtiBlacklisted", () => {
    it("returns true when key exists", async () => {
      mockRedis.exists.mockResolvedValueOnce(1);
      expect(await storage.isJtiBlacklisted("jti-1")).toBe(true);
    });

    it("returns false when key missing", async () => {
      mockRedis.exists.mockResolvedValueOnce(0);
      expect(await storage.isJtiBlacklisted("jti-2")).toBe(false);
    });

    it("throws on Redis failure (fail closed)", async () => {
      mockRedis.exists.mockRejectedValueOnce(new Error("ECONNREFUSED"));

      await expect(storage.isJtiBlacklisted("jti-fail")).rejects.toThrow(
        "ECONNREFUSED",
      );
    });
  });

  describe("getTokenVersion", () => {
    it("reads from Postgres, not Redis", async () => {
      mockUserRepo.findOne.mockResolvedValueOnce({ tokenVersion: 3 });
      expect(await storage.getTokenVersion("u1")).toBe(3);
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { user_id: "u1" },
      });
    });

    it("defaults to 1 when user not found", async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(null);
      expect(await storage.getTokenVersion("missing")).toBe(1);
    });
  });

  describe("incrementTokenVersion", () => {
    it("writes to Postgres, not Redis", async () => {
      await storage.incrementTokenVersion("u1");
      expect(mockUserRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe("ping", () => {
    it("returns true on PONG", async () => {
      mockRedis.ping.mockResolvedValueOnce("PONG");
      expect(await storage.ping()).toBe(true);
    });

    it("returns false when response is not PONG", async () => {
      mockRedis.ping.mockResolvedValueOnce("NO");
      expect(await storage.ping()).toBe(false);
    });

    it("returns false on error", async () => {
      mockRedis.ping.mockRejectedValueOnce(new Error("down"));
      expect(await storage.ping()).toBe(false);
    });
  });

  describe("onModuleDestroy", () => {
    it("disconnects when quit fails", async () => {
      mockRedis.quit.mockRejectedValueOnce(new Error("quit failed"));
      await storage.onModuleDestroy();
      expect(mockRedis.disconnect).toHaveBeenCalled();
    });
  });
});
