import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";

import { AccessTokenGuard } from "@common/guards/accessToken.guard";

import { ai_interview } from "@entities/aiInterview.entity";
import { user } from "@entities/user.entity";
import { ai_transcript } from "@entities/aiTranscript.entity";

import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";

// dependencies of the AccessTokenGuard
import { AuthService } from "../auth/auth.service";
// dependencies of the AuthService
import { user_email } from "@entities/user.entity";
import { user_password } from "@entities/user.entity";
import { Otp } from "@entities/otp.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ai_interview,
      ai_transcript,
      user,
      user_email,
      user_password,
      Otp,
    ]),
    HttpModule.register({
      timeout: 5000,
    }),
  ],
  providers: [AiService, AccessTokenGuard, AuthService],
  controllers: [AiController],
})
export class AiModule {}
