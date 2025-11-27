import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "./dto/createUser.dto";
import { LoginDto } from "./dto/login.dto";

describe("AuthController", () => {
  let controller: AuthController;
  let mockAuthService: Partial<AuthService>;
  let mockJwtService: Partial<JwtService>;

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
      getUserById: jest.fn(),
    };

    mockJwtService = {
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

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
      const serviceResponse = { accessToken: "jwt-token-123" };
      mockAuthService.register = jest.fn().mockResolvedValue(serviceResponse);

      const mockResponse: any = { cookie: jest.fn() };

      const result = await controller.register(createUserDto, mockResponse);

      expect(result).toEqual({ message: "Registration successful" });
      expect(mockAuthService.register).toHaveBeenCalledWith(createUserDto);
      expect(mockAuthService.register).toHaveBeenCalledTimes(1);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "accessToken",
        serviceResponse.accessToken,
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it("should throw ConflictException when email already exists", async () => {
      const conflictError = new ConflictException(
        "An account with this email already exists",
      );
      mockAuthService.register = jest.fn().mockRejectedValue(conflictError);

      const mockResponse: any = { cookie: jest.fn() };

      await expect(
        controller.register(createUserDto, mockResponse),
      ).rejects.toThrow(conflictError);

      expect(mockAuthService.register).toHaveBeenCalledWith(createUserDto);
      expect(mockAuthService.register).toHaveBeenCalledTimes(1);
    });

    it("should handle service errors properly", async () => {
      const serviceError = new Error("Database connection failed");
      mockAuthService.register = jest.fn().mockRejectedValue(serviceError);

      const mockResponse: any = { cookie: jest.fn() };

      await expect(
        controller.register(createUserDto, mockResponse),
      ).rejects.toThrow(serviceError);

      expect(mockAuthService.register).toHaveBeenCalledWith(createUserDto);
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
    it("should return authenticated: true when token is valid", async () => {
      const mockRequest: any = {
        cookies: { accessToken: "valid-token" },
      };
      const payload = { userId: "user-id" };
      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);
      mockAuthService.getUserById = jest.fn().mockResolvedValue(mockUser);

      const result = await controller.getAuthStatus(mockRequest);

      expect(result).toEqual({ authenticated: true });
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith("valid-token");
      expect(mockAuthService.getUserById).toHaveBeenCalledWith("user-id");
    });

    it("should return authenticated: false when no token provided", async () => {
      const mockRequest: any = {
        cookies: {},
      };

      const result = await controller.getAuthStatus(mockRequest);

      expect(result).toEqual({ authenticated: false });
      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it("should return authenticated: false when token is invalid", async () => {
      const mockRequest: any = {
        cookies: { accessToken: "invalid-token" },
      };
      (mockJwtService.verifyAsync as jest.Mock).mockRejectedValue(
        new Error("Invalid token"),
      );

      const result = await controller.getAuthStatus(mockRequest);

      expect(result).toEqual({ authenticated: false });
    });

    it("should return authenticated: false when user not found", async () => {
      const mockRequest: any = {
        cookies: { accessToken: "valid-token" },
      };
      const payload = { userId: "user-id" };
      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);
      mockAuthService.getUserById = jest.fn().mockResolvedValue(null);

      const result = await controller.getAuthStatus(mockRequest);

      expect(result).toEqual({ authenticated: false });
    });
  });
});
