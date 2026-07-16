import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";

import { AccessTokenGuard } from "@common/guards/accessToken.guard";

import { ai_interview } from "@entities/aiInterview.entity";
import { user } from "@entities/user.entity";
import { ai_transcript } from "@entities/aiTranscript.entity";

import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { SimulationModule } from "../simulation/simulation.module";
import { ApplicationsModule } from "../applications/applications.module";
import { AgendaModule } from "../agenda/agenda.module";
import { NotesModule } from "../notes/notes.module";

@Module({
  imports: [
    SimulationModule,
    ApplicationsModule,
    AgendaModule,
    NotesModule,
    TypeOrmModule.forFeature([ai_interview, ai_transcript, user]),
    HttpModule.register({
      timeout: 5000,
    }),
  ],
  providers: [AiService, AccessTokenGuard],
  controllers: [AiController],
})
export class AiModule {}
