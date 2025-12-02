import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { applyMockAccessTokenGuard } from "@src/test/utils/mock-guards";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "./dto/createUser.dto";
import { LoginDto } from "./dto/login.dto";

describe("AuthController", () => {
  let controller: AuthController;
  let mockAuthService: Partial<AuthService>;

  const mockUser = {
    user_id: "test-user-id",
    username: "testuser",
    profile_picture: "",
    provider: "",
    verification_code: "",
    last_accessed_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    mockAuthService = {
      register: jest.fn(),
      validateUser: jest.fn(),
      login: jest.fn(),
    };

    const moduleBuilder = Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    });

    const module: TestingModule =
      await applyMockAccessTokenGuard(moduleBuilder).compile();
    controller = module.get<AuthController>(AuthController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("register", () => {
    const createUserDto: CreateUserDto = {
      username: "testuser",
      email: "testuser@example.com",
      password: "password123",
    };

    it("should successfully register a new user", async () => {
      const expectedResponse = { accessToken: "jwt-token-123" };
      mockAuthService.register = jest.fn().mockResolvedValue(expectedResponse);

      const result = await controller.register(createUserDto);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith(createUserDto);
      expect(mockAuthService.register).toHaveBeenCalledTimes(1);
    });

    it("should throw ConflictException when email already exists", async () => {
      const conflictError = new ConflictException(
        "An account with this email already exists",
      );
      mockAuthService.register = jest.fn().mockRejectedValue(conflictError);

      await expect(controller.register(createUserDto)).rejects.toThrow(
        conflictError,
      );

      expect(mockAuthService.register).toHaveBeenCalledWith(createUserDto);
      expect(mockAuthService.register).toHaveBeenCalledTimes(1);
    });

    it("should handle service errors properly", async () => {
      const serviceError = new Error("Database connection failed");
      mockAuthService.register = jest.fn().mockRejectedValue(serviceError);

      await expect(controller.register(createUserDto)).rejects.toThrow(
        serviceError,
      );

      expect(mockAuthService.register).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe("login", () => {
    const loginDto: LoginDto = {
      email: "testuser@example.com",
      password: "password123",
    };

    it("should successfully login a user", async () => {
      const expectedLoginResponse = { access_token: "login-jwt-token" };
      mockAuthService.validateUser = jest.fn().mockResolvedValue(mockUser);
      mockAuthService.login = jest.fn().mockReturnValue(expectedLoginResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedLoginResponse);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        "testuser@example.com",
        "password123",
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(mockUser);
      expect(mockAuthService.validateUser).toHaveBeenCalledTimes(1);
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    });

    it("should throw UnauthorizedException when email not found", async () => {
      const unauthorizedError = new UnauthorizedException("Email not found");
      mockAuthService.validateUser = jest
        .fn()
        .mockRejectedValue(unauthorizedError);

      await expect(controller.login(loginDto)).rejects.toThrow(
        unauthorizedError,
      );

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        "testuser@example.com",
        "password123",
      );
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException when password is invalid", async () => {
      const invalidPasswordError = new UnauthorizedException(
        "Invalid password",
      );
      mockAuthService.validateUser = jest
        .fn()
        .mockRejectedValue(invalidPasswordError);

      await expect(controller.login(loginDto)).rejects.toThrow(
        invalidPasswordError,
      );

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        "testuser@example.com",
        "password123",
      );
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it("should handle different login credentials", async () => {
      const customLoginDto: LoginDto = {
        email: "different@example.com",
        password: "differentPassword",
      };
      const expectedResponse = { access_token: "custom-token" };

      mockAuthService.validateUser = jest.fn().mockResolvedValue(mockUser);
      mockAuthService.login = jest.fn().mockReturnValue(expectedResponse);

      const result = await controller.login(customLoginDto);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        "different@example.com",
        "differentPassword",
      );
    });

    it("should handle service validation errors properly", async () => {
      const serviceError = new Error("Database connection failed");
      mockAuthService.validateUser = jest.fn().mockRejectedValue(serviceError);

      await expect(controller.login(loginDto)).rejects.toThrow(serviceError);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        "testuser@example.com",
        "password123",
      );
    });
  });
});
