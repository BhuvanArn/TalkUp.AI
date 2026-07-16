import { Test, TestingModule } from "@nestjs/testing";

import { SimulationInternalController } from "./simulation-internal.controller";
import { SimulationContextService } from "./simulation-context.service";
import { SimulationVerbalAnalysisService } from "./simulation-verbal-analysis.service";

describe("SimulationInternalController", () => {
  let controller: SimulationInternalController;
  let context: {
    getContextForSts: jest.Mock;
    appendTurn: jest.Mock;
    appendAssistantTurn: jest.Mock;
  };
  let verbalAnalysis: {
    saveForInterview: jest.Mock;
    getForInterview: jest.Mock;
  };

  beforeEach(async () => {
    context = {
      getContextForSts: jest.fn(),
      appendTurn: jest.fn(),
      appendAssistantTurn: jest.fn(),
    };

    verbalAnalysis = {
      saveForInterview: jest.fn(),
      getForInterview: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SimulationInternalController],
      providers: [
        { provide: SimulationContextService, useValue: context },
        {
          provide: SimulationVerbalAnalysisService,
          useValue: verbalAnalysis,
        },
      ],
    }).compile();

    controller = module.get(SimulationInternalController);
  });

  it("returns the session context for an interview", async () => {
    const ctx = {
      interviewId: "int-1",
      userId: "user-1",
      systemPrompt: "SYSTEM",
      history: [],
    };
    context.getContextForSts.mockResolvedValueOnce(ctx);

    await expect(controller.getSessionContext("int-1")).resolves.toBe(ctx);
    expect(context.getContextForSts).toHaveBeenCalledWith("int-1");
  });

  it("appends a history turn from the DTO", async () => {
    context.appendTurn.mockResolvedValueOnce(undefined);

    await controller.appendHistory("int-1", {
      userText: "hello",
      assistantText: "hi",
    });

    expect(context.appendTurn).toHaveBeenCalledWith("int-1", "hello", "hi");
  });

  it("appends a standalone assistant turn from the DTO", async () => {
    context.appendAssistantTurn.mockResolvedValueOnce(undefined);

    await controller.appendAssistantTurn("int-1", {
      assistantText: "Bonjour et bienvenue",
    });

    expect(context.appendAssistantTurn).toHaveBeenCalledWith(
      "int-1",
      "Bonjour et bienvenue",
    );
  });
});
