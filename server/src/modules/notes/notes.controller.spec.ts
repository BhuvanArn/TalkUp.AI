import { Test, TestingModule } from "@nestjs/testing";

import { applyMockAccessTokenGuard } from "@src/test/utils/mock-guards";

import { NotesController } from "./notes.controller";
import { NotesService } from "./notes.service";

describe("NotesController", () => {
  let controller: NotesController;
  let service: jest.Mocked<NotesService>;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const moduleBuilder = Test.createTestingModule({
      controllers: [NotesController],
      providers: [{ provide: NotesService, useValue: mockService }],
    });

    // override the real guard so JwtService and DB repos are not required in unit tests
    const module: TestingModule =
      await applyMockAccessTokenGuard(moduleBuilder).compile();

    controller = module.get<NotesController>(NotesController);
    service = module.get(NotesService);
  });

  it("is defined", () => {
    expect(controller).toBeDefined();
  });

  it("create delegates to service with userId and body", async () => {
    const body = { title: "x" } as any;
    service.create.mockResolvedValue({ note_id: "n1" } as any);
    const result = await controller.create("user-1", body);
    expect(service.create).toHaveBeenCalledWith("user-1", body);
    expect(result).toEqual({ note_id: "n1" });
  });

  it("list delegates to service with userId and query", async () => {
    const query = { interviewId: "int-1" } as any;
    service.findAll.mockResolvedValue([]);
    await controller.list("user-1", query);
    expect(service.findAll).toHaveBeenCalledWith("user-1", query);
  });

  it("getOne delegates to service with userId and id", async () => {
    service.findOne.mockResolvedValue({ note_id: "n1" } as any);
    await controller.getOne("user-1", "n1");
    expect(service.findOne).toHaveBeenCalledWith("user-1", "n1");
  });

  it("update delegates to service with userId, id and body", async () => {
    const body = { title: "y" } as any;
    service.update.mockResolvedValue({ note_id: "n1" } as any);
    await controller.update("user-1", "n1", body);
    expect(service.update).toHaveBeenCalledWith("user-1", "n1", body);
  });

  it("remove delegates to service with userId and id", async () => {
    service.remove.mockResolvedValue(true);
    await controller.remove("user-1", "n1");
    expect(service.remove).toHaveBeenCalledWith("user-1", "n1");
  });
});
