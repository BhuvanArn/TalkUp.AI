import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthCronService } from "./auth.cron";

import * as dotenv from "dotenv";
dotenv.config();

import { user, user_password, user_email } from "@entities/user.entity";
import { Otp } from "@entities/otp.entity";

@Module({
  imports: [TypeOrmModule.forFeature([user, user_password, user_email, Otp])],
  controllers: [AuthController],
  providers: [AuthService, AuthCronService],
  exports: [AuthService],
})
export class AuthModule {}
