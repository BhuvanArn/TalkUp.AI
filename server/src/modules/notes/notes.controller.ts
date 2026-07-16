import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Delete,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";

import { UserId } from "@common/decorators/userId.decorator";
import { ParamId } from "@common/decorators/paramId.decorator";
import { PostValidationPipe } from "@common/pipes/PostValidationPipe";
import { AccessTokenGuard } from "@common/guards/accessToken.guard";

import { NotesService } from "./notes.service";
import { CreateNoteDto } from "./dto/createNote.dto";
import { UpdateNoteDto } from "./dto/updateNote.dto";
import { GetNotesQueryDto } from "./dto/getNotesQuery.dto";
import { NoteResponseDto } from "./dto/noteResponse.dto";

@ApiTags("Notes")
@Controller("notes")
@UseGuards(AccessTokenGuard)
export class NotesController {
  constructor(private readonly service: NotesService) {}

  @ApiOperation({
    summary:
      "Create a note (general, linked to an interview, or linked to an application). interviewId and applicationId are mutually exclusive.",
  })
  @ApiCreatedResponse({ description: "Note created.", type: NoteResponseDto })
  @ApiUnprocessableEntityResponse({
    description: "Missing required parameters.",
  })
  @ApiBadRequestResponse({
    description:
      "Badly formatted body, or interviewId and applicationId both set.",
  })
  @ApiNotFoundResponse({
    description: "Linked interview or application not found.",
  })
  @ApiForbiddenResponse({
    description: "Linked interview or application belongs to another user.",
  })
  @UsePipes(new PostValidationPipe())
  @Post()
  create(@UserId() userId: string, @Body() body: CreateNoteDto) {
    return this.service.create(userId, body);
  }

  @ApiOperation({
    summary:
      "List the caller's notes. No filter = all; ?interviewId= = one interview; ?applicationId= = one application (application- and in-simulation notes); ?standalone=true = general notes only. The three filters are mutually exclusive.",
  })
  @ApiOkResponse({ description: "Notes retrieved.", type: [NoteResponseDto] })
  @ApiBadRequestResponse({
    description:
      "Badly formatted query, or more than one of interviewId, applicationId and standalone set.",
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get()
  list(@UserId() userId: string, @Query() query: GetNotesQueryDto) {
    return this.service.findAll(userId, query);
  }

  @ApiOperation({ summary: "Retrieve one of the caller's notes by id." })
  @ApiOkResponse({ description: "Note retrieved.", type: NoteResponseDto })
  @ApiBadRequestResponse({ description: "Badly formatted note id." })
  @ApiNotFoundResponse({ description: "Note not found." })
  @Get(":id")
  getOne(@UserId() userId: string, @ParamId() id: string) {
    return this.service.findOne(userId, id);
  }

  @ApiOperation({ summary: "Update one of the caller's notes." })
  @ApiOkResponse({ description: "Note updated.", type: NoteResponseDto })
  @ApiUnprocessableEntityResponse({
    description: "Missing required parameters.",
  })
  @ApiBadRequestResponse({ description: "Badly formatted note id or body." })
  @ApiNotFoundResponse({ description: "Note not found." })
  @UsePipes(new PostValidationPipe())
  @Put(":id")
  update(
    @UserId() userId: string,
    @ParamId() id: string,
    @Body() body: UpdateNoteDto,
  ) {
    return this.service.update(userId, id, body);
  }

  @ApiOperation({ summary: "Delete one of the caller's notes." })
  @ApiOkResponse({ description: "Note deleted." })
  @ApiBadRequestResponse({ description: "Badly formatted note id." })
  @ApiNotFoundResponse({ description: "Note not found." })
  @Delete(":id")
  remove(@UserId() userId: string, @ParamId() id: string) {
    return this.service.remove(userId, id);
  }
}
