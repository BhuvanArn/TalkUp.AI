import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { agenda_event } from "@entities/agenda.entity";
import { AccessTokenGuard } from "@common/guards/accessToken.guard";

import { AgendaService } from "./agenda.service";
import { AgendaController } from "./agenda.controller";

// dependencies of the AccessTokenGuard
import { AuthService } from "../auth/auth.service";
// dependencies of the AuthService
import { user } from "@entities/user.entity";
import { user_email } from "@entities/user.entity";
import { user_password } from "@entities/user.entity";
import { Otp } from "@entities/otp.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([agenda_event, user, user_email, user_password, Otp]),
  ],
  controllers: [AgendaController],
  providers: [AgendaService, AccessTokenGuard, AuthService],
  exports: [AgendaService],
})
export class AgendaModule {}
