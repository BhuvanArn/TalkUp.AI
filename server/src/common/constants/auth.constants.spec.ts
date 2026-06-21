import { expiryToMs } from "./auth.constants";

describe("auth.constants / expiryToMs", () => {
  it("treats numeric input as seconds", () => {
    expect(expiryToMs(120)).toBe(120_000);
  });

  it("treats all-digit strings as seconds", () => {
    expect(expiryToMs("90")).toBe(90_000);
  });

  it.each([
    ["1ms", 1],
    ["2s", 2000],
    ["3m", 3 * 60 * 1000],
    ["4h", 4 * 60 * 60 * 1000],
    ["5d", 5 * 24 * 60 * 60 * 1000],
    ["1w", 7 * 24 * 60 * 60 * 1000],
    [" 10M ", 10 * 60 * 1000],
  ])("parses %s", (input, expected) => {
    expect(expiryToMs(input)).toBe(expected);
  });

  it("throws on unsupported format", () => {
    expect(() => expiryToMs("12x")).toThrow(/Unsupported JWT expiry format/);
  });
});

describe("auth.constants (module env branches)", () => {
  const origNodeEnv = process.env.NODE_ENV;
  const origCookieSameSite = process.env.COOKIE_SAMESITE;
  const origJwtAccess = process.env.JWT_ACCESS_EXPIRES_IN;

  afterEach(() => {
    process.env.NODE_ENV = origNodeEnv;
    process.env.COOKIE_SAMESITE = origCookieSameSite;
    if (origJwtAccess === undefined) {
      delete process.env.JWT_ACCESS_EXPIRES_IN;
    } else {
      process.env.JWT_ACCESS_EXPIRES_IN = origJwtAccess;
    }
    jest.resetModules();
  });

  it("uses __Host- cookie names when NODE_ENV is production", async () => {
    process.env.NODE_ENV = "production";
    jest.resetModules();
    const mod = await import("./auth.constants");
    expect(mod.ACCESS_COOKIE_NAME).toBe("__Host-access_token");
    expect(mod.REFRESH_COOKIE_NAME).toBe("__Host-refresh_token");
    expect(mod.BASE_COOKIE_OPTIONS.secure).toBe(true);
  });

  it("honors COOKIE_SAMESITE when set", async () => {
    process.env.COOKIE_SAMESITE = "strict";
    jest.resetModules();
    const mod = await import("./auth.constants");
    expect(mod.BASE_COOKIE_OPTIONS.sameSite).toBe("strict");
  });

  it("allows COOKIE_SAMESITE none for cross-site flows", async () => {
    process.env.COOKIE_SAMESITE = "none";
    jest.resetModules();
    const mod = await import("./auth.constants");
    expect(mod.BASE_COOKIE_OPTIONS.sameSite).toBe("none");
  });

  it("derives ACCESS_TOKEN_MAX_AGE_MS from JWT_ACCESS_EXPIRES_IN", async () => {
    process.env.JWT_ACCESS_EXPIRES_IN = "2h";
    jest.resetModules();
    const mod = await import("./auth.constants");
    expect(mod.ACCESS_TOKEN_MAX_AGE_MS).toBe(2 * 60 * 60 * 1000);
  });
});
