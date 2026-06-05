import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthCronService } from "./auth.cron";
import { AccessTokenGuard } from "@common/guards/accessToken.guard";
import { ResetTokenGuard } from "@common/guards/resetToken.guard";
import { SessionGuard } from "@common/guards/session.guard";

import { ITokenStorage } from "@common/interfaces/token-storage";

import { PostgresTokenStorage } from "@common/services/postgres-token-storage.service";
import { RedisTokenStorage } from "@common/services/redis-token-storage.service";

import * as dotenv from "dotenv";
dotenv.config();

import { user, user_password, user_email } from "@entities/user.entity";
import { Otp } from "@entities/otp.entity";
import { RevokedRefreshToken } from "@entities/revokedRefreshToken.entity";

/** Redis: RT blacklist TTL + atomic consume. No Redis: Postgres + cron cleanup. tv always in DB. */
const useRedis = !!process.env.REDIS_URL;

@Module({
  imports: [
    TypeOrmModule.forFeature([
      user,
      user_password,
      user_email,
      Otp,
      RevokedRefreshToken,
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthCronService,
    AccessTokenGuard,
    ResetTokenGuard,
    SessionGuard,
    {
      provide: ITokenStorage,
      useClass: useRedis ? RedisTokenStorage : PostgresTokenStorage,
    },
  ],
  exports: [AuthService, ITokenStorage],
})
export class AuthModule {}
