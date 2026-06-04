import { Injectable, Logger } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import Redis from "ioredis";

import { REDIS_CLIENT } from "@common/redis/redis.constants";

import { loadSimulationConfig } from "./simulation.config";
import { SimRedisKeys } from "./simulation.redis-keys";

export type CapacitySnapshot = {
  active: number;
  max: number;
  queueLength: number;
  accepting: boolean;
};

export type AcquireSlotResult =
  | { acquired: true }
  | { acquired: false; reason: "capacity" | "queue_full" };

const ACQUIRE_SLOT_LUA = `
local max = tonumber(ARGV[1])
local count = tonumber(redis.call('GET', KEYS[1]) or '0')
if count >= max then
  return 0
end
redis.call('INCR', KEYS[1])
redis.call('HSET', KEYS[2], 'userId', ARGV[2], 'startedAt', ARGV[3], 'lastHeartbeat', ARGV[3])
redis.call('SADD', KEYS[3], ARGV[4])
redis.call('SET', KEYS[4], ARGV[4], 'EX', tonumber(ARGV[5]))
return 1
`;

const RELEASE_SLOT_LUA = `
local count = tonumber(redis.call('GET', KEYS[1]) or '0')
if count > 0 then
  redis.call('DECR', KEYS[1])
end
redis.call('DEL', KEYS[2])
redis.call('SREM', KEYS[3], ARGV[1])
redis.call('DEL', KEYS[4])
redis.call('DEL', KEYS[5])
return 1
`;

@Injectable()
export class SimulationCapacityService {
  private readonly logger = new Logger(SimulationCapacityService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async getSnapshot(): Promise<CapacitySnapshot> {
    const { maxConcurrent } = loadSimulationConfig();
    const [activeRaw, queueLength] = await Promise.all([
      this.redis.get(SimRedisKeys.activeCount),
      this.redis.llen(SimRedisKeys.queue),
    ]);
    const active = parseInt(activeRaw ?? "0", 10);

    return {
      active,
      max: maxConcurrent,
      queueLength,
      accepting: active < maxConcurrent || queueLength > 0,
    };
  }

  async tryAcquireSlot(
    interviewId: string,
    userId: string,
  ): Promise<AcquireSlotResult> {
    const { maxConcurrent, slotTtlSec } = loadSimulationConfig();
    const now = Math.floor(Date.now() / 1000).toString();

    const acquired = (await this.redis.eval(
      ACQUIRE_SLOT_LUA,
      4,
      SimRedisKeys.activeCount,
      SimRedisKeys.active(interviewId),
      SimRedisKeys.activeSet,
      SimRedisKeys.userActive(userId),
      maxConcurrent.toString(),
      userId,
      now,
      interviewId,
      slotTtlSec.toString(),
    )) as number;

    if (acquired === 1) {
      return { acquired: true };
    }

    return { acquired: false, reason: "capacity" };
  }

  async enqueue(interviewId: string): Promise<{ ok: true } | { ok: false }> {
    const { queueMaxSize, queueEntryTtlSec } = loadSimulationConfig();
    const queueLength = await this.redis.llen(SimRedisKeys.queue);

    if (queueLength >= queueMaxSize) {
      return { ok: false };
    }

    await this.redis.rpush(SimRedisKeys.queue, interviewId);
    await this.redis.set(
      SimRedisKeys.queuedAt(interviewId),
      Date.now().toString(),
      "EX",
      queueEntryTtlSec,
    );

    return { ok: true };
  }

  async getQueuePosition(interviewId: string): Promise<number> {
    const pos = await this.redis.lpos(SimRedisKeys.queue, interviewId);
    if (pos === null) return 0;
    return pos + 1;
  }

  async removeFromQueue(interviewId: string): Promise<void> {
    await this.redis.lrem(SimRedisKeys.queue, 0, interviewId);
    await this.redis.del(SimRedisKeys.queuedAt(interviewId));
  }

  async releaseSlot(interviewId: string, userId: string): Promise<void> {
    await this.redis.eval(
      RELEASE_SLOT_LUA,
      5,
      SimRedisKeys.activeCount,
      SimRedisKeys.active(interviewId),
      SimRedisKeys.activeSet,
      SimRedisKeys.userActive(userId),
      SimRedisKeys.queuedAt(interviewId),
      interviewId,
      userId,
    );
  }

  async touchHeartbeat(interviewId: string, userId: string): Promise<void> {
    const { slotTtlSec } = loadSimulationConfig();
    const now = Math.floor(Date.now() / 1000).toString();
    const key = SimRedisKeys.active(interviewId);

    const exists = await this.redis.exists(key);
    if (!exists) return;

    await this.redis.hset(key, "lastHeartbeat", now);
    await this.redis.expire(key, slotTtlSec);
    await this.redis.expire(SimRedisKeys.userActive(userId), slotTtlSec);
  }

  async dequeueNext(): Promise<string | null> {
    return this.redis.lpop(SimRedisKeys.queue);
  }

  async getUserActiveInterviewId(userId: string): Promise<string | null> {
    return this.redis.get(SimRedisKeys.userActive(userId));
  }

  async listActiveInterviewIds(): Promise<string[]> {
    return this.redis.smembers(SimRedisKeys.activeSet);
  }

  async getActiveMeta(
    interviewId: string,
  ): Promise<{ userId: string; lastHeartbeat: number } | null> {
    const data = await this.redis.hgetall(SimRedisKeys.active(interviewId));
    if (!data.userId) return null;

    return {
      userId: data.userId,
      lastHeartbeat: parseInt(data.lastHeartbeat ?? data.startedAt ?? "0", 10),
    };
  }

  /** Reconcile counter after Redis flush or crash (dev/ops). */
  async reconcileActiveCount(): Promise<void> {
    const ids = await this.listActiveInterviewIds();
    await this.redis.set(SimRedisKeys.activeCount, ids.length.toString());
    this.logger.warn(`Reconciled active_count to ${ids.length}`);
  }
}
