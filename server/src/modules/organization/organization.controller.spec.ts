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
    it("should call service.deleteOrganization with id", async () => {
      (service.deleteOrganization as jest.Mock).mockResolvedValue(undefined);

      await controller.deleteOrganization("org-id");

      expect(service.deleteOrganization).toHaveBeenCalledWith("org-id");
    });
  });

  describe("updateOrganization", () => {
    it("should throw if no fields to update", async () => {
      await expect(
        controller.updateOrganization("org-id", {}),
      ).rejects.toThrow(
        new BadRequestException(
          "At least one field to update are required.",
        ),
      );

      expect(service.updateOrganization).not.toHaveBeenCalled();
    });

    it("should call service.updateOrganization with newName only", async () => {
      await controller.updateOrganization("org-id", {
        newName: "NewName",
      });

      expect(service.updateOrganization).toHaveBeenCalledWith("org-id", {
        newName: "NewName",
        newProfilePicture: undefined,
      });
    });

    it("should call service.updateOrganization with newProfilePicture only", async () => {
      await controller.updateOrganization("org-id", {
        newProfilePicture: "pic.png",
      });

      expect(service.updateOrganization).toHaveBeenCalledWith("org-id", {
        newName: undefined,
        newProfilePicture: "pic.png",
      });
    });

    it("should call service.updateOrganization with both fields", async () => {
      await controller.updateOrganization("org-id", {
        newName: "NewName",
        newProfilePicture: "pic.png",
      });

      expect(service.updateOrganization).toHaveBeenCalledWith("org-id", {
        newName: "NewName",
        newProfilePicture: "pic.png",
      });
    });
  });
});
