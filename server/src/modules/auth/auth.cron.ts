import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThan, Repository } from "typeorm";

import { UserStatus } from "@common/enums/UserStatus";
import { Otp } from "@entities/otp.entity";
import { user } from "@entities/user.entity";

@Injectable()
export class AuthCronService {
  private readonly logger = new Logger(AuthCronService.name);

  constructor(
    @InjectRepository(user)
    private readonly userRepository: Repository<user>,
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
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

      this.logger.log(
        `Auth cleanup completed: deleted ${userDeletion.affected ?? 0} stale pending users and ${otpDeletion.affected ?? 0} expired OTP entries`,
      );
    } catch (error) {
      this.logger.error("Auth cleanup failed", error as Error);
      throw error;
    }
  }
}
