import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";

import { note } from "@entities/note.entity";
import { ai_interview } from "@entities/aiInterview.entity";

import { CreateNoteDto } from "./dto/createNote.dto";
import { UpdateNoteDto } from "./dto/updateNote.dto";
import { GetNotesQueryDto } from "./dto/getNotesQuery.dto";
import { NoteResponseDto } from "./dto/noteResponse.dto";

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(
    @InjectRepository(note)
    private readonly repo: Repository<note>,
    @InjectRepository(ai_interview)
    private readonly interviewRepo: Repository<ai_interview>,
  ) {}

  private toResponse(entity: note): NoteResponseDto {
    return {
      note_id: entity.note_id,
      user_id: entity.user_id,
      interview_id: entity.interview_id,
      title: entity.title,
      content: entity.content ?? "",
      color: entity.color,
      is_favorite: entity.is_favorite,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }

  private async assertOwnedInterview(userId: string, interviewId: string) {
    const interview = await this.interviewRepo.findOne({
      where: { interview_id: interviewId },
    });
    if (!interview) throw new NotFoundException("Interview not found.");
    if (interview.user_id !== userId)
      throw new ForbiddenException("Interview does not belong to the user.");
  }

  async create(userId: string, dto: CreateNoteDto): Promise<NoteResponseDto> {
    if (dto.interviewId) {
      await this.assertOwnedInterview(userId, dto.interviewId);
    }

    try {
      const entity = this.repo.create({
        user_id: userId,
        interview_id: dto.interviewId ?? null,
        title: dto.title,
        content: dto.content ?? null,
        color: dto.color ?? "blue",
        is_favorite: dto.is_favorite ?? false,
      });
      const saved = await this.repo.save(entity);
      return this.toResponse(saved);
    } catch (error) {
      this.logger.error(
        `Error creating note for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        "Internal server error while creating note.",
      );
    }
  }

  async findAll(
    userId: string,
    query: GetNotesQueryDto,
  ): Promise<NoteResponseDto[]> {
    if (query.interviewId !== undefined && query.standalone !== undefined) {
      throw new BadRequestException(
        "interviewId and standalone are mutually exclusive.",
      );
    }

    const where: Record<string, unknown> = { user_id: userId };
    if (query.interviewId !== undefined) {
      where.interview_id = query.interviewId;
    } else if (query.standalone !== undefined) {
      where.interview_id = IsNull();
    }

    try {
      const notes = await this.repo.find({
        where,
        order: { updated_at: "DESC" },
      });
      return notes.map((n) => this.toResponse(n));
    } catch (error) {
      this.logger.error(
        `Error listing notes for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        "Internal server error while listing notes.",
      );
    }
  }

  private async findOwned(userId: string, noteId: string): Promise<note> {
    const found = await this.repo.findOne({
      where: { user_id: userId, note_id: noteId },
    });
    if (!found) throw new NotFoundException("Note not found.");
    return found;
  }

  async findOne(userId: string, noteId: string): Promise<NoteResponseDto> {
    const found = await this.findOwned(userId, noteId);
    return this.toResponse(found);
  }

  async update(
    userId: string,
    noteId: string,
    dto: UpdateNoteDto,
  ): Promise<NoteResponseDto> {
    const found = await this.findOwned(userId, noteId);
    Object.assign(found, dto);
    try {
      const saved = await this.repo.save(found);
      return this.toResponse(saved);
    } catch (error) {
      this.logger.error(
        `Error updating note ${noteId} for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        "Internal server error while updating note.",
      );
    }
  }

  async remove(userId: string, noteId: string): Promise<boolean> {
    const found = await this.findOwned(userId, noteId);
    try {
      await this.repo.remove(found);
      return true;
    } catch (error) {
      this.logger.error(
        `Error removing note ${noteId} for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        "Internal server error while removing note.",
      );
    }
  }
}
