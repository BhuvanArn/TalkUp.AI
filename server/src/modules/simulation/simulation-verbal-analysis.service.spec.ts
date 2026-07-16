import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ai_verbal_analysis } from "@entities/aiVerbalAnalysis.entity";
import { ai_interview } from "@entities/aiInterview.entity";
import { SimulationVerbalAnalysisService } from "./simulation-verbal-analysis.service";

describe("SimulationVerbalAnalysisService", () => {
  let service: SimulationVerbalAnalysisService;
  let analysisRepo: jest.Mocked<Repository<ai_verbal_analysis>>;
  let interviewRepo: jest.Mocked<Repository<ai_interview>>;

  beforeEach(async () => {
    analysisRepo = {
      findOne: jest.fn(),
      create: jest.fn((dto) => dto as ai_verbal_analysis),
      save: jest.fn(async (entity) => entity as ai_verbal_analysis),
    } as unknown as jest.Mocked<Repository<ai_verbal_analysis>>;

    interviewRepo = {
      findOne: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<Repository<ai_interview>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationVerbalAnalysisService,
        {
          provide: getRepositoryToken(ai_verbal_analysis),
          useValue: analysisRepo,
        },
        {
          provide: getRepositoryToken(ai_interview),
          useValue: interviewRepo,
        },
      ],
    }).compile();

    service = module.get(SimulationVerbalAnalysisService);
  });

  it("creates a new verbal analysis record", async () => {
    analysisRepo.findOne.mockResolvedValue(null);

    const result = await service.saveForInterview("int-1", {
      aggregate: {
        avg_overall_score: 72,
        summary_advice: ["Bon registre."],
      },
      turns: [{ transcription: "Bonjour" }],
    });

    expect(analysisRepo.create).toHaveBeenCalled();
    expect(analysisRepo.save).toHaveBeenCalled();
    expect(interviewRepo.update).toHaveBeenCalledWith(
      { interview_id: "int-1" },
      expect.objectContaining({ score: 72 }),
    );
    expect(result.overall_score).toBe(72);
  });

  it("returns analysis for owned interview", async () => {
    interviewRepo.findOne.mockResolvedValue({
      interview_id: "int-1",
      user_id: "user-1",
    } as ai_interview);
    analysisRepo.findOne.mockResolvedValue({
      interview_id: "int-1",
      overall_score: 80,
    } as ai_verbal_analysis);

    const result = await service.getForInterview("int-1", "user-1");
    expect(result?.overall_score).toBe(80);
  });

  it("returns null when interview does not belong to user", async () => {
    interviewRepo.findOne.mockResolvedValue(null);

    const result = await service.getForInterview("int-1", "user-2");
    expect(result).toBeNull();
  });
});
