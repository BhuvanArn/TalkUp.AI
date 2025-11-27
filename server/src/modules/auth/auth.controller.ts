import { Body, Controller, Post, Res, Get, Req } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsePipes } from "@nestjs/common/decorators/core/use-pipes.decorator";
import { Request, Response, CookieOptions } from "express";

import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiUnprocessableEntityResponse,
  ApiTags,
  ApiOkResponse,
} from "@nestjs/swagger";

import { CreateUserDto } from "./dto/createUser.dto";
import { LoginDto } from "./dto/login.dto";

import { PostValidationPipe } from "@common/pipes/PostValidationPipe";

import { AuthService } from "./auth.service";

const COOKIE_NAME = "accessToken";
const COOKIE_MAX_AGE = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

const BASE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @ApiCreatedResponse({
    description: "The user has been successfully created.",
    type: CreateUserDto,
  })
  @ApiBadRequestResponse({
    description: "Badly formatted parameter.",
  })
  @ApiConflictResponse({
    description: "User already exists.",
  })
  @ApiUnprocessableEntityResponse({
    description: "Missing parameter in request.",
  })
  @UsePipes(new PostValidationPipe())
  @Post("register")
  async register(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(createUserDto);

    response.cookie(COOKIE_NAME, result.accessToken, {
      ...BASE_COOKIE_OPTIONS,
      maxAge: COOKIE_MAX_AGE,
    });

    return { message: "Registration successful" };
  }

  @ApiOkResponse({
    description: "User successfully logged in.",
    type: String,
  })
  @UsePipes(new PostValidationPipe())
  @Post("login")
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    const result = await this.authService.login(user);

    response.cookie(COOKIE_NAME, result.accessToken, {
      ...BASE_COOKIE_OPTIONS,
      maxAge: COOKIE_MAX_AGE,
    });

    return { message: "Login successful" };
  }

  @ApiOkResponse({
    description: "User successfully logged out.",
  })
  @Post("logout")
  async logout(@Res({ passthrough: true }) response: Response) {
    response.cookie(COOKIE_NAME, "", {
      ...BASE_COOKIE_OPTIONS,
      maxAge: 0,
      expires: new Date(0),
    });

    return { message: "Logout successful" };
  }

  @ApiOkResponse({
    description: "Returns authentication status.",
  })
  @Get("status")
  async getAuthStatus(@Req() request: Request) {
    try {
      const token = request.cookies?.accessToken;
      if (!token) {
        return { authenticated: false };
      }

      const payload = await this.jwtService.verifyAsync(token);

      const user = await this.authService.getUserById(payload.userId);
      if (!user) {
        return { authenticated: false };
      }

      return { authenticated: true };
    } catch {
      return { authenticated: false };
    }
  }
}
