import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AccessTokenGuard } from "@common/guards/accessToken.guard";
import {
  user,
  user_email,
  user_phone_number,
  user_profile,
} from "@entities/user.entity";

import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      user,
      user_profile,
      user_email,
      user_phone_number,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, AccessTokenGuard],
  exports: [UsersService],
})
export class UsersModule {}
