import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThan, Repository } from "typeorm";

import { UserStatus } from "@common/enums/UserStatus";
import { Otp } from "@entities/otp.entity";
import { user } from "@entities/user.entity";
import { RevokedRefreshToken } from "@entities/revokedRefreshToken.entity";

/** When Redis backs ITokenStorage, blacklist entries expire via key TTL — skip table purge. */
const REDIS_HANDLES_BLACKLIST = !!process.env.REDIS_URL;

@Injectable()
export class AuthCronService {
  private readonly logger = new Logger(AuthCronService.name);

  constructor(
    @InjectRepository(user)
    private readonly userRepository: Repository<user>,
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    @InjectRepository(RevokedRefreshToken)
    private readonly revokedRefreshTokenRepository: Repository<RevokedRefreshToken>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupStaleAuthData() {
    try {
      const pendingCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

      const userDeletion = await this.userRepository.delete({
        status: UserStatus.PENDING,
        created_at: LessThan(pendingCutoff),
      });

      const otpDeletion = await this.otpRepository.delete({
        expiresAt: LessThan(new Date()),
      });

      let blacklistAffected = 0;

      // if not using Redis, delete expired entries from the revoked table
      // if using Redis, blacklist entries are managed by the Redis TTL
      if (!REDIS_HANDLES_BLACKLIST) {
        const blacklistDeletion =
          await this.revokedRefreshTokenRepository.delete({
            expires_at: LessThan(new Date()),
          });
        blacklistAffected = blacklistDeletion.affected ?? 0;
      }

      this.logger.log(
        `Auth cleanup completed: deleted ${userDeletion.affected ?? 0} stale pending users, ${otpDeletion.affected ?? 0} expired OTPs` +
          (REDIS_HANDLES_BLACKLIST
            ? " (blacklist managed by Redis TTL)"
            : `, ${blacklistAffected} expired blacklist entries`),
      );
    } catch (error) {
      this.logger.error("Auth cleanup failed", error as Error);
      throw error;
    }
  }
}
