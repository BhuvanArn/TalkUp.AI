import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";

import { OrganizationProvisioningGuard } from "./organizationProvisioning.guard";

describe("OrganizationProvisioningGuard", () => {
  let guard: OrganizationProvisioningGuard;
  let prevSecret: string | undefined;

  const makeContext = (headers: Record<string, unknown>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    guard = new OrganizationProvisioningGuard();
    prevSecret = process.env.ORG_PROVISIONING_SECRET;
    process.env.ORG_PROVISIONING_SECRET = "expected-secret";
  });

  afterEach(() => {
    if (prevSecret === undefined) {
      delete process.env.ORG_PROVISIONING_SECRET;
    } else {
      process.env.ORG_PROVISIONING_SECRET = prevSecret;
    }
  });

  it("throws ForbiddenException when ORG_PROVISIONING_SECRET is not set", () => {
    delete process.env.ORG_PROVISIONING_SECRET;

    expect(() =>
      guard.canActivate(makeContext({ "x-org-provisioning-secret": "x" })),
    ).toThrow(ForbiddenException);
  });

  it("throws UnauthorizedException when header is missing", () => {
    expect(() => guard.canActivate(makeContext({}))).toThrow(
      UnauthorizedException,
    );
  });

  it("throws UnauthorizedException when header is not a string", () => {
    expect(() =>
      guard.canActivate(
        makeContext({ "x-org-provisioning-secret": ["a", "b"] }),
      ),
    ).toThrow(UnauthorizedException);
  });

  it("throws UnauthorizedException when header does not match secret", () => {
    expect(() =>
      guard.canActivate(makeContext({ "x-org-provisioning-secret": "wrong" })),
    ).toThrow(UnauthorizedException);
  });

  it("returns true when header matches secret", () => {
    expect(
      guard.canActivate(
        makeContext({ "x-org-provisioning-secret": "expected-secret" }),
      ),
    ).toBe(true);
  });
});
