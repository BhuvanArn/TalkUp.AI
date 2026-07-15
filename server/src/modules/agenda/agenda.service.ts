import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Repository,
  LessThanOrEqual,
  MoreThanOrEqual,
  Between,
  IsNull,
} from "typeorm";

import { CreateEventDto } from "./dto/createEvent.dto";
import { UpdateEventDto } from "./dto/updateEvent.dto";

import { agenda_event } from "@entities/agenda.entity";

@Injectable()
export class AgendaService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(agenda_event)
    private repo: Repository<agenda_event>,
  ) {
    this.logger = new Logger(AgendaService.name);
  }

  async create(user_id: string, payload: CreateEventDto) {
    if (payload.end_at && payload.end_at <= payload.start_at) {
      throw new BadRequestException("End time cannot be before start time.");
    }

    try {
      const entity = this.repo.create({ ...payload, user_id });

      return await this.repo.save(entity);
    } catch (error) {
      this.logger.error(
        `Error creating agenda event for user ${user_id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        "Internal server error while creating agenda event.",
      );
    }
  }

  async findOne(user_id: string, event_id: string) {
    try {
      const agenda = await this.repo.findOne({ where: { user_id, event_id } });

      if (!agenda) throw new NotFoundException("Event not found.");
      return agenda;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving agenda event ${event_id} for user ${user_id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        "Internal server error while retrieving agenda event.",
      );
    }
  }

  async update(user_id: string, event_id: string, payload: UpdateEventDto) {
    const agenda = await this.findOne(user_id, event_id);

    if (
      payload.end_at &&
      payload.start_at &&
      payload.end_at <= payload.start_at
    ) {
      throw new BadRequestException("End time cannot be before start time.");
    }
    Object.assign(agenda, payload);

    try {
      return await this.repo.save(agenda);
    } catch (error) {
      this.logger.error(
        `Error updating agenda event ${event_id} for user ${user_id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        "Internal server error while updating agenda event.",
      );
    }
  }

  async remove(user_id: string, event_id: string) {
    const agenda = await this.findOne(user_id, event_id);

    try {
      await this.repo.remove(agenda);
      return true;
    } catch (error) {
      this.logger.error(
        `Error removing agenda event ${event_id} for user ${user_id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        "Internal server error while removing agenda event.",
      );
    }
  }

  async listForRange(user_id: string, from: Date, to: Date) {
    try {
      return await this.repo.find({
        // An event overlaps the window when it starts before the end of it and
        // has not already finished. `end_at` is nullable, and SQL comparisons
        // against NULL are never true — so open-ended events need their own
        // branch, otherwise they would silently drop out of every range.
        where: [
          {
            user_id,
            start_at: LessThanOrEqual(to),
            end_at: MoreThanOrEqual(from),
          },
          {
            user_id,
            start_at: Between(from, to),
            end_at: IsNull(),
          },
        ],
        order: { start_at: "ASC" },
      });
    } catch (error) {
      this.logger.error(
        `Error listing agenda events for user ${user_id} from ${from} to ${to}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        "Internal server error while listing agenda events.",
      );
    }
  }
}
