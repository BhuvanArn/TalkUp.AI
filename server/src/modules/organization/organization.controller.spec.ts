import { Test, TestingModule } from "@nestjs/testing";

import { OrganizationController } from "./organization.controller";
import { OrganizationService } from "./organization.service";
import { OrganizationProvisioningGuard } from "@common/guards/organizationProvisioning.guard";
import applyMockAccessTokenGuard from "@src/test/utils/mock-guards";

import { user } from "@entities/user.entity";

describe("OrganizationController", () => {
  let controller: OrganizationController;
  let service: Partial<OrganizationService>;

  const mockUser = {
    user_id: "u1",
    username: "admin",
    user_role: "admin",
  } as user;

  beforeEach(async () => {
    service = {
      registerOrganization: jest.fn(),
      deleteOrganization: jest.fn(),
      updateOrganization: jest.fn(),
      getMyOrganizationForUser: jest.fn(),
      createOrganizationMember: jest.fn(),
      removeOrganizationMember: jest.fn(),
      createInvite: jest.fn(),
      listInvites: jest.fn(),
      revokeInvite: jest.fn(),
    };

    const module: TestingModule = await applyMockAccessTokenGuard(
      Test.createTestingModule({
        controllers: [OrganizationController],
        providers: [{ provide: OrganizationService, useValue: service }],
      }),
    )
      .overrideGuard(OrganizationProvisioningGuard)
      .useValue({ canActivate: () => true })
      .compile();

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
    it("should call service.deleteOrganization with id and user", async () => {
      (service.deleteOrganization as jest.Mock).mockResolvedValue(undefined);

      await controller.deleteOrganization("org-id", mockUser);

      expect(service.deleteOrganization).toHaveBeenCalledWith(
        "org-id",
        mockUser,
      );
    });
  });

  describe("updateOrganization", () => {
    it("should call service.updateOrganization with name only", async () => {
      await controller.updateOrganization("org-id", mockUser, {
        OrganizationName: "NewName",
      });

      expect(service.updateOrganization).toHaveBeenCalledWith(
        "org-id",
        mockUser,
        {
          OrganizationName: "NewName",
        },
      );
    });

    it("should call service.updateOrganization with both fields", async () => {
      await controller.updateOrganization("org-id", mockUser, {
        OrganizationName: "NewName",
        OrganizationProfilePicture: "pic.png",
      });

      expect(service.updateOrganization).toHaveBeenCalledWith(
        "org-id",
        mockUser,
        {
          OrganizationName: "NewName",
          OrganizationProfilePicture: "pic.png",
        },
      );
    });
  });

  describe("getMyOrganization", () => {
    it("should call getMyOrganizationForUser", async () => {
      const payload = { organization_id: "org-id" };
      (service.getMyOrganizationForUser as jest.Mock).mockResolvedValue(
        payload,
      );

      const result = await controller.getMyOrganization(mockUser);

      expect(service.getMyOrganizationForUser).toHaveBeenCalledWith(mockUser);
      expect(result).toBe(payload);
    });
  });

  describe("removeMember", () => {
    it("should call removeOrganizationMember", async () => {
      const out = { message: "Member removed from the organization" };
      (service.removeOrganizationMember as jest.Mock).mockResolvedValue(out);

      const result = await controller.removeMember(
        "org-id",
        "member-id",
        mockUser,
      );

      expect(service.removeOrganizationMember).toHaveBeenCalledWith(
        "org-id",
        "member-id",
        mockUser,
      );
      expect(result).toBe(out);
    });
  });

  describe("createMember", () => {
    it("should call createOrganizationMember", async () => {
      const body = {
        username: "new",
        email: "n@test.com",
        role: "user" as const,
      };
      const out = { message: "Member created" };
      (service.createOrganizationMember as jest.Mock).mockResolvedValue(out);

      const result = await controller.createMember("org-id", body, mockUser);

      expect(service.createOrganizationMember).toHaveBeenCalledWith(
        "org-id",
        body,
        mockUser,
      );
      expect(result).toBe(out);
    });
  });

  describe("invites", () => {
    it("POST :id/invites delegates to service", async () => {
      const dto = { email: "a@b.co", role: "user" as const };
      (service.createInvite as jest.Mock).mockResolvedValue({ code: "X" });

      await expect(
        controller.createInvite("org-id", dto, mockUser),
      ).resolves.toEqual({ code: "X" });
      expect(service.createInvite).toHaveBeenCalledWith(
        "org-id",
        dto,
        mockUser,
      );
    });

    it("GET :id/invites delegates to service", async () => {
      (service.listInvites as jest.Mock).mockResolvedValue([]);

      await expect(controller.listInvites("org-id", mockUser)).resolves.toEqual(
        [],
      );
      expect(service.listInvites).toHaveBeenCalledWith("org-id", mockUser);
    });

    it("DELETE :id/invites/:inviteId delegates to service", async () => {
      (service.revokeInvite as jest.Mock).mockResolvedValue({
        message: "Invite revoked",
      });

      await expect(
        controller.revokeInvite("org-id", "invite-id", mockUser),
      ).resolves.toEqual({ message: "Invite revoked" });
      expect(service.revokeInvite).toHaveBeenCalledWith(
        "org-id",
        "invite-id",
        mockUser,
      );
    });
  });
});
