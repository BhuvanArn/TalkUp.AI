import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";

import { AuthService } from "./auth.service";
import { CreateUserDto } from "./dto/createUser.dto";

import { user, user_password, user_email } from "@entities/user.entity";

jest.mock("bcrypt");
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

jest.mock("@common/utils/passwordHasher", () => ({
  hashPassword: jest.fn().mockResolvedValue("hashed-password"),
}));

describe("AuthService", () => {
  let service: AuthService;
  let mockUserRepo: Partial<Repository<user>>;
  let mockUserEmailRepo: Partial<Repository<user_email>>;
  let mockUserPasswordRepo: Partial<Repository<user_password>>;
  let mockJwtService: Partial<JwtService>;

  const mockUser: user = {
    user_id: "test-user-id",
    username: "testuser",
    profile_picture: "",
    provider: "",
    verification_code: "",
    organization_id: null,
    user_role: "user",
    last_accessed_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    generateUUIDv7: (): string => "test-uuid",
  };

  const mockEmail = {
    email_id: 1,
    user_id: "test-user-id",
    email: "test@example.com",
    is_verified: false,
  };

  const mockPassword = {
    password_id: 1,
    user_id: "test-user-id",
    password: "hashed-password",
  };

  beforeEach(async () => {
    mockUserRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockUserEmailRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockUserPasswordRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockJwtService = {
      signAsync: jest.fn(),
      sign: jest.fn(),
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(user),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(user_email),
          useValue: mockUserEmailRepo,
        },
        {
          provide: getRepositoryToken(user_password),
          useValue: mockUserPasswordRepo,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("register", () => {
    const createUserDto: CreateUserDto = {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    };

    it("should successfully register a new user", async () => {
      mockUserEmailRepo.findOne = jest.fn().mockResolvedValue(null);
      mockUserRepo.create = jest.fn().mockReturnValue(mockUser);
      mockUserRepo.save = jest.fn().mockResolvedValue(mockUser);
      mockUserPasswordRepo.create = jest.fn().mockReturnValue(mockPassword);
      mockUserPasswordRepo.save = jest.fn().mockResolvedValue(mockPassword);
      mockUserEmailRepo.create = jest.fn().mockReturnValue(mockEmail);
      mockUserEmailRepo.save = jest.fn().mockResolvedValue(mockEmail);
      mockJwtService.signAsync = jest.fn().mockResolvedValue("jwt-token");

      const result = await service.register(createUserDto);

      expect(result).toEqual({ accessToken: "jwt-token" });
      expect(mockUserEmailRepo.findOne).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        username: "testuser",
        organization_id: null,
        user_role: "user",
      });
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        userId: "test-user-id",
        username: "testuser",
      });
    });

    it("should throw ConflictException if email already exists", async () => {
      mockUserEmailRepo.findOne = jest.fn().mockResolvedValue(mockEmail);

      await expect(service.register(createUserDto)).rejects.toThrow(
        new ConflictException("An account with this email already exists"),
      );

      expect(mockUserEmailRepo.findOne).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(mockUserRepo.create).not.toHaveBeenCalled();
    });
  });

  describe("validateUser", () => {
    const email = "test@example.com";
    const password = "password123";

    it("should successfully validate user with correct credentials", async () => {
      mockUserEmailRepo.findOne = jest.fn().mockResolvedValue(mockEmail);
      mockUserPasswordRepo.findOne = jest.fn().mockResolvedValue(mockPassword);
      mockUserRepo.findOne = jest.fn().mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser(email, password);

      expect(result).toEqual(mockUser);
      expect(mockUserEmailRepo.findOne).toHaveBeenCalledWith({
        where: { email: email },
      });
      expect(mockUserPasswordRepo.findOne).toHaveBeenCalledWith({
        where: { user_id: "test-user-id" },
      });
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { user_id: "test-user-id" },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, "hashed-password");
    });

    it("should throw UnauthorizedException if email not found", async () => {
      mockUserEmailRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.validateUser(email, password)).rejects.toThrow(
        new UnauthorizedException("Email not found"),
      );

      expect(mockUserEmailRepo.findOne).toHaveBeenCalledWith({
        where: { email: email },
      });
      expect(mockUserPasswordRepo.findOne).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException if password entity not found", async () => {
      mockUserEmailRepo.findOne = jest.fn().mockResolvedValue(mockEmail);
      mockUserPasswordRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.validateUser(email, password)).rejects.toThrow(
        new UnauthorizedException("Email not found"),
      );
    });

    it("should throw UnauthorizedException if user entity not found", async () => {
      mockUserEmailRepo.findOne = jest.fn().mockResolvedValue(mockEmail);
      mockUserPasswordRepo.findOne = jest.fn().mockResolvedValue(mockPassword);
      mockUserRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.validateUser(email, password)).rejects.toThrow(
        new UnauthorizedException("Email not found"),
      );
    });

    it("should throw UnauthorizedException if password doesn't match", async () => {
      mockUserEmailRepo.findOne = jest.fn().mockResolvedValue(mockEmail);
      mockUserPasswordRepo.findOne = jest.fn().mockResolvedValue(mockPassword);
      mockUserRepo.findOne = jest.fn().mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.validateUser(email, password)).rejects.toThrow(
        new UnauthorizedException("Invalid password"),
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(password, "hashed-password");
    });
  });

  describe("login", () => {
    it("should return access token for valid user", async () => {
      mockJwtService.signAsync = jest
        .fn()
        .mockResolvedValue("signed-jwt-token");

      const result = await service.login(mockUser);

      expect(result).toEqual({ accessToken: "signed-jwt-token" });
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        userId: "test-user-id",
        username: "testuser",
      });
    });

    it("should handle different user IDs correctly", async () => {
      const differentUser = {
        ...mockUser,
        user_id: "different-user-id",
        generateUUIDv7: (): string => "test-uuid",
      };
      mockJwtService.signAsync = jest.fn().mockResolvedValue("different-token");

      const result = await service.login(differentUser);

      expect(result).toEqual({ accessToken: "different-token" });
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        userId: "different-user-id",
        username: "testuser",
      });
    });
  });

  describe("getUserById", () => {
    it("should return user when found", async () => {
      mockUserRepo.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await service.getUserById("test-user-id");

      expect(result).toEqual(mockUser);
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { user_id: "test-user-id" },
      });
    });

    it("should return null when user not found", async () => {
      mockUserRepo.findOne = jest.fn().mockResolvedValue(null);

      const result = await service.getUserById("non-existent-id");

      expect(result).toBeNull();
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { user_id: "non-existent-id" },
      });
    });
  });

  describe("verifyAccessToken", () => {
    const validToken = "valid-jwt-token";
    const payload = { userId: "test-user-id", username: "testuser" };

    it("should return user when token is valid and user exists", async () => {
      mockJwtService.verifyAsync = jest.fn().mockResolvedValue(payload);
      mockUserRepo.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await service.verifyAccessToken(validToken);

      expect(result).toEqual(mockUser);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(validToken);
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { user_id: "test-user-id" },
      });
    });

    it("should throw UnauthorizedException when token is invalid", async () => {
      mockJwtService.verifyAsync = jest
        .fn()
        .mockRejectedValue(new Error("Invalid token"));

      await expect(service.verifyAccessToken("invalid-token")).rejects.toThrow(
        new UnauthorizedException("Invalid or expired access token"),
      );

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith("invalid-token");
      expect(mockUserRepo.findOne).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException when token payload is missing userId", async () => {
      const invalidPayload = { username: "testuser" };
      mockJwtService.verifyAsync = jest.fn().mockResolvedValue(invalidPayload);

      await expect(service.verifyAccessToken(validToken)).rejects.toThrow(
        new UnauthorizedException("Invalid token payload"),
      );

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(validToken);
      expect(mockUserRepo.findOne).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException when user not found in database", async () => {
      mockJwtService.verifyAsync = jest.fn().mockResolvedValue(payload);
      mockUserRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.verifyAccessToken(validToken)).rejects.toThrow(
        new UnauthorizedException("User not found"),
      );

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(validToken);
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { user_id: "test-user-id" },
      });
    });

    it("should throw UnauthorizedException when token is expired", async () => {
      mockJwtService.verifyAsync = jest
        .fn()
        .mockRejectedValue(new Error("Token expired"));

      await expect(service.verifyAccessToken(validToken)).rejects.toThrow(
        new UnauthorizedException("Invalid or expired access token"),
      );
    });
  });
});
