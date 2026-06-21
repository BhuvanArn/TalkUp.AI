import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryFailedError, Repository } from "typeorm";

import { ITokenStorage } from "@common/interfaces/token-storage";
import { RevokedRefreshToken } from "@entities/revokedRefreshToken.entity";
import { user } from "@entities/user.entity";

/**
 * ITokenStorage without Redis: blacklist rows in `RevokedRefreshToken` + cron purge
 * of expired rows (see AuthCronService when REDIS_URL is unset).
 */
@Injectable()
export class PostgresTokenStorage extends ITokenStorage {
  constructor(
    @InjectRepository(RevokedRefreshToken)
    private readonly revokedRepo: Repository<RevokedRefreshToken>,
    @InjectRepository(user)
    private readonly userRepo: Repository<user>,
  ) {
    super();
  }

  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await this.revokedRepo.upsert({ jti, expires_at: expiresAt }, ["jti"]);
  }

  async consumeRefreshJti(jti: string, ttlSeconds: number): Promise<boolean> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    try {
      // Primary key on jti => second concurrent insert loses with 23505 (atomic claim).
      await this.revokedRepo.insert({ jti, expires_at: expiresAt });
      return true;
    } catch (e) {
      if (
        e instanceof QueryFailedError &&
        (e as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === "23505"
      ) {
        return false;
      }
      throw e;
    }
  }

  async isJtiBlacklisted(jti: string): Promise<boolean> {
    const found = await this.revokedRepo.findOne({ where: { jti } });
    return !!found;
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
}
