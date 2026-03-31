import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { agenda_event } from "@entities/agenda.entity";
import { AccessTokenGuard } from "@common/guards/accessToken.guard";

import { AgendaService } from "./agenda.service";
import { AgendaController } from "./agenda.controller";
import { user } from "@entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([agenda_event, user])],
  controllers: [AgendaController],
  providers: [AgendaService, AccessTokenGuard],
  exports: [AgendaService],
})
export class AgendaModule {}
