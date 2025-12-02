import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

import * as dotenv from "dotenv";
dotenv.config();

import { user, user_password, user_email } from "@entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([user, user_password, user_email]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
