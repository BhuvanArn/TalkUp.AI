import { Module, Logger } from "@nestjs/common";
import Redis from "ioredis";

import { REDIS_CLIENT } from "./redis.constants";

@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl) {
          throw new Error(
            "REDIS_URL is required for simulation capacity (e.g. redis://127.0.0.1:6379). See server/.env.example.",
          );
        }

        const logger = new Logger("RedisModule");
        const client = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy(times) {
            if (times > 5) return null;
            return Math.min(times * 200, 2000);
          },
          lazyConnect: false,
          enableReadyCheck: true,
        });

        client.on("error", (err) => {
          logger.error(`Redis connection error: ${err.message}`);
        });

        client.on("connect", () => {
          logger.log("Redis connected (simulation + shared)");
        });

        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
