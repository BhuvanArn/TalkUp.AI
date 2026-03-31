import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

/**
 * Protects internal-only org creation (`POST /organization`).
 * Requires header `x-org-provisioning-secret` matching env `ORG_PROVISIONING_SECRET`.
 */
@Injectable()
export class OrganizationProvisioningGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const secret = process.env.ORG_PROVISIONING_SECRET;
    if (!secret) {
      throw new ForbiddenException(
        "Organization provisioning is not configured",
      );
    }

    const req = context.switchToHttp().getRequest();
    const header = req.headers["x-org-provisioning-secret"];
    if (typeof header !== "string" || header !== secret) {
      throw new UnauthorizedException(
        "Invalid organization provisioning credentials",
      );
    }

    return true;
  }
}
