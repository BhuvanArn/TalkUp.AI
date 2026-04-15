import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";

import { LinkedInController } from "./linkedin.controller";
import { LinkedInService } from "./linkedin.service";

import {
  user,
  user_email,
  user_oauth,
  user_profile,
} from "@entities/user.entity";

import * as dotenv from "dotenv";
dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forFeature([user, user_profile, user_email, user_oauth]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [LinkedInController],
  providers: [LinkedInService],
  exports: [LinkedInService],
})
export class LinkedInModule {}
