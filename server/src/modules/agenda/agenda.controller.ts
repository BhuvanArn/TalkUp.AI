import {
  Controller,
  Post,
  Body,
  UsePipes,
  Get,
  Put,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";

import { UserId } from "@common/decorators/userId.decorator";
import { ParamId } from "@common/decorators/paramId.decorator";

import { PostValidationPipe } from "@common/pipes/PostValidationPipe";
import { AccessTokenGuard } from "@common/guards/accessToken.guard";

import { UpdateEventDto } from "./dto/updateEvent.dto";
import { CreateEventDto } from "./dto/createEvent.dto";

import { AgendaService } from "./agenda.service";
import { GetEventsQueryDto } from "./dto/getEventsQuery.dto";

@ApiTags("Agenda")
@Controller("agenda")
@UseGuards(AccessTokenGuard)
export class AgendaController {
  constructor(private service: AgendaService) {}

  @ApiCreatedResponse({
    description: "The event has been successfully created.",
    type: CreateEventDto,
  })
  @ApiUnprocessableEntityResponse({
    description: "Missing or invalid parameters in request.",
  })
  @ApiBadRequestResponse({
    description: "Badly formatted body.",
  })
  @UsePipes(new PostValidationPipe())
  @Post()
  create(@UserId() userId: string, @Body() body: CreateEventDto) {
    return this.service.create(userId, body);
  }

  @ApiOkResponse({
    description: "The event has been successfully retrieved.",
    type: CreateEventDto,
  })
  @ApiUnprocessableEntityResponse({
    description: "Missing or invalid parameters in request.",
  })
  @ApiBadRequestResponse({
    description: "Badly formatted event id.",
  })
  @ApiNotFoundResponse({
    description: "Event not found.",
  })
  @Get(":id")
  async getOne(@UserId() userId: string, @ParamId() id: string) {
    return await this.service.findOne(userId, id);
  }

  @ApiOkResponse({
    description: "The event has been successfully updated.",
    type: UpdateEventDto,
  })
  @ApiUnprocessableEntityResponse({
    description: "Missing or invalid parameters in request.",
  })
  @ApiBadRequestResponse({
    description: "Badly formatted event id or body.",
  })
  @ApiNotFoundResponse({
    description: "Event not found.",
  })
  @UsePipes(new PostValidationPipe())
  @Put(":id")
  update(
    @UserId() userId: string,
    @ParamId() id: string,
    @Body() body: UpdateEventDto,
  ) {
    return this.service.update(userId, id, body);
  }

  @ApiOkResponse({
    description: "The event has been successfully deleted.",
  })
  @ApiUnprocessableEntityResponse({
    description: "Missing or invalid parameters in request.",
  })
  @ApiBadRequestResponse({
    description: "Badly formatted event id.",
  })
  @ApiNotFoundResponse({
    description: "Event not found.",
  })
  @Delete(":id")
  remove(@UserId() userId: string, @ParamId() id: string) {
    return this.service.remove(userId, id);
  }

  @ApiOkResponse({
    description: "The events have been successfully retrieved.",
    type: [CreateEventDto],
  })
  @ApiUnprocessableEntityResponse({
    description: "Missing or invalid parameters in request.",
  })
  @ApiBadRequestResponse({
    description: "Badly formatted query parameter.",
  })
  @Get()
  list(@UserId() userId: string, @Query() query: GetEventsQueryDto) {
    const f = query.start_at ? new Date(query.start_at) : new Date();
    // If 'to' is not provided, default to one week from 'from'
    const t = query.end_at
      ? new Date(query.end_at)
      : new Date(f.getTime() + 1000 * 60 * 60 * 24 * 7);
    return this.service.listForRange(userId, f, t);
  }
}
