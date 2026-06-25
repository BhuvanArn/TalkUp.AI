import { Test, TestingModule } from "@nestjs/testing";

import { SimulationInternalController } from "./simulation-internal.controller";
import { SimulationContextService } from "./simulation-context.service";

describe("SimulationInternalController", () => {
  let controller: SimulationInternalController;
  let context: { getContextForSts: jest.Mock; appendTurn: jest.Mock };

  beforeEach(async () => {
    context = {
      getContextForSts: jest.fn(),
      appendTurn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SimulationInternalController],
      providers: [{ provide: SimulationContextService, useValue: context }],
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
});
