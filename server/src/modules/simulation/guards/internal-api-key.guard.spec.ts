import { ExecutionContext, UnauthorizedException } from "@nestjs/common";

import { InternalApiKeyGuard } from "./internal-api-key.guard";

describe("InternalApiKeyGuard", () => {
  let guard: InternalApiKeyGuard;
  const ORIGINAL_ENV = { ...process.env };

  const makeContext = (headerValue?: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          header: (_name: string) => headerValue,
        }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    guard = new InternalApiKeyGuard();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("throws when SIM_INTERNAL_API_KEY is not configured", () => {
    delete process.env.SIM_INTERNAL_API_KEY;

    expect(() => guard.canActivate(makeContext("anything"))).toThrow(
      UnauthorizedException,
    );
  });

  it("throws when no key header is provided", () => {
    process.env.SIM_INTERNAL_API_KEY = "secret";

    expect(() => guard.canActivate(makeContext(undefined))).toThrow(
      UnauthorizedException,
    );
  });

  it("throws when the provided key does not match", () => {
    process.env.SIM_INTERNAL_API_KEY = "secret";

    expect(() => guard.canActivate(makeContext("wrong"))).toThrow(
      UnauthorizedException,
    );
  });

  it("allows the request when the key matches (trimmed)", () => {
    process.env.SIM_INTERNAL_API_KEY = "secret";

    expect(guard.canActivate(makeContext("  secret  "))).toBe(true);
  });
});
