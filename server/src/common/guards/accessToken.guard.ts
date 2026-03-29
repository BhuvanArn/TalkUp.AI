import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { user } from "@entities/user.entity";

/**
 * Guard that verifies the presence and validity of an access token in cookies.
 * If valid, it attaches the userId and full user entity to the request object.
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
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(user)
    private readonly userRepository: Repository<user>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const token = req.cookies?.accessToken;

    if (!token || typeof token !== "string") {
      throw new UnauthorizedException(
        "Authentication token missing or malformed",
      );
    }

    let payload: Record<string, unknown>;

    try {
      payload = (await this.jwtService.verifyAsync(token)) as Record<
        string,
        unknown
      >;
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }

    const userId =
      typeof payload.userId === "string"
        ? payload.userId
        : typeof payload.sub === "string"
          ? payload.sub
          : null;
    const tokenVersion =
      typeof payload.tv === "number"
        ? payload.tv
        : typeof payload.tv === "string"
          ? Number(payload.tv)
          : NaN;

    if (!userId || Number.isNaN(tokenVersion)) {
      throw new UnauthorizedException("Invalid token payload");
    }

    const foundUser = await this.userRepository.findOne({
      where: { user_id: userId },
    });

    if (!foundUser || (foundUser.tokenVersion ?? 1) !== tokenVersion) {
      throw new UnauthorizedException("Session is no longer valid");
    }

    req.userId = foundUser.user_id;
    req.user = foundUser;

    return true;
  }
}
