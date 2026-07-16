import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { UsePipes } from "@nestjs/common";

import { PostValidationPipe } from "@common/pipes/PostValidationPipe";
import { InternalApiKeyGuard } from "./guards/internal-api-key.guard";
import { SimulationContextService } from "./simulation-context.service";
import { SimulationVerbalAnalysisService } from "./simulation-verbal-analysis.service";
import { AppendSimulationHistoryDto } from "./dto/appendSimulationHistory.dto";
import { AppendAssistantTurnDto } from "./dto/appendAssistantTurn.dto";
import { SaveVerbalAnalysisDto } from "./dto/saveVerbalAnalysis.dto";

@ApiExcludeController()
@Controller("ai/internal")
@UseGuards(InternalApiKeyGuard)
export class SimulationInternalController {
  constructor(
    private readonly contextService: SimulationContextService,
    private readonly verbalAnalysisService: SimulationVerbalAnalysisService,
  ) {}

  @Get("sessions/:interviewId/context")
  getSessionContext(@Param("interviewId") interviewId: string) {
    return this.contextService.getContextForSts(interviewId);
  }

  @UsePipes(new PostValidationPipe())
  @Post("sessions/:interviewId/history")
  appendHistory(
    @Param("interviewId") interviewId: string,
    @Body() dto: AppendSimulationHistoryDto,
  ) {
    return this.contextService.appendTurn(
      interviewId,
      dto.userText,
      dto.assistantText,
    );
  }

  @UsePipes(new PostValidationPipe())
  @Post("sessions/:interviewId/assistant-turn")
  appendAssistantTurn(
    @Param("interviewId") interviewId: string,
    @Body() dto: AppendAssistantTurnDto,
  ) {
    return this.contextService.appendAssistantTurn(
      interviewId,
      dto.assistantText,
    );
  }

  @UsePipes(new PostValidationPipe())
  @Post("sessions/:interviewId/verbal-analysis")
  saveVerbalAnalysis(
    @Param("interviewId") interviewId: string,
    @Body() dto: SaveVerbalAnalysisDto,
  ) {
    return this.verbalAnalysisService.saveForInterview(interviewId, dto);
  }
}
