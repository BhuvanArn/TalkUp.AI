import { Test, TestingModule } from "@nestjs/testing";

import { REDIS_CLIENT } from "@common/redis/redis.constants";
import { SimulationCapacityService } from "./simulation-capacity.service";
import { SimRedisKeys } from "./simulation.redis-keys";

describe("SimulationCapacityService", () => {
  let service: SimulationCapacityService;
  let redis: {
    get: jest.Mock;
    set: jest.Mock;
    eval: jest.Mock;
    llen: jest.Mock;
    rpush: jest.Mock;
    lpush: jest.Mock;
    lpos: jest.Mock;
    lrem: jest.Mock;
    lpop: jest.Mock;
    del: jest.Mock;
    hgetall: jest.Mock;
    exists: jest.Mock;
    hset: jest.Mock;
    expire: jest.Mock;
    smembers: jest.Mock;
  };

  beforeEach(async () => {
    redis = {
      get: jest.fn().mockResolvedValue("0"),
      set: jest.fn().mockResolvedValue("OK"),
      eval: jest.fn().mockResolvedValue(1),
      llen: jest.fn().mockResolvedValue(0),
      rpush: jest.fn(),
      lpush: jest.fn(),
      lpos: jest.fn().mockResolvedValue(null),
      lrem: jest.fn(),
      lpop: jest.fn().mockResolvedValue(null),
      del: jest.fn(),
      hgetall: jest.fn().mockResolvedValue({}),
      exists: jest.fn().mockResolvedValue(1),
      hset: jest.fn(),
      expire: jest.fn(),
      smembers: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationCapacityService,
        { provide: REDIS_CLIENT, useValue: redis },
      ],
    }).compile();

    service = module.get(SimulationCapacityService);
  });

  describe("getSnapshot", () => {
    it("returns capacity snapshot and accepts when below max", async () => {
      redis.get.mockResolvedValueOnce("1");
      redis.llen.mockResolvedValueOnce(0);

      const snap = await service.getSnapshot();

      expect(snap).toEqual({
        active: 1,
        max: 2,
        queueLength: 0,
        accepting: true,
      });
    });

    it("is still accepting when full but queue has room (queueLength > 0)", async () => {
      redis.get.mockResolvedValueOnce("2");
      redis.llen.mockResolvedValueOnce(3);

      const snap = await service.getSnapshot();

      expect(snap.active).toBe(2);
      expect(snap.queueLength).toBe(3);
      expect(snap.accepting).toBe(true);
    });

    it("is not accepting when full and queue empty", async () => {
      redis.get.mockResolvedValueOnce("2");
      redis.llen.mockResolvedValueOnce(0);

      const snap = await service.getSnapshot();

      expect(snap.accepting).toBe(false);
    });

    it("defaults active to 0 when counter is missing", async () => {
      redis.get.mockResolvedValueOnce(null);
      redis.llen.mockResolvedValueOnce(0);

      const snap = await service.getSnapshot();

      expect(snap.active).toBe(0);
    });
  });

  describe("tryAcquireSlot", () => {
    it("acquires a slot when lua returns 1", async () => {
      redis.eval.mockResolvedValueOnce(1);
      const result = await service.tryAcquireSlot("int-1", "user-1");

      expect(result).toEqual({ acquired: true });
      expect(redis.eval).toHaveBeenCalled();
    });

    it("fails with capacity reason when lua returns 0", async () => {
      redis.eval.mockResolvedValueOnce(0);
      const result = await service.tryAcquireSlot("int-1", "user-1");

      expect(result).toEqual({ acquired: false, reason: "capacity" });
    });
  });

  describe("enqueue", () => {
    it("enqueues and sets queuedAt marker when queue has room", async () => {
      redis.llen.mockResolvedValueOnce(0);

      const result = await service.enqueue("int-1");

      expect(result).toEqual({ ok: true });
      expect(redis.rpush).toHaveBeenCalledWith(SimRedisKeys.queue, "int-1");
      expect(redis.set).toHaveBeenCalledWith(
        SimRedisKeys.queuedAt("int-1"),
        expect.any(String),
        "EX",
        expect.any(Number),
      );
    });

    it("rejects when queue is at max size", async () => {
      redis.llen.mockResolvedValueOnce(20);

      const result = await service.enqueue("int-1");

      expect(result).toEqual({ ok: false });
      expect(redis.rpush).not.toHaveBeenCalled();
    });
  });

  describe("requeueFront", () => {
    it("LPUSHes the interview to the head of the queue", async () => {
      await service.requeueFront("int-1");

      expect(redis.lpush).toHaveBeenCalledWith(SimRedisKeys.queue, "int-1");
      expect(redis.rpush).not.toHaveBeenCalled();
    });
  });

  describe("getQueuePosition", () => {
    it("returns 0 when the interview is not in the queue", async () => {
      redis.lpos.mockResolvedValueOnce(null);
      expect(await service.getQueuePosition("int-1")).toBe(0);
    });

    it("returns 1-based position when present", async () => {
      redis.lpos.mockResolvedValueOnce(2);
      expect(await service.getQueuePosition("int-1")).toBe(3);
    });
  });

  describe("removeFromQueue", () => {
    it("removes from list and deletes queuedAt marker", async () => {
      await service.removeFromQueue("int-1");

      expect(redis.lrem).toHaveBeenCalledWith(SimRedisKeys.queue, 0, "int-1");
      expect(redis.del).toHaveBeenCalledWith(SimRedisKeys.queuedAt("int-1"));
    });
  });

  describe("releaseSlot", () => {
    it("evals the release lua with 5 keys", async () => {
      await service.releaseSlot("int-1", "user-1");

      expect(redis.eval).toHaveBeenCalledWith(
        expect.any(String),
        5,
        SimRedisKeys.activeCount,
        SimRedisKeys.active("int-1"),
        SimRedisKeys.activeSet,
        SimRedisKeys.userActive("user-1"),
        SimRedisKeys.queuedAt("int-1"),
        "int-1",
        "user-1",
      );
    });
  });

  describe("touchHeartbeat", () => {
    it("refreshes hash and TTLs when the slot exists", async () => {
      redis.exists.mockResolvedValueOnce(1);

      await service.touchHeartbeat("int-1", "user-1");

      expect(redis.hset).toHaveBeenCalledWith(
        SimRedisKeys.active("int-1"),
        "lastHeartbeat",
        expect.any(String),
      );
      expect(redis.expire).toHaveBeenCalledWith(
        SimRedisKeys.active("int-1"),
        expect.any(Number),
      );
      expect(redis.expire).toHaveBeenCalledWith(
        SimRedisKeys.userActive("user-1"),
        expect.any(Number),
      );
    });

    it("is a no-op when the slot does not exist", async () => {
      redis.exists.mockResolvedValueOnce(0);

      await service.touchHeartbeat("int-1", "user-1");

      expect(redis.hset).not.toHaveBeenCalled();
      expect(redis.expire).not.toHaveBeenCalled();
    });
  });

  describe("dequeueNext", () => {
    it("LPOPs the next queued interview", async () => {
      redis.lpop.mockResolvedValueOnce("int-1");
      expect(await service.dequeueNext()).toBe("int-1");
      expect(redis.lpop).toHaveBeenCalledWith(SimRedisKeys.queue);
    });
  });

  describe("getUserActiveInterviewId", () => {
    it("returns the stored active interview id for the user", async () => {
      redis.get.mockResolvedValueOnce("int-9");
      expect(await service.getUserActiveInterviewId("user-1")).toBe("int-9");
      expect(redis.get).toHaveBeenCalledWith(SimRedisKeys.userActive("user-1"));
    });
  });

  describe("listActiveInterviewIds", () => {
    it("returns members of the active set", async () => {
      redis.smembers.mockResolvedValueOnce(["a", "b"]);
      expect(await service.listActiveInterviewIds()).toEqual(["a", "b"]);
    });
  });

  describe("getActiveMeta", () => {
    it("returns null when no userId is stored", async () => {
      redis.hgetall.mockResolvedValueOnce({});
      expect(await service.getActiveMeta("int-1")).toBeNull();
    });

    it("parses meta using lastHeartbeat", async () => {
      redis.hgetall.mockResolvedValueOnce({
        userId: "user-1",
        lastHeartbeat: "1700",
        startedAt: "1600",
      });

      expect(await service.getActiveMeta("int-1")).toEqual({
        userId: "user-1",
        lastHeartbeat: 1700,
      });
    });

    it("falls back to startedAt when lastHeartbeat is absent", async () => {
      redis.hgetall.mockResolvedValueOnce({
        userId: "user-1",
        startedAt: "1600",
      });

      expect((await service.getActiveMeta("int-1"))?.lastHeartbeat).toBe(1600);
    });

    it("falls back to 0 when neither timestamp is present", async () => {
      redis.hgetall.mockResolvedValueOnce({ userId: "user-1" });

      expect((await service.getActiveMeta("int-1"))?.lastHeartbeat).toBe(0);
    });
  });

  describe("reconcileActiveCount", () => {
    it("sets the active counter to the number of active ids", async () => {
      redis.smembers.mockResolvedValueOnce(["a", "b", "c"]);

      await service.reconcileActiveCount();

      expect(redis.set).toHaveBeenCalledWith(SimRedisKeys.activeCount, "3");
    });
  });
});
