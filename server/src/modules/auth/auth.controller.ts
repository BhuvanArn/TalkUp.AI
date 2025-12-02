import {
  Body,
  Controller,
  Post,
  Res,
  Get,
  Patch,
  UseGuards,
  HttpCode,
} from "@nestjs/common";
import { AccessTokenGuard } from "@common/guards/accessToken.guard";
import { UsePipes } from "@nestjs/common/decorators/core/use-pipes.decorator";
import { Response, CookieOptions } from "express";

import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiUnprocessableEntityResponse,
  ApiTags,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { CreateUserDto } from "./dto/createUser.dto";
import { LoginDto } from "./dto/login.dto";
import { EditUserDto } from "./dto/editUser.dto";

import { PostValidationPipe } from "@common/pipes/PostValidationPipe";
import { UserId } from "@common/decorators/userId.decorator";

import { AuthService } from "./auth.service";

const COOKIE_NAME = "accessToken";
const DEFAULT_COOKIE_MAX_AGE = 48 * 60 * 60 * 1000;
const COOKIE_MAX_AGE = process.env.COOKIE_MAX_AGE
  ? parseInt(process.env.COOKIE_MAX_AGE, 10)
  : DEFAULT_COOKIE_MAX_AGE;

const BASE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  domain:
    process.env.NODE_ENV === "production"
      ? process.env.COOKIE_DOMAIN
      : undefined,
};

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  @HttpCode(200)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    const result = await this.authService.login(user);

    const cookieOptions = {
      ...BASE_COOKIE_OPTIONS,
      maxAge: COOKIE_MAX_AGE,
    };

    response.cookie(COOKIE_NAME, result.accessToken, cookieOptions);

    return { message: "Login successful" };
  }

  @ApiOkResponse({
    description: "User successfully logged out.",
  })
  @ApiUnauthorizedResponse({
    description: "User is not authenticated or token is invalid.",
  })
  @UseGuards(AccessTokenGuard)
  @HttpCode(200)
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
    description: "User is authenticated.",
  })
  @ApiUnauthorizedResponse({
    description: "User is not authenticated or token is invalid.",
  })
  @UseGuards(AccessTokenGuard)
  @Get("status")
  async getAuthStatus() {
    return { authenticated: true };
  }

  @Patch("editUser")
  @UseGuards(AccessTokenGuard)
  @ApiOkResponse({ description: "User updated successfully." })
  async editUser(@UserId() userId: string, @Body() editUserDto: EditUserDto) {
    return await this.authService.editUser(userId, editUserDto);
  }
}
