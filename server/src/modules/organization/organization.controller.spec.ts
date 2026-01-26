import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";

import { OrganizationController } from "./organization.controller";
import { OrganizationService } from "./organization.service";

describe("OrganizationController", () => {
  let controller: OrganizationController;
  let service: Partial<OrganizationService>;

  beforeEach(async () => {
    service = {
      registerOrganization: jest.fn(),
      deleteOrganization: jest.fn(),
      updateOrganization: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationController],
      providers: [{ provide: OrganizationService, useValue: service }],
    }).compile();

    controller = module.get<OrganizationController>(OrganizationController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should call service.registerOrganization and return result", async () => {
      const dto = {
        OrganizationName: "TestOrg",
        OrganizationEmail: "admin@test.com",
      };

      const serviceResponse = { message: "Creation successful" };
      (service.registerOrganization as jest.Mock).mockResolvedValue(
        serviceResponse,
      );

      const result = await controller.register(dto as any);

      expect(service.registerOrganization).toHaveBeenCalledWith(dto);
      expect(result).toBe(serviceResponse);
    });
  });

  describe("deleteOrganization", () => {
    it("should throw BadRequestException if name missing", async () => {
      await expect(controller.deleteOrganization("" as any)).rejects.toThrow(
        new BadRequestException("Organization name is required"),
      );

      expect(service.deleteOrganization).not.toHaveBeenCalled();
    });

    it("should call service.deleteOrganization when name provided", async () => {
      (service.deleteOrganization as jest.Mock).mockResolvedValue(undefined);

      await controller.deleteOrganization("TestOrg");

      expect(service.deleteOrganization).toHaveBeenCalledWith("TestOrg");
    });
  });

  describe("updateOrganization", () => {
    it("should throw if currentName missing", async () => {
      await expect(
        controller.updateOrganization({
          currentName: "",
          newName: "NewName",
        }),
      ).rejects.toThrow(
        new BadRequestException(
          "Current name and at least one field to update are required.",
        ),
      );

      expect(service.updateOrganization).not.toHaveBeenCalled();
    });

    it("should throw if no fields to update", async () => {
      await expect(
        controller.updateOrganization({
          currentName: "TestOrg",
        } as any),
      ).rejects.toThrow(
        new BadRequestException(
          "Current name and at least one field to update are required.",
        ),
      );

      expect(service.updateOrganization).not.toHaveBeenCalled();
    });

    it("should call service.updateOrganization with newName only", async () => {
      await controller.updateOrganization({
        currentName: "TestOrg",
        newName: "NewName",
      });

      expect(service.updateOrganization).toHaveBeenCalledWith("TestOrg", {
        newName: "NewName",
        newProfilePicture: undefined,
      });
    });

    it("should call service.updateOrganization with newProfilePicture only", async () => {
      await controller.updateOrganization({
        currentName: "TestOrg",
        newProfilePicture: "pic.png",
      });

      expect(service.updateOrganization).toHaveBeenCalledWith("TestOrg", {
        newName: undefined,
        newProfilePicture: "pic.png",
      });
    });

    it("should call service.updateOrganization with both fields", async () => {
      await controller.updateOrganization({
        currentName: "TestOrg",
        newName: "NewName",
        newProfilePicture: "pic.png",
      });

      expect(service.updateOrganization).toHaveBeenCalledWith("TestOrg", {
        newName: "NewName",
        newProfilePicture: "pic.png",
      });
    });
  });
});
