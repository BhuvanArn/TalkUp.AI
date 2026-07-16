import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ai_verbal_analysis } from "@entities/aiVerbalAnalysis.entity";
import { ai_interview } from "@entities/aiInterview.entity";

import { SaveVerbalAnalysisDto } from "./dto/saveVerbalAnalysis.dto";

@Injectable()
export class SimulationVerbalAnalysisService {
  private readonly logger = new Logger(SimulationVerbalAnalysisService.name);

  constructor(
    @InjectRepository(ai_verbal_analysis)
    private readonly analysisRepo: Repository<ai_verbal_analysis>,
    @InjectRepository(ai_interview)
    private readonly interviewRepo: Repository<ai_interview>,
  ) {}

  async saveForInterview(
    interviewId: string,
    dto: SaveVerbalAnalysisDto,
  ): Promise<ai_verbal_analysis> {
    const aggregate = dto.aggregate ?? {};
    const overallScore =
      typeof aggregate.avg_overall_score === "number"
        ? Math.round(aggregate.avg_overall_score)
        : null;

    let record = await this.analysisRepo.findOne({
      where: { interview_id: interviewId },
    });

    if (record) {
      record.aggregate = aggregate;
      record.turns = dto.turns ?? [];
      record.overall_score = overallScore;
    } else {
      record = this.analysisRepo.create({
        interview_id: interviewId,
        aggregate,
        turns: dto.turns ?? [],
        overall_score: overallScore,
      });
    }

    const saved = await this.analysisRepo.save(record);

    if (overallScore !== null) {
      await this.interviewRepo.update(
        { interview_id: interviewId },
        {
          score: overallScore,
          feedback: this.buildFeedbackSummary(aggregate),
        },
      );
    }

    this.logger.log(`Verbal analysis saved for interview ${interviewId}`);
    return saved;
  }

  async getForInterview(
    interviewId: string,
    userId: string,
  ): Promise<ai_verbal_analysis | null> {
    const interview = await this.interviewRepo.findOne({
      where: { interview_id: interviewId, user_id: userId },
    });
    if (!interview) return null;

    return this.analysisRepo.findOne({
      where: { interview_id: interviewId },
    });
  }

  private buildFeedbackSummary(aggregate: Record<string, unknown>): string {
    const advice = aggregate.summary_advice;
    if (Array.isArray(advice) && advice.length > 0) {
      return advice.slice(0, 3).join(" ");
    }
    const register = aggregate.dominant_register;
    if (typeof register === "string") {
      return `Registre dominant: ${register}.`;
    }
    return "Analyse verbale disponible.";
  }
}
