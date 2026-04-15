import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import {
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { AccessTokenGuard } from "@common/guards/accessToken.guard";
import { PostValidationPipe } from "@common/pipes/PostValidationPipe";
import { CurrentUser } from "@common/decorators/currentUser.decorator";

import { user } from "@entities/user.entity";

import { UpdateProfileDto } from "./dto/updateProfile.dto";
import { UsersService } from "./users.service";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOkResponse({ description: "Current user profile" })
  @ApiUnauthorizedResponse()
  @UseGuards(AccessTokenGuard)
  @Get("me")
  async getMe(@CurrentUser() user: user) {
    return this.usersService.getProfile(user);
  }

  @ApiOkResponse({ description: "Updated profile" })
  @ApiUnauthorizedResponse()
  @UseGuards(AccessTokenGuard)
  @UsePipes(new PostValidationPipe())
  @Patch("me")
  @HttpCode(HttpStatus.OK)
  async patchMe(
    @CurrentUser() user: user,
    @Body() body: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user, body);
  }

  @ApiOkResponse({ description: "Account deleted" })
  @ApiUnauthorizedResponse()
  @UseGuards(AccessTokenGuard)
  @Delete("me")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(@CurrentUser() user: user): Promise<void> {
    await this.usersService.deleteAccount(user);
  }
}
