import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { IsNull } from "typeorm";
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";

import { NotesService } from "./notes.service";
import { note } from "@entities/note.entity";
import { ai_interview } from "@entities/aiInterview.entity";
import { application } from "@entities/application.entity";

describe("NotesService", () => {
  let service: NotesService;
  let noteRepo: any;
  let interviewRepo: any;
  let applicationRepo: any;

  const baseNote = {
    note_id: "note-1",
    user_id: "user-1",
    interview_id: null,
    application_id: null,
    title: "My note",
    content: "<p>hi</p>",
    color: "blue",
    is_favorite: false,
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_at: new Date("2026-01-01T00:00:00.000Z"),
  } as note;

  beforeEach(async () => {
    noteRepo = {
      create: jest.fn((v) => v),
      save: jest.fn().mockImplementation((v) => Promise.resolve(v)),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([baseNote]),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    interviewRepo = {
      findOne: jest.fn(),
    };
    applicationRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        { provide: getRepositoryToken(note), useValue: noteRepo },
        { provide: getRepositoryToken(ai_interview), useValue: interviewRepo },
        {
          provide: getRepositoryToken(application),
          useValue: applicationRepo,
        },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("creates a standalone note (no interviewId)", async () => {
      noteRepo.save.mockResolvedValue({ ...baseNote });
      const result = await service.create("user-1", {
        title: "My note",
        content: "<p>hi</p>",
      });
      expect(interviewRepo.findOne).not.toHaveBeenCalled();
      expect(result.interview_id).toBeNull();
      expect(result.content).toBe("<p>hi</p>");
    });

    it("creates an in-sim note when the interview is owned", async () => {
      interviewRepo.findOne.mockResolvedValue({
        interview_id: "int-1",
        user_id: "user-1",
        application_id: null,
      });
      noteRepo.save.mockResolvedValue({
        ...baseNote,
        interview_id: "int-1",
      });
      const result = await service.create("user-1", {
        title: "My note",
        interviewId: "int-1",
      });
      // user_id is a relation-only property on ai_interview; the lookup MUST
      // request loadRelationIds or interview.user_id comes back undefined at
      // runtime and every owned in-sim note create wrongly 403s.
      expect(interviewRepo.findOne).toHaveBeenCalledWith({
        where: { interview_id: "int-1" },
        loadRelationIds: { relations: ["user_id"] },
      });
      expect(result.interview_id).toBe("int-1");
    });

    it("denormalizes the interview's application onto an in-sim note", async () => {
      // A simulation runs against an application; its note must carry that
      // application so a ?applicationId= filter later catches it without a join.
      interviewRepo.findOne.mockResolvedValue({
        interview_id: "int-1",
        user_id: "user-1",
        application_id: "app-1",
      });
      noteRepo.save.mockImplementation((v: any) => Promise.resolve(v));
      const result = await service.create("user-1", {
        title: "Sim note",
        interviewId: "int-1",
      });
      expect(noteRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          interview_id: "int-1",
          application_id: "app-1",
        }),
      );
      expect(result.application_id).toBe("app-1");
    });

    it("throws NotFound when the interview does not exist", async () => {
      interviewRepo.findOne.mockResolvedValue(null);
      await expect(
        service.create("user-1", { title: "x", interviewId: "int-x" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws Forbidden when the interview belongs to another user", async () => {
      interviewRepo.findOne.mockResolvedValue({
        interview_id: "int-1",
        user_id: "other-user",
      });
      await expect(
        service.create("user-1", { title: "x", interviewId: "int-1" }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("creates an application-scoped note when the application is owned", async () => {
      applicationRepo.findOne.mockResolvedValue({
        application_id: "app-1",
        user_id: "user-1",
      });
      noteRepo.save.mockImplementation((v: any) => Promise.resolve(v));
      const result = await service.create("user-1", {
        title: "App note",
        applicationId: "app-1",
      });
      expect(applicationRepo.findOne).toHaveBeenCalledWith({
        where: { application_id: "app-1" },
        loadRelationIds: { relations: ["user_id"] },
      });
      expect(interviewRepo.findOne).not.toHaveBeenCalled();
      expect(result.application_id).toBe("app-1");
      expect(result.interview_id).toBeNull();
    });

    it("throws NotFound when the application does not exist", async () => {
      applicationRepo.findOne.mockResolvedValue(null);
      await expect(
        service.create("user-1", { title: "x", applicationId: "app-x" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws Forbidden when the application belongs to another user", async () => {
      applicationRepo.findOne.mockResolvedValue({
        application_id: "app-1",
        user_id: "other-user",
      });
      await expect(
        service.create("user-1", { title: "x", applicationId: "app-1" }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("rejects a create that sets both interviewId and applicationId", async () => {
      await expect(
        service.create("user-1", {
          title: "x",
          interviewId: "int-1",
          applicationId: "app-1",
        }),
      ).rejects.toThrow(BadRequestException);
      expect(noteRepo.save).not.toHaveBeenCalled();
    });

    it("coalesces null content to empty string in the response", async () => {
      noteRepo.save.mockResolvedValue({ ...baseNote, content: null });
      const result = await service.create("user-1", { title: "x" });
      expect(result.content).toBe("");
    });

    it("wraps unexpected save errors in InternalServerError", async () => {
      noteRepo.save.mockRejectedValueOnce(new Error("DB down"));
      await expect(service.create("user-1", { title: "x" })).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe("findAll", () => {
    it("returns all user notes ordered updated_at DESC when no filter", async () => {
      await service.findAll("user-1", {});
      expect(noteRepo.find).toHaveBeenCalledWith({
        where: { user_id: "user-1" },
        order: { updated_at: "DESC" },
      });
    });

    it("filters by interviewId", async () => {
      await service.findAll("user-1", { interviewId: "int-1" });
      expect(noteRepo.find).toHaveBeenCalledWith({
        where: { user_id: "user-1", interview_id: "int-1" },
        order: { updated_at: "DESC" },
      });
    });

    it("filters by applicationId (application-scoped and in-sim notes)", async () => {
      await service.findAll("user-1", { applicationId: "app-1" });
      expect(noteRepo.find).toHaveBeenCalledWith({
        where: { user_id: "user-1", application_id: "app-1" },
        order: { updated_at: "DESC" },
      });
    });

    it("filters general notes (both interview_id and application_id null)", async () => {
      await service.findAll("user-1", { standalone: true });
      expect(noteRepo.find).toHaveBeenCalledWith({
        where: {
          user_id: "user-1",
          interview_id: IsNull(),
          application_id: IsNull(),
        },
        order: { updated_at: "DESC" },
      });
    });

    it("does not filter to standalone when standalone is false", async () => {
      await service.findAll("user-1", { standalone: false });
      expect(noteRepo.find).toHaveBeenCalledWith({
        where: { user_id: "user-1" },
        order: { updated_at: "DESC" },
      });
    });

    it("throws BadRequest when both interviewId and standalone are present", async () => {
      await expect(
        service.findAll("user-1", { interviewId: "int-1", standalone: false }),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws BadRequest when interviewId and applicationId are both present", async () => {
      await expect(
        service.findAll("user-1", {
          interviewId: "int-1",
          applicationId: "app-1",
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("wraps unexpected find errors in InternalServerError", async () => {
      noteRepo.find.mockRejectedValueOnce(new Error("DB down"));
      await expect(service.findAll("user-1", {})).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe("findOne", () => {
    it("returns the note when owned", async () => {
      noteRepo.findOne.mockResolvedValue(baseNote);
      const result = await service.findOne("user-1", "note-1");
      expect(noteRepo.findOne).toHaveBeenCalledWith({
        where: { user_id: "user-1", note_id: "note-1" },
      });
      expect(result.note_id).toBe("note-1");
    });

    it("throws NotFound when the note is not the caller's", async () => {
      noteRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne("user-1", "note-x")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    it("updates and returns the note when owned", async () => {
      noteRepo.findOne.mockResolvedValue({ ...baseNote });
      noteRepo.save.mockImplementation((v: any) => Promise.resolve(v));
      const result = await service.update("user-1", "note-1", {
        title: "Renamed",
      });
      expect(result.title).toBe("Renamed");
    });

    it("throws NotFound when updating a note that is not the caller's", async () => {
      noteRepo.findOne.mockResolvedValue(null);
      await expect(
        service.update("user-1", "note-x", { title: "x" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("coalesces null content to empty string in the response", async () => {
      noteRepo.findOne.mockResolvedValue({ ...baseNote, content: null });
      noteRepo.save.mockImplementation((v: any) => Promise.resolve(v));
      const result = await service.update("user-1", "note-1", {});
      expect(result.content).toBe("");
    });

    it("wraps unexpected save errors in InternalServerError", async () => {
      noteRepo.findOne.mockResolvedValue({ ...baseNote });
      noteRepo.save.mockRejectedValueOnce(new Error("DB down"));
      await expect(
        service.update("user-1", "note-1", { title: "x" }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("remove", () => {
    it("removes and returns true when owned", async () => {
      noteRepo.findOne.mockResolvedValue(baseNote);
      const result = await service.remove("user-1", "note-1");
      expect(noteRepo.remove).toHaveBeenCalledWith(baseNote);
      expect(result).toBe(true);
    });

    it("throws NotFound when removing a note that is not the caller's", async () => {
      noteRepo.findOne.mockResolvedValue(null);
      await expect(service.remove("user-1", "note-x")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("wraps unexpected remove errors in InternalServerError", async () => {
      noteRepo.findOne.mockResolvedValue(baseNote);
      noteRepo.remove.mockRejectedValueOnce(new Error("DB down"));
      await expect(service.remove("user-1", "note-1")).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
