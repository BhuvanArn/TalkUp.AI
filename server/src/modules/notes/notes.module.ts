import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { note } from "@entities/note.entity";
import { ai_interview } from "@entities/aiInterview.entity";
import { AccessTokenGuard } from "@common/guards/accessToken.guard";

import { NotesService } from "./notes.service";
import { NotesController } from "./notes.controller";

@Module({
  imports: [TypeOrmModule.forFeature([note, ai_interview])],
  controllers: [NotesController],
  providers: [NotesService, AccessTokenGuard],
  exports: [NotesService],
})
export class NotesModule {}
