import {
  Controller,
  Body,
  Post,
  Put,
  UseGuards,
  Get,
  Param,
  Query,
} from "@nestjs/common";

import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiUnprocessableEntityResponse,
  ApiTags,
  ApiOkResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
} from "@nestjs/swagger";

import { UsePipes } from "@nestjs/common/decorators/core/use-pipes.decorator";

import { PostValidationPipe } from "@common/pipes/PostValidationPipe";
import { AccessTokenGuard } from "@common/guards/accessToken.guard";
import { UserId } from "@common/decorators/userId.decorator";

import { AiService } from "./ai.service";

import { CreateAiInterviewDto } from "./dto/createAiInterview.dto";
import { PutAiInterviewDto } from "./dto/putAiInterview.dto";
import { GetInterviewsQueryDto } from "./dto/getInterviewsQuery.dto";
import { CreateAiTranscriptsDto } from "./dto/createAiTranscripts.dto";
import { CreateAiInterviewResponseDto } from "./dto/createAiInterviewResponse.dto";
import { InterviewSessionDto } from "./dto/interviewSession.dto";

@ApiTags("AI")
@Controller("ai")
@UseGuards(AccessTokenGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @ApiOkResponse({ description: "Current simulation capacity snapshot." })
  @Get("capacity")
  async getCapacity() {
    return this.aiService.getCapacity();
  }

  @ApiCreatedResponse({
    description: "The AI interview has been successfully created or queued.",
    type: CreateAiInterviewResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Badly formatted parameter.",
  })
  @ApiConflictResponse({
    description: "AI interview already asked.",
  })
  @ApiUnprocessableEntityResponse({
    description: "Missing parameter in request.",
  })
  @UsePipes(new PostValidationPipe())
  @Post("interviews")
  async createAiInterview(
    @Body() createAiInterviewDto: CreateAiInterviewDto,
    @UserId() userId: string,
  ) {
    return this.aiService.createInterview(createAiInterviewDto, userId);
  }

  @ApiExtraModels(GetInterviewsQueryDto)
  @ApiOkResponse({
    description: "List of AI interviews for the user.",
  })
  @ApiBadRequestResponse({
    description: "Badly formatted parameter.",
  })
  @Get("interviews")
  async getUserInterviews(
    @Query() query: GetInterviewsQueryDto,
    @UserId() userId: string,
  ) {
    return this.aiService.getUserInterviews(query, userId);
  }

  @ApiOkResponse({
    description: "Retrieve a single AI interview by id.",
  })
  @ApiBadRequestResponse({
    description: "Badly formatted parameter.",
  })
  @ApiNotFoundResponse({
    description: "AI interview not found.",
  })
  @Get("interviews/:id")
  async getOneInterview(@Param("id") id: string, @UserId() userId: string) {
    return await this.aiService.getInterviewById(id, userId, true);
  }

  @ApiOkResponse({
    description: "Live simulation session state (queue position, entrypoint).",
    type: InterviewSessionDto,
  })
  @Get("interviews/:id/session")
  async getInterviewSession(@Param("id") id: string, @UserId() userId: string) {
    return this.aiService.getInterviewSession(id, userId);
  }

  @ApiOkResponse({ description: "Interview cancelled and slot released." })
  @Post("interviews/:id/cancel")
  async cancelInterview(@Param("id") id: string, @UserId() userId: string) {
    return this.aiService.cancelInterview(id, userId);
  }

  @ApiOkResponse({
    description: "Refresh Redis slot heartbeat for an active simulation.",
  })
  @ApiConflictResponse({
    description: "Interview is not in an active simulation state.",
  })
  @Post("interviews/:id/heartbeat")
  async heartbeatSimulation(@Param("id") id: string, @UserId() userId: string) {
    return this.aiService.heartbeatSimulation(id, userId);
  }

  @ApiOkResponse({
    description: "The AI interview has been successfully edited.",
    type: PutAiInterviewDto,
  })
  @ApiBadRequestResponse({
    description: "Badly formatted parameter.",
  })
  @ApiConflictResponse({
    description: "AI interview cannot be edited.",
  })
  @ApiUnprocessableEntityResponse({
    description: "Missing parameter in request.",
  })
  @ApiNotFoundResponse({
    description: "AI interview not found.",
  })
  @UsePipes(new PostValidationPipe())
  @Put("interviews/:id")
  async editAiInterview(
    @Param("id") id: string,
    @Body() editAiInterviewDto: PutAiInterviewDto,
    @UserId() userId: string,
  ) {
    return this.aiService.editAiInterview(id, editAiInterviewDto, userId);
  }

  @ApiOkResponse({
    description: "Verbal analysis report for the interview.",
  })
  @ApiNotFoundResponse({
    description: "Verbal analysis not found.",
  })
  @Get("interviews/:id/verbal-analysis")
  async getVerbalAnalysis(@Param("id") id: string, @UserId() userId: string) {
    return this.aiService.getVerbalAnalysis(id, userId);
  }

  @ApiCreatedResponse({
    description: "Transcripts have been added to the interview.",
  })
  @ApiBadRequestResponse({
    description: "Badly formatted parameter.",
  })
  @ApiNotFoundResponse({
    description: "AI interview not found.",
  })
  @UsePipes(new PostValidationPipe())
  @Post("interviews/:id/transcripts")
  async addTranscripts(
    @Param("id") interviewId: string,
    @Body() createTranscriptsDto: CreateAiTranscriptsDto,
    @UserId() userId: string,
  ) {
    return this.aiService.addTranscripts(
      interviewId,
      createTranscriptsDto,
      userId,
    );
  }
}
