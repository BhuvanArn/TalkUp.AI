import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import Redis from "ioredis";

import { ITokenStorage } from "@common/interfaces/token-storage";
import { user } from "@entities/user.entity";

/** Namespace RT blacklist keys so they never collide with other app Redis usage. */
const BLACKLIST_PREFIX = "rt:bl:";

/**
 * Redis-backed ITokenStorage (enabled when REDIS_URL is set in AuthModule).
 *
 * - Blacklist / consume: SET key NX EX (atomic) or SETEX; TTL removes keys — no cron sweep.
 * - tokenVersion: always read/written via Postgres in this class (same as Postgres adapter).
 * - Fail-closed: Redis errors propagate (do not fall back to "allow") so auth cannot bypass checks.
 */
@Injectable()
export class RedisTokenStorage
  extends ITokenStorage
  implements OnModuleDestroy
{
  private readonly logger = new Logger(RedisTokenStorage.name);
  private readonly redis: Redis;

  constructor(
    @InjectRepository(user)
    private readonly userRepo: Repository<user>,
  ) {
    super();

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error(
        "REDIS_URL is required when RedisTokenStorage is enabled",
      );
    }

    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: false,
      enableReadyCheck: true,
    });

    this.redis.on("error", (err) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });

    this.redis.on("connect", () => {
      this.logger.log("Redis connected");
    });
  }

  async onModuleDestroy() {
    try {
      await this.redis.quit();
    } catch {
      this.redis.disconnect();
    }
  }

  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.setex(`${BLACKLIST_PREFIX}${jti}`, ttlSeconds, "1");
    } catch (err) {
      this.logger.error(
        `Failed to blacklist token (fail closed): ${(err as Error).message}`,
      );
      throw err;
    }
  }

  async consumeRefreshJti(jti: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await this.redis.set(
        `${BLACKLIST_PREFIX}${jti}`,
        "1",
        "EX",
        ttlSeconds,
        "NX",
      );
      return result === "OK";
    } catch (err) {
      this.logger.error(
        `Failed to consume refresh JTI (fail closed): ${(err as Error).message}`,
      );
      throw err;
    }
  }

  async isJtiBlacklisted(jti: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(`${BLACKLIST_PREFIX}${jti}`);
      return result === 1;
    } catch (err) {
      this.logger.error(
        `Failed to check blacklist (fail closed): ${(err as Error).message}`,
      );
      throw err;
    }
  }

  async getTokenVersion(userId: string): Promise<number> {
    const u = await this.userRepo.findOne({ where: { user_id: userId } });
    return u?.tokenVersion ?? 1;
  }

  async incrementTokenVersion(userId: string): Promise<void> {
    await this.userRepo
      .createQueryBuilder()
      .update(user)
      .set({ tokenVersion: () => `"tokenVersion" + 1` })
      .where("user_id = :userId", { userId })
      .execute();
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === "PONG";
    } catch {
      return false;
    }
  }
}
