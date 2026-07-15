import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import {
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";

import { AgendaService } from "./agenda.service";
import { agenda_event } from "@entities/agenda.entity";

describe("AgendaService", () => {
  let service: AgendaService;
  let mockRepo: any;

  const mockEvent = {
    event_id: "evt-1",
    user_id: "user-1",
    title: "Meeting",
    description: "Discuss",
    start_at: new Date("2025-01-01T10:00:00.000Z"),
    end_at: new Date("2025-01-01T11:00:00.000Z"),
  } as agenda_event;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockReturnValue(mockEvent),
      save: jest.fn().mockResolvedValue(mockEvent),
      findOne: jest.fn(),
      remove: jest.fn().mockResolvedValue(undefined),
      find: jest.fn().mockResolvedValue([mockEvent]),
    } as Partial<Repository<agenda_event>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgendaService,
        {
          provide: getRepositoryToken(agenda_event),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<AgendaService>(AgendaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create and save an event", async () => {
      const payload = {
        title: "Meeting",
        start_at: new Date("2025-01-01T10:00:00.000Z"),
        end_at: new Date("2025-01-01T11:00:00.000Z"),
      } as any;

      (mockRepo.create as jest.Mock).mockReturnValue(payload);
      (mockRepo.save as jest.Mock).mockResolvedValue({
        ...payload,
        event_id: "evt-1",
      });

      const result = await service.create("user-1", payload);

      expect(mockRepo.create).toHaveBeenCalledWith({
        ...payload,
        user_id: "user-1",
      });
      expect(mockRepo.save).toHaveBeenCalledWith(payload);
      expect(result).toEqual({ ...payload, event_id: "evt-1" });
    });

    it("should log and throw on error", async () => {
      const payload = {
        title: "Meeting",
        start_at: new Date("2025-01-01T10:00:00.000Z"),
        end_at: new Date("2025-01-01T11:00:00.000Z"),
      } as any;

      mockRepo.create.mockReturnValue(payload);
      mockRepo.save.mockRejectedValueOnce(new Error("DB error"));

      await expect(service.create("user-1", payload)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it("should throw BadRequestException if end_at is before start_at", async () => {
      const payload = {
        title: "Invalid Meeting",
        start_at: new Date("2025-01-01T12:00:00.000Z"),
        end_at: new Date("2025-01-01T11:00:00.000Z"),
      } as any;

      await expect(service.create("user-1", payload)).rejects.toThrow(
        "End time cannot be before start time.",
      );
    });
  });

  describe("findOne", () => {
    it("should return an event when found", async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(mockEvent);

      const result = await service.findOne("user-1", "evt-1");

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { user_id: "user-1", event_id: "evt-1" },
      });
      expect(result).toEqual(mockEvent);
    });

    it("should throw NotFoundException when not found", async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne("user-1", "nope")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should log and throw on error", async () => {
      mockRepo.findOne.mockRejectedValueOnce(new Error("DB error"));

      await expect(service.findOne("user-1", "evt-1")).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe("update", () => {
    it("should update and save when event exists", async () => {
      const updated = { ...mockEvent, title: "Updated" } as agenda_event;
      (mockRepo.findOne as jest.Mock).mockResolvedValue(mockEvent);
      (mockRepo.save as jest.Mock).mockResolvedValue(updated);

      const result = await service.update("user-1", "evt-1", {
        title: "Updated",
      } as any);

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { user_id: "user-1", event_id: "evt-1" },
      });
      expect(mockRepo.save).toHaveBeenCalledWith(updated);
      expect(result).toEqual(updated);
    });

    it("should throw NotFoundException when event missing", async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update("user-1", "nope", { title: "x" } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if end_at is before start_at", async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(mockEvent);

      await expect(
        service.update("user-1", "evt-1", {
          start_at: new Date("2025-01-01T12:00:00.000Z"),
          end_at: new Date("2025-01-01T11:00:00.000Z"),
        } as any),
      ).rejects.toThrow("End time cannot be before start time.");
    });

    it("should log and throw on error", async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(mockEvent);
      mockRepo.save.mockRejectedValueOnce(new Error("DB error"));

      await expect(
        service.update("user-1", "evt-1", { title: "Updated" } as any),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("remove", () => {
    it("should remove and return true when exists", async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(mockEvent);
      (mockRepo.remove as jest.Mock).mockResolvedValue(undefined);

      const result = await service.remove("user-1", "evt-1");

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { user_id: "user-1", event_id: "evt-1" },
      });
      expect(mockRepo.remove).toHaveBeenCalledWith(mockEvent);
      expect(result).toBe(true);
    });

    it("should throw NotFoundException when event missing", async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.remove("user-1", "nope")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should log and throw on error", async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(mockEvent);
      mockRepo.remove.mockRejectedValueOnce(new Error("DB error"));

      await expect(service.remove("user-1", "evt-1")).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe("listForRange", () => {
    it("should call repo.find and return events", async () => {
      const from = new Date("2025-01-01T00:00:00.000Z");
      const to = new Date("2025-01-08T00:00:00.000Z");
      (mockRepo.find as jest.Mock).mockResolvedValue([mockEvent]);

      const result = await service.listForRange("user-1", from, to);

      expect(mockRepo.find).toHaveBeenCalled();
      expect(result).toEqual([mockEvent]);
    });

    it("matches open-ended events, scoped to the caller", async () => {
      const from = new Date("2025-01-01T00:00:00.000Z");
      const to = new Date("2025-01-08T00:00:00.000Z");
      (mockRepo.find as jest.Mock).mockResolvedValue([]);

      await service.listForRange("user-1", from, to);

      // `end_at` is nullable and `NULL >= from` is never true in SQL, so an
      // event with no end time needs its own branch or it silently vanishes
      // from every range.
      const where = (mockRepo.find as jest.Mock).mock.calls[0][0].where;
      expect(Array.isArray(where)).toBe(true);
      expect(where).toHaveLength(2);
      expect(where[1]).toMatchObject({
        user_id: "user-1",
        end_at: IsNull(),
      });
      expect(
        where.every((w: { user_id: string }) => w.user_id === "user-1"),
      ).toBe(true);
    });

    it("should log and throw on error", async () => {
      const from = new Date("2025-01-01T00:00:00.000Z");
      const to = new Date("2025-01-08T00:00:00.000Z");

      mockRepo.find.mockRejectedValueOnce(new Error("DB error"));

      await expect(service.listForRange("user-1", from, to)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
