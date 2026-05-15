import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccessTokenGuard } from "@common/guards/accessToken.guard";
import {
  user,
  user_email,
  user_password,
  user_phone_number,
  user_profile,
} from "@entities/user.entity";
import { user_cv } from "@entities/userCV.entity";
import { user_job_offer } from "@entities/userJobOffer.entity";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      user,
      user_profile,
      user_email,
      user_phone_number,
      user_password,
      user_cv,
      user_job_offer,
    ]),
    AuthModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, AccessTokenGuard],
  exports: [UsersService],
})
export class UsersModule {}
