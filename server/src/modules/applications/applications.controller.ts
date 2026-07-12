import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { UsePipes } from "@nestjs/common/decorators/core/use-pipes.decorator";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { AccessTokenGuard } from "@common/guards/accessToken.guard";
import { PostValidationPipe } from "@common/pipes/PostValidationPipe";
import { CurrentUser } from "@common/decorators/currentUser.decorator";
import { user } from "@entities/user.entity";

import { ApplicationsService } from "./applications.service";
import { CreateApplicationDto } from "./dto/createApplication.dto";
import { UpdateApplicationStatusDto } from "./dto/updateApplicationStatus.dto";
import { GetApplicationDto } from "./dto/getApplication.dto";
import { GetRoadmapDto } from "./dto/getRoadmap.dto";

@ApiTags("Applications")
@UseGuards(AccessTokenGuard)
@Controller("applications")
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @ApiOperation({
    summary:
      "Scrape a job-offer URL and create an application with a CV snapshot",
  })
  @ApiOkResponse({
    description: "The created application",
    type: GetApplicationDto,
  })
  @ApiBadRequestResponse({
    description: "Missing/invalid URL, blocked target, or unscrapable page",
  })
  @ApiUnauthorizedResponse()
  @UsePipes(new PostValidationPipe())
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post()
  async create(
    @CurrentUser() user: user,
    @Body() dto: CreateApplicationDto,
  ): Promise<GetApplicationDto> {
    const row = await this.applicationsService.createFromUrl(
      user.user_id,
      dto.url,
      dto.interviewAt,
    );
    return GetApplicationDto.fromEntity(row);
  }

  @ApiOperation({ summary: "List the current user's applications" })
  @ApiOkResponse({ type: [GetApplicationDto] })
  @ApiUnauthorizedResponse()
  @Get()
  async list(@CurrentUser() user: user): Promise<GetApplicationDto[]> {
    const rows = await this.applicationsService.listForUser(user.user_id);
    return rows.map((row) => GetApplicationDto.fromEntity(row));
  }

  @ApiOperation({
    summary: "Update an application's tracking status and/or interview date",
  })
  @ApiOkResponse({
    description: "The updated application",
    type: GetApplicationDto,
  })
  @ApiNotFoundResponse({ description: "Application not found" })
  @ApiUnauthorizedResponse()
  @UsePipes(new PostValidationPipe())
  @Patch(":id")
  async updateStatus(
    @CurrentUser() user: user,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ): Promise<GetApplicationDto> {
    const row = await this.applicationsService.updateApplication(
      user.user_id,
      id,
      { status: dto.status, interviewAt: dto.interviewAt },
    );
    return GetApplicationDto.fromEntity(row);
  }

  @ApiOperation({ summary: "Delete an application" })
  @ApiNoContentResponse({ description: "Application deleted" })
  @ApiNotFoundResponse({ description: "Application not found" })
  @ApiUnauthorizedResponse()
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeOne(
    @CurrentUser() user: user,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.applicationsService.remove(user.user_id, id);
  }

  @ApiOperation({
    summary: "Get the preparation roadmap (lazily generated and cached)",
  })
  @ApiOkResponse({ description: "The roadmap", type: GetRoadmapDto })
  @ApiNotFoundResponse({ description: "Application not found" })
  @ApiUnauthorizedResponse()
  @Get(":id/roadmap")
  async getRoadmap(
    @CurrentUser() user: user,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<GetRoadmapDto> {
    const roadmap = await this.applicationsService.getRoadmap(user.user_id, id);
    return GetRoadmapDto.fromExtraction(roadmap);
  }

  @ApiOperation({
    summary: "Force-regenerate the preparation roadmap (rate-limited)",
  })
  @ApiOkResponse({
    description: "The regenerated roadmap",
    type: GetRoadmapDto,
  })
  @ApiNotFoundResponse({ description: "Application not found" })
  @ApiUnauthorizedResponse()
  // Route-level guard ADDS to the class-level AccessTokenGuard. @Throttle
  // alone would be a no-op on this controller (no global ThrottlerGuard) —
  // an unthrottled LLM endpoint means unbounded Groq spend per user.
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post(":id/roadmap/regenerate")
  @HttpCode(HttpStatus.OK)
  async regenerateRoadmap(
    @CurrentUser() user: user,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<GetRoadmapDto> {
    const roadmap = await this.applicationsService.regenerateRoadmap(
      user.user_id,
      id,
    );
    return GetRoadmapDto.fromExtraction(roadmap);
  }
}
