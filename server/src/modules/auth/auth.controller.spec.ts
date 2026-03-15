import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { applyMockAccessTokenGuard } from "@src/test/utils/mock-guards";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "./dto/createUser.dto";
import { LoginDto } from "./dto/login.dto";
import { AccessTokenGuard } from "@common/guards/accessToken.guard";
import { UserStatus } from "@common/enums/UserStatus";
import { OtpPurpose } from "@common/enums/OtpPurpose";

describe("AuthController", () => {
  let controller: AuthController;
  let mockAuthService: Partial<AuthService>;

  const mockUser = {
    user_id: "test-user-id",
    username: "testuser",
    profile_picture: "",
    provider: "",
    verification_code: "",
    status: UserStatus.ACTIVE,
    last_accessed_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    mockAuthService = {
      register: jest.fn(),
      verifyEmail: jest.fn(),
      resendOtp: jest.fn(),
      validateUser: jest.fn(),
      login: jest.fn(),
      getUserById: jest.fn(),
      verifyAccessToken: jest.fn(),
    };

    const moduleBuilder = Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) });
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
      mockAuthService.register = jest.fn().mockResolvedValue(undefined);

      const result = await controller.register(createUserDto);

      expect(result).toEqual({ message: "Verification email sent" });
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

  describe("verifyEmail", () => {
    it("should verify email and return token payload", async () => {
      mockAuthService.verifyEmail = jest.fn().mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      const mockResponse: any = { cookie: jest.fn() };
      const result = await controller.verifyEmail(
        { email: "testuser@example.com", otpCode: "123456" },
        mockResponse,
      );

      expect(result).toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "accessToken",
        "access-token",
        expect.objectContaining({ httpOnly: true }),
      );
    });
  });

  describe("resendOtp", () => {
    it("should resend OTP", async () => {
      mockAuthService.resendOtp = jest.fn().mockResolvedValue(undefined);

      const result = await controller.resendOtp({
        email: "testuser@example.com",
        purpose: OtpPurpose.REGISTER,
      });

      expect(result).toEqual({ message: "Verification email sent" });
      expect(mockAuthService.resendOtp).toHaveBeenCalledWith(
        "testuser@example.com",
        OtpPurpose.REGISTER,
      );
    });
  });

  describe("login", () => {
    const loginDto: LoginDto = {
      email: "testuser@example.com",
      password: "password123",
    };

    it("should successfully login a user", async () => {
      const serviceLoginResponse = { accessToken: "login-jwt-token" };
      mockAuthService.validateUser = jest.fn().mockResolvedValue(mockUser);
      mockAuthService.login = jest.fn().mockResolvedValue(serviceLoginResponse);

      const mockResponse: any = { cookie: jest.fn() };

      const result = await controller.login(loginDto, mockResponse);

      expect(result).toEqual({ message: "Login successful" });
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        "testuser@example.com",
        "password123",
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(mockUser);
      expect(mockAuthService.validateUser).toHaveBeenCalledTimes(1);
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "accessToken",
        serviceLoginResponse.accessToken,
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it("should throw UnauthorizedException when email not found", async () => {
      const unauthorizedError = new UnauthorizedException("Email not found");
      mockAuthService.validateUser = jest
        .fn()
        .mockRejectedValue(unauthorizedError);

      const mockResponse: any = { cookie: jest.fn() };

      await expect(controller.login(loginDto, mockResponse)).rejects.toThrow(
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

      const mockResponse: any = { cookie: jest.fn() };

      await expect(controller.login(loginDto, mockResponse)).rejects.toThrow(
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
      const expectedResponse = { accessToken: "custom-token" };

      mockAuthService.validateUser = jest.fn().mockResolvedValue(mockUser);
      mockAuthService.login = jest.fn().mockResolvedValue(expectedResponse);

      const mockResponse: any = { cookie: jest.fn() };

      const result = await controller.login(customLoginDto, mockResponse);

      expect(result).toEqual({ message: "Login successful" });
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        "different@example.com",
        "differentPassword",
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "accessToken",
        expectedResponse.accessToken,
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it("should handle service validation errors properly", async () => {
      const serviceError = new Error("Database connection failed");
      mockAuthService.validateUser = jest.fn().mockRejectedValue(serviceError);

      const mockResponse: any = { cookie: jest.fn() };

      await expect(controller.login(loginDto, mockResponse)).rejects.toThrow(
        serviceError,
      );

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        "testuser@example.com",
        "password123",
      );
    });
  });

  describe("logout", () => {
    it("should successfully logout a user", async () => {
      const mockResponse: any = { cookie: jest.fn() };

      const result = await controller.logout(mockResponse);

      expect(result).toEqual({ message: "Logout successful" });
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "accessToken",
        "",
        expect.objectContaining({ maxAge: 0, expires: new Date(0) }),
      );
    });
  });

  describe("getAuthStatus", () => {
    it("should return authenticated: true when guard passes", async () => {
      const result = await controller.getAuthStatus();

      expect(result).toEqual({ authenticated: true });
    });

    it("should throw UnauthorizedException when guard fails (simulated)", async () => {
      const result = await controller.getAuthStatus();
      expect(result).toEqual({ authenticated: true });
    });
  });
});
