import { SIM_REDIS_PREFIX } from "@common/redis/redis.constants";

export const SimRedisKeys = {
  activeCount: `${SIM_REDIS_PREFIX}active_count`,
  activeSet: `${SIM_REDIS_PREFIX}active_ids`,
  active: (interviewId: string) => `${SIM_REDIS_PREFIX}active:${interviewId}`,
  queue: `${SIM_REDIS_PREFIX}queue`,
  userActive: (userId: string) => `${SIM_REDIS_PREFIX}user:active:${userId}`,
  context: (interviewId: string) => `${SIM_REDIS_PREFIX}ctx:${interviewId}`,
  queuedAt: (interviewId: string) => `${SIM_REDIS_PREFIX}queued_at:${interviewId}`,
} as const;
