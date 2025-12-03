import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { AuthService } from "../../modules/auth/auth.service";

/**
 * Guard that verifies the presence and validity of an access token in cookies.
 * If valid, it attaches the userId to the request object.
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
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const token = req.cookies?.accessToken;

    if (!token || typeof token !== "string") {
      throw new UnauthorizedException(
        "Authentication token missing or malformed",
      );
    }

    const user = await this.authService.verifyAccessToken(token);

    req.userId = user.user_id;

    return true;
  }
}
