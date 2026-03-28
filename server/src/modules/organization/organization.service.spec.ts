import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConflictException, NotFoundException } from "@nestjs/common";

import { OrganizationService } from "./organization.service";
import { Organization } from "@entities/organization.entity";
import { AuthService } from "../auth/auth.service";

describe("OrganizationService", () => {
  let service: OrganizationService;
  let repo: Partial<Repository<Organization>>;
  let authService: Partial<AuthService>;

  const mockOrganization: Organization = {
    organization_id: "org-id",
    organization_name: "TestOrg",
    profile_picture: "",
    created_at: new Date(),
    updated_at: new Date(),
  } as Organization;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    authService = {
      register: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        {
          provide: getRepositoryToken(Organization),
          useValue: repo,
        },
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    service = module.get(OrganizationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("registerOrganization", () => {
    const dto = {
      OrganizationName: "TestOrg",
      OrganizationEmail: "admin@test.com",
    };

    it("should create organization and admin user", async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      (repo.create as jest.Mock).mockReturnValue(mockOrganization);
      (repo.save as jest.Mock).mockResolvedValue(mockOrganization);
      (authService.register as jest.Mock).mockResolvedValue({});

      const result = await service.registerOrganization(dto as any);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { organization_name: dto.OrganizationName },
      });

      expect(repo.create).toHaveBeenCalledWith({
        organization_name: dto.OrganizationName,
      });

      expect(authService.register).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "TestOrg_admin",
          email: "admin@test.com",
          user_role: "admin",
          organization_id: "org-id",
        }),
      );

      const registerArg = (authService.register as jest.Mock).mock.calls[0][0];
      expect(registerArg.password).toMatch(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
      );
      expect(registerArg.password.length).toBeGreaterThanOrEqual(20);

      expect(result.message).toBe("Creation successful");
      expect(result.adminUser).toEqual({
        username: "TestOrg_admin",
        email: "admin@test.com",
        password: registerArg.password,
      });
    });

    it("should throw if organization name already exists", async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockOrganization);

      await expect(service.registerOrganization(dto as any)).rejects.toThrow(
        new ConflictException("An organization with this name already exists"),
      );

      expect(repo.create).not.toHaveBeenCalled();
      expect(authService.register).not.toHaveBeenCalled();
    });
  });

  describe("deleteOrganization", () => {
    it("should delete organization if exists", async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(mockOrganization);
      (repo.remove as jest.Mock).mockResolvedValue(undefined);

      await service.deleteOrganization("org-id");

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { organization_id: "org-id" },
      });
      expect(repo.remove).toHaveBeenCalledWith(mockOrganization);
    });

    it("should throw if organization does not exist", async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteOrganization("unknown-id")).rejects.toThrow(
        new NotFoundException("Organization not found."),
      );

      expect(repo.remove).not.toHaveBeenCalled();
    });
  });

  describe("updateOrganization", () => {
    it("should update name and profile picture", async () => {
      const org = { ...mockOrganization };

      (repo.findOne as jest.Mock).mockResolvedValue(org);
      (repo.save as jest.Mock).mockResolvedValue(org);

      await service.updateOrganization("org-id", {
        newName: "NewName",
        newProfilePicture: "pic.png",
      });

      expect(org.organization_name).toBe("NewName");
      expect(org.profile_picture).toBe("pic.png");
      expect(repo.save).toHaveBeenCalledWith(org);
    });

    it("should update only name if provided", async () => {
      const org = { ...mockOrganization };

      (repo.findOne as jest.Mock).mockResolvedValue(org);

      await service.updateOrganization("org-id", {
        newName: "OnlyName",
      });

      expect(org.organization_name).toBe("OnlyName");
      expect(repo.save).toHaveBeenCalledWith(org);
    });

    it("should update only profile picture if provided", async () => {
      const org = { ...mockOrganization };

      (repo.findOne as jest.Mock).mockResolvedValue(org);

      await service.updateOrganization("org-id", {
        newProfilePicture: "onlypic.png",
      });

      expect(org.profile_picture).toBe("onlypic.png");
      expect(repo.save).toHaveBeenCalledWith(org);
    });

    it("should throw if organization not found", async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateOrganization("unknown-id", { newName: "X" }),
      ).rejects.toThrow(new NotFoundException("Organization not found."));

      expect(repo.save).not.toHaveBeenCalled();
    });
  });
});
