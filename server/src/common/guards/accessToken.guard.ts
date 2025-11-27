import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { user } from "@entities/user.entity";

/**
 * Guard that verifies the presence and validity of an access token in the Authorization header.
 * If valid, it attaches the userId and user payload to the request object.
 *
 * Throws UnauthorizedException if the token is missing, malformed, or invalid.
 *
 * Usage:
 * ```
 * import { UseGuards } from "@nestjs/common";
 * import { AccessTokenGuard } from "./path/to/accessToken.guard";
 *
 * export class SomeProtectedController {
 *
 * @UseGuards(AccessTokenGuard)
 * someProtectedRoute() {
 *   // This route is protected by the AccessTokenGuard.
 * }
 * }
 * ```
 *
 * This guard can be applied to routes that require authentication.
 */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  private readonly logger: Logger = new Logger(AccessTokenGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(user) private readonly userRepository: Repository<user>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const token = req.cookies?.accessToken;

    if (!token || typeof token !== "string") {
      throw new UnauthorizedException(
        "Authentication token missing or malformed",
      );
    }

    // Verify accesstoken JWT
    let payload;
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }

    // Extract userId from JWT payload
    const userId = payload.userId;
    if (!userId)
      throw new UnauthorizedException("Token payload missing user id");

    // Verify user exists in DB
    let foundUser: any;
    try {
      foundUser = await this.userRepository.findOne({
        where: { user_id: String(userId) },
      });
    } catch (err) {
      this.logger.error(`Failed to find user in repository : ${err.message}`);
      throw new InternalServerErrorException(
        "Internal server error while checking existing user.",
      );
    }

    if (!foundUser) {
      throw new UnauthorizedException("User not found");
    }

    // Success ! User found and has good JWT
    req.userId = userId;
    return true;
  }
}
