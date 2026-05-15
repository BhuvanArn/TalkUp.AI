import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { HttpService } from "@nestjs/axios";
import { Repository } from "typeorm";
import { InternalServerErrorException } from "@nestjs/common";
import { AxiosResponse } from "axios";

import { LinkedInService } from "./linkedin.service";
import {
  user,
  user_email,
  user_oauth,
  user_profile,
} from "@entities/user.entity";
import { LinkedInProfile, LinkedInTokenDatas } from "@common/utils/types";
import { AuthProvider } from "@common/enums/AuthProvider";

import { Logger } from "@nestjs/common";

describe("LinkedInService", () => {
  let service: LinkedInService;
  let mockUserRepo: Partial<Repository<user>>;
  let mockUserEmailRepo: Partial<Repository<user_email>>;
  let mockUserOauthRepo: Partial<Repository<user_oauth>>;
  let mockUserProfileRepo: Partial<Repository<user_profile>>;
  let mockJwtService: Partial<JwtService>;
  let mockHttpService: Partial<HttpService>;

  const mockTokenData: LinkedInTokenDatas = {
    access_token: "test-access-token",
    expires_in: "5184000",
    scope: "r_liteprofile r_emailaddress",
    refresh_token: "test-refresh-token",
    refresh_token_expires_in: "31536000",
  };

  const mockProfile: LinkedInProfile = {
    sub: "linkedin-user-id",
    email_verified: true,
    name: "John Doe",
    locale: { country: "US", language: "en" },
    given_name: "John",
    family_name: "Doe",
    email: "john.doe@example.com",
    picture: "https://example.com/profile.jpg",
  };

  const mockUser = {
    user_id: "test-user-id",
    username: "John Doe",
    provider: AuthProvider.LINKEDIN,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "debug").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "verbose").mockImplementation(() => undefined);
  });

  beforeEach(async () => {
    mockUserRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockUserEmailRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    mockUserOauthRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    mockUserProfileRepo = {
      create: jest.fn().mockReturnValue({ user_id: "test-user-id" }),
      save: jest.fn().mockResolvedValue({ user_id: "test-user-id" }),
    };

    mockJwtService = {
      signAsync: jest.fn(),
    };

    mockHttpService = {
      axiosRef: {
        post: jest.fn(),
        get: jest.fn(),
      } as unknown as import("axios").AxiosInstance,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkedInService,
        {
          provide: getRepositoryToken(user),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(user_email),
          useValue: mockUserEmailRepo,
        },
        {
          provide: getRepositoryToken(user_oauth),
          useValue: mockUserOauthRepo,
        },
        {
          provide: getRepositoryToken(user_profile),
          useValue: mockUserProfileRepo,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<LinkedInService>(LinkedInService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getAccessTokenDatasFromQueryCode", () => {
    it("should successfully get access token data", async () => {
      const mockResponse: AxiosResponse = {
        data: mockTokenData,
        status: 200,
        statusText: "OK",
        headers: {},
        config: { headers: {} as import("axios").AxiosHeaders },
      };

      const mockPost = jest.fn().mockResolvedValue(mockResponse);
      mockHttpService.axiosRef!.post = mockPost;

      const result =
        await service.getAccessTokenDatasFromQueryCode("test-code");

      expect(result).toEqual(mockTokenData);
      expect(mockPost).toHaveBeenCalledWith(
        "https://www.linkedin.com/oauth/v2/accessToken",
        expect.any(URLSearchParams),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        },
      );
    });

    it("should throw InternalServerErrorException on HTTP error", async () => {
      const httpError = new Error("Network error");
      mockHttpService.axiosRef!.post = jest.fn().mockRejectedValue(httpError);

      await expect(
        service.getAccessTokenDatasFromQueryCode("test-code"),
      ).rejects.toThrow(
        new InternalServerErrorException("Failed to fetch access token"),
      );
    });
  });

  describe("getLinkedInProfileFromAccessToken", () => {
    it("should successfully get LinkedIn profile", async () => {
      const mockResponse: AxiosResponse = {
        data: mockProfile,
        status: 200,
        statusText: "OK",
        headers: {},
        config: { headers: {} as import("axios").AxiosHeaders },
      };

      const mockGet = jest.fn().mockResolvedValue(mockResponse);
      mockHttpService.axiosRef!.get = mockGet;

      const result =
        await service.getLinkedInProfileFromAccessToken("test-token");

      expect(result).toEqual(mockProfile);
      expect(mockGet).toHaveBeenCalledWith(
        "https://api.linkedin.com/v2/userinfo",
        { headers: { Authorization: "Bearer test-token" } },
      );
    });

    it("should throw InternalServerErrorException on HTTP error", async () => {
      const httpError = new Error("Network error");
      mockHttpService.axiosRef!.get = jest.fn().mockRejectedValue(httpError);

      await expect(
        service.getLinkedInProfileFromAccessToken("test-token"),
      ).rejects.toThrow(
        new InternalServerErrorException("Failed to fetch LinkedIn profile"),
      );
    });
  });

  describe("saveTokenDataFromUser", () => {
    it("should save OAuth token data successfully", async () => {
      const mockOauthData = {
        user_id: "test-user-id",
        provider: AuthProvider.LINKEDIN,
        access_token: mockTokenData.access_token,
        expires_in: mockTokenData.expires_in,
        refresh_token: mockTokenData.refresh_token,
        refresh_token_expires_in: mockTokenData.refresh_token_expires_in,
        scope: mockTokenData.scope,
      };

      mockUserOauthRepo.create = jest.fn().mockReturnValue(mockOauthData);
      mockUserOauthRepo.save = jest.fn().mockResolvedValue(mockOauthData);

      await service.saveTokenDataFromUser("test-user-id", mockTokenData);

      expect(mockUserOauthRepo.create).toHaveBeenCalledWith(mockOauthData);
      expect(mockUserOauthRepo.save).toHaveBeenCalledWith(mockOauthData);
    });
  });

  describe("saveLinkedInUser", () => {
    it("should return existing user JWT when user already exists", async () => {
      mockUserRepo.findOne = jest.fn().mockResolvedValue(mockUser);
      mockJwtService.signAsync = jest
        .fn()
        .mockResolvedValue("existing-jwt-token");

      const result = await service.saveLinkedInUser(mockProfile, mockTokenData);

      expect(result).toEqual({ accessToken: "existing-jwt-token" });
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { username: "John Doe" },
      });
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        userId: "test-user-id",
        username: "John Doe",
      });
    });

    it("should create new user and return JWT when user doesn't exist", async () => {
      const newUser = { ...mockUser };
      const mockEmail = {
        email: mockProfile.email,
        is_verified: mockProfile.email_verified,
        user_id: newUser.user_id,
      };

      mockUserRepo.findOne = jest.fn().mockResolvedValue(null);
      mockUserRepo.create = jest.fn().mockReturnValue(newUser);
      mockUserRepo.save = jest.fn().mockResolvedValue(newUser);
      mockUserEmailRepo.create = jest.fn().mockReturnValue(mockEmail);
      mockUserEmailRepo.save = jest.fn().mockResolvedValue(mockEmail);
      mockUserOauthRepo.create = jest
        .fn()
        .mockReturnValue({} as Partial<user_oauth>);
      mockUserOauthRepo.save = jest
        .fn()
        .mockResolvedValue({} as Partial<user_oauth>);
      const mockProf = {
        user_id: newUser.user_id,
        profile_picture: mockProfile.picture,
      };
      mockUserProfileRepo.create = jest.fn().mockReturnValue(mockProf);
      mockUserProfileRepo.save = jest.fn().mockResolvedValue(mockProf);
      mockJwtService.signAsync = jest.fn().mockResolvedValue("new-jwt-token");

      const result = await service.saveLinkedInUser(mockProfile, mockTokenData);

      expect(result).toEqual({ accessToken: "new-jwt-token" });
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        username: "John Doe",
        provider: AuthProvider.LINKEDIN,
      });
      expect(mockUserRepo.save).toHaveBeenCalledWith(newUser);
      expect(mockUserProfileRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: newUser.user_id,
          profile_picture: "https://example.com/profile.jpg",
        }),
      );
      expect(mockUserProfileRepo.save).toHaveBeenCalledWith(mockProf);
      expect(mockUserEmailRepo.create).toHaveBeenCalledWith(mockEmail);
      expect(mockUserEmailRepo.save).toHaveBeenCalledWith(mockEmail);
    });
    it("should handle OAuth save error gracefully", async () => {
      const newUser = { ...mockUser };

      mockUserRepo.findOne = jest.fn().mockResolvedValue(null);
      mockUserRepo.create = jest.fn().mockReturnValue(newUser);
      mockUserRepo.save = jest.fn().mockResolvedValue(newUser);
      mockUserOauthRepo.create = jest
        .fn()
        .mockReturnValue({} as Partial<user_oauth>);
      mockUserOauthRepo.save = jest
        .fn()
        .mockRejectedValue(new Error("OAuth save failed"));

      await expect(
        service.saveLinkedInUser(mockProfile, mockTokenData),
      ).rejects.toThrow(
        new InternalServerErrorException("Failed to save OAuth data"),
      );
    });
  });

  describe("handleLinkedInCallback", () => {
    it("should handle complete LinkedIn OAuth flow successfully", async () => {
      const mockResponse1: AxiosResponse = {
        data: mockTokenData,
        status: 200,
        statusText: "OK",
        headers: {},
        config: { headers: {} as import("axios").AxiosHeaders },
      };

      const mockResponse2: AxiosResponse = {
        data: mockProfile,
        status: 200,
        statusText: "OK",
        headers: {},
        config: { headers: {} as import("axios").AxiosHeaders },
      };

      mockHttpService.axiosRef!.post = jest
        .fn()
        .mockResolvedValue(mockResponse1);
      mockHttpService.axiosRef!.get = jest
        .fn()
        .mockResolvedValue(mockResponse2);
      mockUserRepo.findOne = jest.fn().mockResolvedValue(mockUser);
      mockJwtService.signAsync = jest.fn().mockResolvedValue("final-jwt-token");

      const result = await service.handleLinkedInCallback("test-code");

      expect(result).toEqual({ accessToken: "final-jwt-token" });
    });

    it("should handle errors in the complete flow", async () => {
      mockHttpService.axiosRef!.post = jest
        .fn()
        .mockRejectedValue(new Error("Token fetch failed"));

      await expect(service.handleLinkedInCallback("test-code")).rejects.toThrow(
        new InternalServerErrorException("Failed to fetch access token"),
      );
    });
  });
});
